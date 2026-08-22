import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { SEED_ALERTS } from "@/lib/mockData";
import type { AlertItem } from "@/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "AI-detected production alerts with confidence scores, contributing signals and acknowledgement workflow.",
      },
      { property: "og:title", content: "Alerts — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Cross-modal production alerts with confidence and source signals.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(SEED_ALERTS);

  const advance = (id: string, status: AlertItem["status"]) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

  return (
    <OperatorLayout>
      <h1 className="font-display text-xl font-bold">Alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open → Acknowledged → Investigating → Action Recommended → Resolved
      </p>

      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={alert.severity} label={alert.severity} />
              <h2 className="font-display text-sm font-semibold">{alert.title}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {alert.status}
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {alert.id} · {alert.createdAt} · {(alert.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{alert.detail}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Signals: {alert.signals.join(" · ")} · {alert.mission}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/investigations/$id"
                params={{ id: "INV-204" }}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Diagnose
              </Link>
              <Link
                to="/chat"
                search={{ q: alert.title }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Ask AI
              </Link>
              <button
                onClick={() => advance(alert.id, "Acknowledged")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Acknowledge
              </button>
              {alert.machineId ? (
                <Link
                  to="/machines/$machineId"
                  params={{ machineId: alert.machineId }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  View evidence
                </Link>
              ) : null}
              <button
                onClick={() => advance(alert.id, "Action Recommended")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Create work order
              </button>
              <button
                onClick={() => advance(alert.id, "Resolved")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Resolve
              </button>
            </div>
          </article>
        ))}
      </div>
    </OperatorLayout>
  );
}
