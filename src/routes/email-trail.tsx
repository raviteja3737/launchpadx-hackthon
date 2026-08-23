import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Mail, RefreshCw, Send, ShieldAlert, X, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { checkResendStatus, sendCriticalAlertEmail } from "@/lib/alertEmail.functions";
import { emailQueueManager, type QueueStatus } from "@/lib/emailQueue";
import { EVIDENCE, MACHINES, SEED_EMAILS, TARGET_MACHINE } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";
import type { EmailEvent } from "@/types";

export const Route = createFileRoute("/email-trail")({
  head: () => ({
    meta: [
      { title: "Email Trail — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Every notification the AI drafted or sent: alert, approval request, work order, completion and recovery verification.",
      },
      { property: "og:title", content: "Email Trail — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Alert, approval, work order, completion and verification emails in one thread.",
      },
    ],
  }),
  component: EmailTrail,
});

const STATUS_TONE: Record<EmailEvent["status"], string> = {
  Draft: "bg-secondary text-muted-foreground",
  Queued: "bg-status-watch/15 text-status-watch",
  Sent: "bg-status-good/12 text-status-good",
  Approved: "bg-status-good/12 text-status-good",
  Completed: "bg-primary/10 text-primary",
};

export function useEmailVars() {
  const state = useSimulationStore((s) => s.machines[TARGET_MACHINE]);
  const machine = MACHINES.find((m) => m.id === TARGET_MACHINE)!;
  const lost = Math.max(0, machine.baseline.output - (state?.output ?? 0));
  return {
    machine: `${machine.name} (${machine.id})`,
    vibration: String(state?.vibration ?? "—"),
    cycle: String(state?.cycleTime ?? "—"),
    output: String(state?.output ?? "—"),
    confidence: "84%",
    savings: `$${Math.round(lost * 42 * 8).toLocaleString()}`,
  };
}

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

function EmailTrail() {
  const vars = useEmailVars();
  const [open, setOpen] = useState<EmailEvent | null>(null);
  const sendEmail = useServerFn(sendCriticalAlertEmail);
  const getStatus = useServerFn(checkResendStatus);

  const [resendInfo, setResendInfo] = useState<{
    configured: boolean;
    recipient: string;
    keyPreview?: string | undefined;
    statusMessage: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(emailQueueManager.getStatus());

  useEffect(() => {
    const unsubscribe = emailQueueManager.subscribe((status) => {
      setQueueStatus({ ...status });
    });

    void refreshStatus();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshStatus = async () => {
    setIsChecking(true);
    try {
      const info = await getStatus();
      setResendInfo(info);
    } catch {
      setResendInfo(null);
    } finally {
      setIsChecking(false);
    }
  };

  const triggerSingleTest = () => {
    void emailQueueManager.enqueue(
      {
        machineId: "TEST-01",
        machineName: "Diagnostics Test Asset",
        status: "Diagnostic Manual Test Alert",
        vibration: 3.8,
        cycleTime: 48,
        output: 320,
        temperature: 64,
        detectedAt: new Date().toLocaleTimeString(),
      },
      "Manual Diagnostic Test",
      sendEmail,
    );
  };

  const triggerBurstTest = () => {
    // Fire 5 test emails simultaneously to demonstrate:
    // 1st sends immediately, 2nd & 3rd are queued (max 2), 4th & 5th are dismissed!
    for (let i = 1; i <= 5; i++) {
      void emailQueueManager.enqueue(
        {
          machineId: `BURST-0${i}`,
          machineName: `Stress Test Machine #${i}`,
          status: `High-Rate Burst Anomaly #${i}`,
          vibration: 4.0 + i * 0.2,
          cycleTime: 50 + i,
          output: 290 - i * 10,
          temperature: 68 + i,
          detectedAt: new Date().toLocaleTimeString(),
        },
        `Burst stress simulation #${i}`,
        sendEmail,
      );
    }
  };

  return (
    <OperatorLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">Email trail &amp; Dispatcher</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live notification logs, multi-agent drafts, and rate-limited Resend alert dispatcher.
          </p>
        </div>
      </div>

      {/* Resend Status & Rate-Limit Monitor Card */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-accent" />
            <span className="font-display text-sm font-semibold">Resend Email Gateway Status</span>
            {resendInfo?.configured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-good/15 px-2 py-0.5 text-xs font-semibold text-status-good">
                <CheckCircle2 className="size-3" /> Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-watch/15 px-2 py-0.5 text-xs font-semibold text-status-watch">
                <Clock className="size-3" /> Key Not Set in .env
              </span>
            )}
          </div>
          <button
            onClick={refreshStatus}
            disabled={isChecking}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
          >
            <RefreshCw className={`size-3 ${isChecking ? "animate-spin" : ""}`} /> Check Status
          </button>
        </div>

        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <span className="text-muted-foreground">Target Recipient:</span>
            <p className="mt-0.5 font-mono font-medium text-foreground truncate">
              {resendInfo?.recipient ?? "257r1a6704@cmrtc.ac.in"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <span className="text-muted-foreground">Rate Limit Constraint:</span>
            <p className="mt-0.5 font-semibold text-foreground">1 email / 3 seconds</p>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <span className="text-muted-foreground">Queue Buffer (Max 2):</span>
            <p className="mt-0.5 font-semibold text-foreground">
              {queueStatus.queueLength} / {queueStatus.maxQueueSize} pending
              {queueStatus.isSending ? " · Sending now…" : " · Idle"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <span className="text-muted-foreground">Sent / Dismissed (Over Cap):</span>
            <p className="mt-0.5 font-semibold text-foreground">
              <span className="text-status-good">{queueStatus.sentCount} sent</span> ·{" "}
              <span className="text-destructive">{queueStatus.dismissedCount} dismissed</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={triggerSingleTest}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Send className="size-3.5" /> Test Single Alert (1x)
          </button>
          <button
            onClick={triggerBurstTest}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
          >
            <Zap className="size-3.5" /> Test Burst of 5 (Observe 1 Sent, 2 Queued, 2 Dismissed)
          </button>
          <div className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="size-3 text-status-watch" />
            Excess alerts beyond queue buffer (2) are dropped immediately.
          </div>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {SEED_EMAILS.map((email, i) => (
          <li key={email.id}>
            <button
              onClick={() => setOpen(email)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-secondary/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="font-display text-sm font-semibold">
                  {i + 1}. {fill(email.subject, vars)}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[email.status]}`}
                >
                  {email.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {email.from} → {email.to} · {email.stage} · {email.sentAt}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {fill(email.body, vars)}
              </p>
            </button>
          </li>
        ))}
      </ol>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">{fill(open.subject, vars)}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {open.from} → {open.to} · {open.sentAt}
                </p>
              </div>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="ml-auto rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
              {fill(open.body, vars)}
            </p>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence summary
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {EVIDENCE.map((ev) => (
                <li key={ev.id}>
                  <span className="font-medium text-foreground">{ev.source}:</span> {ev.summary}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                Approve &amp; send
              </button>
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">
                Edit draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperatorLayout>
  );
}

