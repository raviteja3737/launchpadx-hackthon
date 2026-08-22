import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { z } from "zod";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { MACHINES, SEED_ALERTS, TARGET_MACHINE } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";
import type { ChatMessage } from "@/types";

export const Route = createFileRoute("/chat")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Ask AI — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Ask the factory copilot about production, root cause, evidence, recommended actions and email status.",
      },
      { property: "og:title", content: "Ask AI — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Conversational factory copilot grounded in live machine telemetry.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "How is production doing right now?",
  "Why did output drop?",
  "Diagnose M-37",
  "Show me the evidence",
  "What action do you recommend?",
  "What is the email status?",
];

function matchKey(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("email")) return "email";
  if (t.includes("recommend") || t.includes("action") || t.includes("fix")) return "action";
  if (t.includes("evidence") || t.includes("proof")) return "evidence";
  if (t.includes("diagnose") || t.includes("m-37") || t.includes("#37")) return "diagnose";
  if (t.includes("why") || t.includes("drop") || t.includes("down")) return "why";
  return "production";
}

const KIND: Record<string, NonNullable<ChatMessage["kind"]>> = {
  production: "analytics",
  why: "diagnosis",
  diagnose: "diagnosis",
  evidence: "evidence",
  action: "approval",
  email: "email",
};

function ChatPage() {
  const { q } = Route.useSearch();
  const responses = useSimulationStore((s) => s.aiResponses);
  const state = useSimulationStore((s) => s.machines[TARGET_MACHINE]);
  const totalOutput = useSimulationStore((s) =>
    Math.round(MACHINES.reduce((sum, m) => sum + (s.machines[m.id]?.output ?? 0), 0) / 6),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const answer = (text: string) => {
    const key = matchKey(text);
    const raw = responses[key] ?? responses.production;
    return raw
      .replace("{{output}}", String(totalOutput))
      .replace("{{vibration}}", String(state?.vibration ?? "—"))
      .replace("{{cycle}}", String(state?.cycleTime ?? "—"));
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    const key = matchKey(text);
    setTimeout(
      () => {
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "ai",
            text: answer(text),
            kind: KIND[key] ?? "analytics",
            createdAt: Date.now(),
          },
        ]);
        setThinking(false);
      },
      500 + Math.random() * 500,
    );
  };

  useEffect(() => {
    if (q && !seeded.current) {
      seeded.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  return (
    <OperatorLayout>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Context
            </h2>
            <p className="mt-2 text-sm font-medium">Mission B — Drivetrain</p>
            <p className="text-xs text-muted-foreground">Pick &amp; Place Arm #37 in focus</p>
            {state ? (
              <div className="mt-3">
                <StatusBadge status={state.status} />
              </div>
            ) : null}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active alerts
            </h2>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              {SEED_ALERTS.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-foreground">{a.id}</span> — {a.title}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <Sparkles className="mb-2 size-6 text-accent" />
                Ask about production, root cause, evidence or the email trail.
              </div>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[80%] rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm"
                  }
                >
                  {m.role === "ai" && m.kind ? (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {m.kind} card
                    </p>
                  ) : null}
                  {m.text}
                </div>
              </div>
            ))}
            {thinking ? (
              <p className="text-xs text-muted-foreground">Agents reading connected sources…</p>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the factory copilot…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
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
