import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { MachineCard } from "@/components/machines/MachineCard";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MACHINES } from "@/lib/mockData";
import { computeFactoryKpis, pct } from "@/lib/kpis";
import { statusFromHealth } from "@/lib/simulation";
import { useSimulationStore } from "@/stores/simulationStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Factory Overview — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Live factory operations console: machine health, throughput, AI alerts and multi-agent root-cause investigations.",
      },
      { property: "og:title", content: "Factory Overview — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Live machine health, throughput KPIs and AI root-cause investigations.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const machines = useSimulationStore((s) => s.machines);
  const history = useSimulationStore((s) => s.history);
  const kpi = computeFactoryKpis(machines);

  return (
    <OperatorLayout>
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-bold">Factory health</h1>
            <StatusBadge status={kpi.status} />
            <span className="text-sm text-muted-foreground">
              Shift B · 06:00–14:00 · 6 assets monitored across 13 sources
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Cross-Sense fuses vision, sensor, production and document signals every 1.5 seconds. When
            modalities agree on the same asset, an investigation opens automatically.
          </p>
        </section>

        <Link
          to="/alerts"
          className="flex items-center gap-3 rounded-xl border border-status-critical/40 bg-status-critical/8 p-4 transition-colors hover:bg-status-critical/12"
        >
          <AlertTriangle className="size-5 shrink-0 text-status-critical" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-status-critical">
              Production down {Math.abs(kpi.outputDeltaPct).toFixed(1)}% in Mission B
            </p>
            <p className="text-xs text-muted-foreground">
              Cross-sense correlation points at Pick &amp; Place Arm #37 — 84% confidence
            </p>
          </div>
          <ArrowRight className="ml-auto size-4 text-muted-foreground" />
        </Link>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            label="Output"
            value={kpi.output}
            unit="u/hr"
            delta={pct(kpi.outputDeltaPct)}
            status={kpi.outputDeltaPct < -5 ? "critical" : kpi.outputDeltaPct < -2 ? "warning" : "good"}
            caption={`Target ${kpi.targetOutput} u/hr across all lines.`}
          />
          <StatCard
            label="Avg cycle time"
            value={kpi.cycleTime}
            unit="s"
            status={kpi.cycleTime > 29 ? "warning" : "good"}
            caption="Seconds per part. Rising cycle time means machines are retrying."
          />
          <StatCard
            label="Downtime"
            value={kpi.downtimeMin}
            unit="min/hr"
            status={kpi.downtimeMin > 6 ? "warning" : "good"}
            caption="Lost production converted to equivalent stopped minutes."
          />
          <StatCard
            label="Machine health"
            value={kpi.health}
            unit="/100"
            status={statusFromHealth(kpi.health)}
            caption="Blended index of output, cycle, vibration and temperature."
          />
          <StatCard
            label="Quality"
            value={kpi.quality}
            unit="%"
            status={kpi.quality < 98 ? "warning" : "good"}
            caption="First-pass yield estimate from the inspection camera."
          />
          <StatCard
            label="Energy"
            value={kpi.energy}
            unit="kW"
            status="good"
            caption="Live plant draw. Extra drag shows up as extra kilowatts."
          />
          <StatCard
            label="Business impact"
            value={`$${kpi.impactPerHour.toLocaleString()}`}
            unit="/hr"
            status={kpi.impactPerHour > 5000 ? "critical" : "watch"}
            caption="Value of the units not produced at the current rate."
          />
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Machines</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MACHINES.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                state={machines[machine.id]}
                history={history[machine.id] ?? []}
              />
            ))}
          </div>
        </section>
      </div>
    </OperatorLayout>
  );
}
