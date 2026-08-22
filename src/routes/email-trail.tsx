import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, X } from "lucide-react";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
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

  return (
    <OperatorLayout>
      <h1 className="font-display text-xl font-bold">Email trail</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Content is generated from the machine's current live values — nothing sends without approval.
      </p>

      <ol className="mt-4 space-y-3">
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
