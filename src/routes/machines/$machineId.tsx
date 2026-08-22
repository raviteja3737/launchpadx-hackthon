import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, MessageSquare, Stethoscope } from "lucide-react";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { ChartPanel } from "@/components/ui/chart-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { CONNECTED_SOURCES, EVIDENCE, MACHINES, TARGET_MACHINE } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";

export const Route = createFileRoute("/machines/$machineId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.machineId} telemetry — Cross-Sense AI+` },
      {
        name: "description",
        content: `Live vibration, cycle time, temperature and power telemetry with connected sources and AI evidence for machine ${params.machineId}.`,
      },
      { property: "og:title", content: `${params.machineId} telemetry — Cross-Sense AI+` },
      {
        property: "og:description",
        content: `Connected sources, live charts and AI evidence for machine ${params.machineId}.`,
      },
    ],
  }),
  component: MachineDetail,
});

function MachineDetail() {
  const { machineId } = Route.useParams();
  const machine = MACHINES.find((m) => m.id === machineId) ?? MACHINES[0]!;
  const state = useSimulationStore((s) => s.machines[machine.id]);
  const history = useSimulationStore((s) => s.history[machine.id] ?? []);
  const isTarget = machine.id === TARGET_MACHINE;

  return (
    <OperatorLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">{machine.name}</h1>
            <p className="text-sm text-muted-foreground">
              {machine.id} · {machine.kind} · {machine.line} · {machine.mission}
            </p>
          </div>
          {state ? <StatusBadge status={state.status} /> : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              to="/investigations/$id"
              params={{ id: "INV-204" }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Stethoscope className="size-3.5" /> Diagnose
            </Link>
            <Link
              to="/chat"
              search={{ q: `Diagnose ${machine.id}` }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <MessageSquare className="size-3.5" /> Ask AI
            </Link>
            <Link
              to="/email-trail"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <FileText className="size-3.5" /> Create work order
            </Link>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartPanel
            title="Vibration"
            caption="Axis-2 RMS. Above 4.0 mm/s indicates bearing wear."
            data={history}
            dataKey="vibration"
            unit="mm/s"
            color="var(--status-warning)"
          />
          <ChartPanel
            title="Cycle time"
            caption="Seconds per part. Retries push this up."
            data={history}
            dataKey="cycleTime"
            unit="s"
            color="var(--primary)"
          />
          <ChartPanel
            title="Oil temperature"
            caption="Bearing housing probe."
            data={history}
            dataKey="temperature"
            unit="°C"
            color="var(--status-critical)"
          />
          <ChartPanel
            title="Power draw"
            caption="Mechanical drag shows up as extra kilowatts."
            data={history}
            dataKey="power"
            unit="kW"
            color="var(--status-good)"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
            <h2 className="font-display text-sm font-semibold">Connected sources (13)</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {CONNECTED_SOURCES.map((src) => (
                <li
                  key={src.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-xs"
                >
                  <span>
                    <span className="font-medium">{src.name}</span>
                    <span className="ml-1 text-muted-foreground">· {src.type}</span>
                  </span>
                  <StatusBadge
                    status={
                      src.status === "streaming"
                        ? "good"
                        : src.status === "degraded"
                          ? "warning"
                          : "critical"
                    }
                    label={src.status}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-semibold">AI cost &amp; ROI</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Model calls today" value="148" />
              <Row label="Tokens" value="1.24M" />
              <Row label="Estimated AI cost" value="$0.42" />
              <Row label="Downtime avoided" value="$18,400" />
              <Row label="ROI multiple" value="43,800x" />
            </dl>
            <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              Maintenance history: last service {machine.lastService}, installed {machine.installed}.
              {isTarget ? " Axis-2 grease interval overdue by 38 days." : " No open findings."}
            </div>
          </section>
        </div>

        {isTarget ? (
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-semibold">Evidence pack (5 items)</h2>
            <ul className="mt-3 space-y-2">
              {EVIDENCE.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{ev.source}</span>
                    <span className="font-mono text-muted-foreground">
                      weight {(ev.weight * 100).toFixed(0)}% · {ev.captured}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ev.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </OperatorLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}
