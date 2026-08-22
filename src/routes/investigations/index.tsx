import { createFileRoute, Link } from "@tanstack/react-router";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { INVESTIGATIONS } from "@/lib/mockData";

export const Route = createFileRoute("/investigations/")({
  head: () => ({
    meta: [
      { title: "Investigations — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Multi-agent root-cause investigations with confidence, cost and the trigger signal that opened each one.",
      },
      { property: "og:title", content: "Investigations — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Multi-agent root-cause investigations with confidence and cost.",
      },
    ],
  }),
  component: InvestigationList,
});

function InvestigationList() {
  return (
    <OperatorLayout>
      <h1 className="font-display text-xl font-bold">Investigations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Each investigation runs six specialist agents across the connected sources.
      </p>
      <div className="mt-4 space-y-3">
        {INVESTIGATIONS.map((inv) => (
          <Link
            key={inv.id}
            to="/investigations/$id"
            params={{ id: inv.id }}
            className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm font-semibold">{inv.title}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {inv.status}
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {inv.id} · {(inv.confidence * 100).toFixed(0)}% · ${inv.cost.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Trigger: {inv.trigger}</p>
            <p className="mt-2 text-sm text-muted-foreground">{inv.conclusion}</p>
          </Link>
        ))}
      </div>
    </OperatorLayout>
  );
}
