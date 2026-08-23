import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Mail,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { askAiCopilot, SYSTEM_INSTRUCTION } from "@/lib/askAi.functions";
import { buildChatContext, formatContextForPrompt } from "@/lib/chatContext";
import { computeFactoryKpis, pct } from "@/lib/kpis";
import { MACHINES, SEED_ALERTS, TARGET_MACHINE } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";
import type { ChatMessage } from "@/types";

export const Route = createFileRoute("/chat")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Ask AI Copilot — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Conversational factory copilot powered by Gemini 3.5 Flash-Lite grounded in live telemetry, multi-agent investigations, and cross-modal evidence.",
      },
      { property: "og:title", content: "Ask AI Copilot — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Factory operations copilot powered by Google Gemini 3.5 Flash-Lite.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "How is production doing right now?",
  "Why did output drop in Mission B?",
  "Diagnose Pick & Place Arm #37",
  "Show me the correlated evidence",
  "What action do you recommend?",
  "What is the email & work order status?",
];

const INITIAL_GREETING: ChatMessage = {
  id: "welcome-0",
  role: "ai",
  kind: "analytics",
  text: `[ANALYTICS] **Cross-Sense Operations Copilot Online** (Powered by **Gemini 3.5 Flash-Lite**).

I am continuously analyzing live telemetry across all **6 fab assets** and **13 multimodal data feeds** (vibration FFT harmonics, CCTV vision feeds, PLC cycle counters, SCADA historian, and CMMS logs).

- **Current Line Focus**: Mission B (Die Assembly) — **Pick & Place Arm #37**
- **Active Investigation**: **INV-204** (6 specialist agents collaborating)
- **Live Ingestion**: Triaxial vibration, thermal probes, servo load, and MES feeds updating every 1.5s.

How can I assist your shift operations today?`,
  createdAt: Date.now(),
};

function formatMarkdown(text: string) {
  // Strip category tag from rendered body
  const clean = text
    .replace(/^\[(DIAGNOSIS|ANALYTICS|EVIDENCE|ACTION|APPROVAL|EMAIL|ALERT|CRITICAL)\]\s*/i, "")
    .trim();

  // Split into lines for structured rendering
  const lines = clean.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        // Header 3 or 2
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-display text-sm font-bold text-foreground mt-2">
              {renderInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-display text-base font-bold text-foreground mt-2">
              {renderInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }

        // Bullet items (- or *)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              <span>{renderInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered items (1. 2. etc)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-xs font-semibold text-accent mt-0.5">
                {numMatch[1]}.
              </span>
              <span>{renderInlineStyles(numMatch[2] ?? "")}</span>
            </div>
          );
        }

        // Standard paragraph
        return <p key={idx}>{renderInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInlineStyles(text: string) {
  // Split by bold (**bold**) and inline code (`code`)
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check for bold **
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    if (
      boldMatch &&
      boldMatch.index !== undefined &&
      (!codeMatch || (codeMatch.index !== undefined && boldMatch.index < codeMatch.index))
    ) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.substring(0, codeMatch.index));
      }
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-foreground"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
}

function extractKind(text: string): NonNullable<ChatMessage["kind"]> {
  const upper = text.toUpperCase();
  if (upper.includes("[DIAGNOSIS]")) return "diagnosis";
  if (upper.includes("[EVIDENCE]")) return "evidence";
  if (upper.includes("[ACTION]") || upper.includes("[APPROVAL]")) return "approval";
  if (upper.includes("[EMAIL]")) return "email";
  return "analytics";
}

export function ChatPage() {
  const { q } = Route.useSearch();
  const executeAskAi = useServerFn(askAiCopilot);

  const machines = useSimulationStore((s) => s.machines);
  const degradation = useSimulationStore((s) => s.degradation);
  const state = machines[TARGET_MACHINE];
  const factoryKpis = useMemo(() => computeFactoryKpis(machines), [machines]);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const handleSend = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || thinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      // Build latest context snapshot from live simulation store
      const contextPayload = buildChatContext(
        machines,
        SEED_ALERTS,
        undefined,
        undefined,
        degradation,
      );
      const contextSummary = formatContextForPrompt(contextPayload);

      // Prepare conversation history for multi-turn reasoning
      const history = messages
        .filter((m) => m.id !== "welcome-0")
        .slice(-6)
        .map((m) => ({
          role: m.role as "user" | "ai",
          text: m.text,
        }));

      let responseText = "";
      let responseKind: ChatMessage["kind"] = "analytics";

      try {
        const res = await executeAskAi({
          data: {
            query: trimmed,
            history,
            contextSummary,
          },
        });

        if (res && res.success && res.text) {
          responseText = res.text;
          responseKind = res.kind || extractKind(res.text);
        } else if (res?.error) {
          throw new Error(res.error);
        }
      } catch (serverFnErr) {
        console.warn("ServerFn attempt failed, falling back to direct Gemini API client...", serverFnErr);
        // Direct browser fallback using VITE_GEMINI_API_KEY
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error(
            "Missing VITE_GEMINI_API_KEY for direct Gemini fallback. Configure it in your environment.",
          );
        }
        const model =
          (import.meta as any).env?.VITE_GEMINI_CHAT_MODEL ||
          "gemini-3.5-flash-lite";

        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${contextSummary}` }],
              },
              contents: [
                ...history.map((m) => ({
                  role: m.role === "user" ? "user" : "model",
                  parts: [{ text: m.text }],
                })),
                { role: "user", parts: [{ text: trimmed }] },
              ],
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 1000,
              },
            }),
          },
        );

        if (!directRes.ok) {
          const errBody = await directRes.text();
          throw new Error(`Gemini API HTTP ${directRes.status}: ${errBody}`);
        }

        const directJson = await directRes.json();
        responseText = directJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        responseKind = extractKind(responseText);
      }

      if (responseText) {
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "ai",
          text: responseText,
          kind: responseKind,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("Empty response returned from Gemini.");
      }
    } catch (err: any) {
      console.error("Ask AI error:", err);
      const fallbackMsg: ChatMessage = {
        id: `a-err-${Date.now()}`,
        role: "ai",
        kind: "analytics",
        text: `⚠️ **Notice:** Could not complete reasoning (${err?.message || "Check API connection"}).`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    if (q && !seeded.current) {
      seeded.current = true;
      void handleSend(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  const clearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  return (
    <OperatorLayout>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left Sidebar: Live Context & KPI Telemetry */}
        <aside className="space-y-3">
          {/* Model Status Card */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
              </span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                Gemini 3.5 Flash-Lite
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Grounded in 13 live telemetry streams with multi-agent reasoning.
            </p>
          </div>

          {/* Live Factory KPIs Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Factory KPIs
              </h2>
              <StatusBadge status={factoryKpis.status} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-secondary/50 p-2">
                <span className="text-muted-foreground">Output:</span>
                <p className="font-mono font-bold text-foreground">
                  {factoryKpis.output}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">u/hr</span>
                </p>
                <span
                  className={`text-[10px] font-semibold ${factoryKpis.outputDeltaPct < -5 ? "text-status-critical" : "text-status-good"}`}
                >
                  {pct(factoryKpis.outputDeltaPct)}
                </span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <span className="text-muted-foreground">Health:</span>
                <p className="font-mono font-bold text-foreground">{factoryKpis.health}/100</p>
                <span className="text-[10px] text-muted-foreground">
                  Yield {factoryKpis.quality}%
                </span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <span className="text-muted-foreground">Cycle Time:</span>
                <p className="font-mono font-bold text-foreground">{factoryKpis.cycleTime}s</p>
                <span className="text-[10px] text-muted-foreground">Draw {factoryKpis.energy}kW</span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2">
                <span className="text-muted-foreground">Impact:</span>
                <p className="font-mono font-bold text-status-critical">
                  ${factoryKpis.impactPerHour.toLocaleString()}
                </p>
                <span className="text-[10px] text-muted-foreground">per hour</span>
              </div>
            </div>
          </div>

          {/* Focus Machine Card (M-37) */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Focus Asset
              </h2>
              <Link
                to="/machines/$machineId"
                params={{ machineId: TARGET_MACHINE }}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-0.5"
              >
                Inspect <ExternalLink className="size-3" />
              </Link>
            </div>
            <p className="mt-1.5 text-sm font-semibold">Pick &amp; Place Arm #37</p>
            <p className="text-[11px] text-muted-foreground">Mission B · Die Assembly</p>

            {state ? (
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={state.status} />
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1">
                  <span className="text-muted-foreground">Vibration</span>
                  <span className="font-mono font-semibold text-foreground">
                    {state.vibration} mm/s
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1">
                  <span className="text-muted-foreground">Cycle Time</span>
                  <span className="font-mono font-semibold text-foreground">
                    {state.cycleTime} s
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1">
                  <span className="text-muted-foreground">Output</span>
                  <span className="font-mono font-semibold text-foreground">
                    {state.output} u/hr
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Active Alerts List */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active Alerts
              </h2>
              <Link
                to="/alerts"
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-0.5"
              >
                View all <ExternalLink className="size-3" />
              </Link>
            </div>
            <ul className="mt-2 space-y-2 text-xs">
              {SEED_ALERTS.slice(0, 3).map((a) => (
                <li
                  key={a.id}
                  className="group rounded-lg border border-border/70 bg-secondary/20 p-2 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{a.id}</span>
                    <span className="text-[10px] text-muted-foreground">{a.createdAt}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{a.title}</p>
                  <button
                    onClick={() => handleSend(`Diagnose alert ${a.id}: ${a.title}`)}
                    className="mt-1.5 text-[10px] font-semibold text-accent hover:underline"
                  >
                    Ask Copilot about this →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Section: Chat Interface */}
        <section className="flex min-h-[75vh] flex-col rounded-xl border border-border bg-card shadow-sm">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-accent" />
              <span className="font-display text-sm font-semibold">Factory Operations Copilot</span>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Live Multi-modal LLM
              </span>
            </div>
            <button
              onClick={clearChat}
              title="Reset conversation"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="size-3" /> Clear
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 space-y-4 overflow-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "flex max-w-[85%] items-start gap-2.5 rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"
                      : "flex max-w-[88%] items-start gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3.5 shadow-sm"
                  }
                >
                  <div className="mt-0.5 shrink-0">
                    {m.role === "user" ? (
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground">
                        <User className="size-3.5" />
                      </div>
                    ) : (
                      <div className="flex size-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                        <Sparkles className="size-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    {m.role === "ai" && m.kind ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            m.kind === "diagnosis"
                              ? "bg-status-critical/15 text-status-critical"
                              : m.kind === "evidence"
                              ? "bg-accent/15 text-accent"
                              : m.kind === "approval"
                              ? "bg-status-good/15 text-status-good"
                              : m.kind === "email"
                              ? "bg-blue-500/15 text-blue-500"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {m.kind}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Cross-Sense Telemetry Grounded
                        </span>
                      </div>
                    ) : null}

                    {m.role === "user" ? (
                      <p className="text-sm font-medium">{m.text}</p>
                    ) : (
                      formatMarkdown(m.text)
                    )}

                    {/* Context Action Badges for AI Responses */}
                    {m.role === "ai" && m.id !== "welcome-0" ? (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                        <Link
                          to="/machines/$machineId"
                          params={{ machineId: TARGET_MACHINE }}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary"
                        >
                          <Cpu className="size-3 text-accent" /> Inspect #37
                        </Link>
                        <Link
                          to="/investigations/$id"
                          params={{ id: "INV-204" }}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary"
                        >
                          <Search className="size-3 text-accent" /> View INV-204
                        </Link>
                        <Link
                          to="/alerts"
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary"
                        >
                          <AlertTriangle className="size-3 text-status-warning" /> Alerts
                        </Link>
                        <Link
                          to="/email-trail"
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary"
                        >
                          <Mail className="size-3 text-blue-400" /> Email Trail
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {thinking ? (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] items-center gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-sm">
                  <div className="flex size-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Sparkles className="size-3.5 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Gemini 3.5 Flash-Lite reasoning
                      </span>
                      <span className="flex gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-accent" />
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Fusing 13 telemetry feeds, vibration FFT harmonics, CCTV vision, and CMMS logs…
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {/* Footer Input Area */}
          <div className="border-t border-border p-3.5 bg-card/50">
            {/* Suggestion Chips */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={thinking}
                  className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Cross-Sense Copilot about live factory metrics, root cause, evidence, or actions…"
                disabled={thinking}
                className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-4" /> Send
              </button>
            </form>
          </div>
        </section>
      </div>
    </OperatorLayout>
  );
}
