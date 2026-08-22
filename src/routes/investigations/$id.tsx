import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { INVESTIGATIONS, TARGET_MACHINE } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";

export const Route = createFileRoute("/investigations/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Investigation ${params.id} — Cross-Sense AI+` },
      {
        name: "description",
        content: `Agent-by-agent root-cause timeline, evidence, conclusion and approval workflow for investigation ${params.id}.`,
      },
      { property: "og:title", content: `Investigation ${params.id} — Cross-Sense AI+` },
      {
        property: "og:description",
        content: "Agent timeline, conclusion and human approval for an AI root-cause investigation.",
      },
    ],
  }),
  loader: ({ params }) => {
    const inv = INVESTIGATIONS.find((i) => i.id === params.id);
    if (!inv) throw notFound();
    return inv;
  },
  component: InvestigationDetail,
});

function InvestigationDetail() {
  const inv = Route.useLoaderData()!;
  const [revealed, setRevealed] = useState(0);
  const [decision, setDecision] = useState<null | "approved" | "rejected" | "more">(null);
  const [execStep, setExecStep] = useState(0);
  const state = useSimulationStore((s) => s.machines[inv.machineId ?? TARGET_MACHINE]);
  const applyPreset = useSimulationStore((s) => s.applyPreset);

  useEffect(() => {
    setRevealed(0);
    if (!inv.steps.length) return;
    const timer = setInterval(() => {
      setRevealed((n) => {
        if (n >= inv.steps.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [inv.id, inv.steps.length]);

  useEffect(() => {
    if (decision !== "approved") return;
    setExecStep(1);
    const t1 = setTimeout(() => setExecStep(2), 1200);
    const t2 = setTimeout(() => setExecStep(3), 2600);
    const t3 = setTimeout(() => {
      setExecStep(4);
      applyPreset(inv.machineId, "restore");
    }, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [decision, applyPreset, inv.machineId]);

  const done = revealed >= inv.steps.length;

  return (
    <OperatorLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold">{inv.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inv.id} · trigger: {inv.trigger} · agent cost ${inv.cost.toFixed(2)}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-semibold">Agent timeline</h2>
          {inv.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent steps recorded.</p>
          ) : null}
          {inv.steps.slice(0, revealed).map((step, i) => (
            <article
              key={step.id}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <CheckCircle2 className="size-4 text-status-good" />
                <span className="font-display text-sm font-semibold">
                  {i + 1}. {step.agent}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {(step.confidence * 100).toFixed(0)}% · ${step.cost.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{step.role}</p>
              <p className="mt-2 text-sm">{step.finding}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {step.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {tool}
                  </span>
                ))}
              </p>
            </article>
          ))}
          {!done && inv.steps.length ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Agent {revealed + 1} of {inv.steps.length}{" "}
              working across connected sources…
            </div>
          ) : null}
        </section>

        {done ? (
          <section className="rounded-xl border border-accent/50 bg-accent/10 p-4">
            <div className="flex items-center gap-2">
              <Search className="size-4" />
              <h2 className="font-display text-sm font-semibold">
                Conclusion — {(inv.confidence * 100).toFixed(0)}% confidence
              </h2>
            </div>
            <p className="mt-2 text-sm">{inv.conclusion}</p>
            <p className="mt-2 text-sm font-medium">Recommendation: {inv.recommendation}</p>
            {state ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Live now: vibration {state.vibration} mm/s · cycle {state.cycleTime} s · output{" "}
                {state.output} u/hr
              </p>
            ) : null}
          </section>
        ) : null}

        {done ? (
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-semibold">Human approval</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setDecision("approved")}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                Approve maintenance
              </button>
              <button
                onClick={() => setDecision("rejected")}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
              >
                Reject
              </button>
              <button
                onClick={() => setDecision("more")}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
              >
                Ask for more evidence
              </button>
            </div>

            {decision === "rejected" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Rejected. The finding stays on the alert for the next shift review.
              </p>
            ) : null}
            {decision === "more" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Requested a deeper vision pass — the Vision Agent is re-sampling the last 4 hours of
                gripper footage.
              </p>
            ) : null}
            {decision === "approved" ? (
              <ol className="mt-3 space-y-2 text-sm">
                <ExecRow active={execStep >= 1} text="Work order WO-8871 created in CMMS" />
                <ExecRow active={execStep >= 2} text="Technician Rivera notified" />
                <ExecRow active={execStep >= 3} text="Approval email sent to plant manager" />
                <ExecRow
                  active={execStep >= 4}
                  text="Maintenance completed — machine restored to baseline"
                />
              </ol>
            ) : null}
            {execStep >= 4 ? (
              <Link
                to="/email-trail"
                className="mt-3 inline-block text-xs font-semibold underline underline-offset-4"
              >
                View the email trail →
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </OperatorLayout>
  );
}

function ExecRow({ active, text }: { active: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      {active ? (
        <CheckCircle2 className="size-4 text-status-good" />
      ) : (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}
      <span className={active ? "" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}
