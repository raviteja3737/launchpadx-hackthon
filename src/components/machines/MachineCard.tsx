import { Link } from "@tanstack/react-router";
import { MessageSquare, Stethoscope } from "lucide-react";
import { StatusBadge, statusStroke } from "@/components/ui/status-badge";
import { Sparkline } from "@/components/ui/chart-panel";
import type { Machine, MachineState, TelemetryPoint } from "@/types";

export function MachineCard({
  machine,
  state,
  history,
}: {
  machine: Machine;
  state?: MachineState;
  history: TelemetryPoint[];
}) {
  if (!state) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to="/machines/$machineId"
            params={{ machineId: machine.id }}
            className="font-display text-sm font-semibold hover:underline"
          >
            {machine.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {machine.id} · {machine.line} · {machine.mission}
          </p>
        </div>
        <StatusBadge status={state.status} />
      </div>

      <Sparkline data={history} color={statusStroke[state.status]} />

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <Metric label="Output" value={`${state.output}`} unit="u/hr" />
        <Metric label="Cycle" value={`${state.cycleTime}`} unit="s" />
        <Metric label="Vibration" value={`${state.vibration}`} unit="mm/s" />
        <Metric label="Temp" value={`${state.temperature}`} unit="°C" />
        <Metric label="Power" value={`${state.power}`} unit="kW" />
        <Metric label="Health" value={`${state.health}`} unit="/100" />
      </dl>

      <div className="mt-4 flex gap-2">
        <Link
          to="/investigations/$id"
          params={{ id: "INV-204" }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Stethoscope className="size-3.5" /> Diagnose
        </Link>
        <Link
          to="/chat"
          search={{ q: `Why is ${machine.id} behaving like this?` }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
        >
          <MessageSquare className="size-3.5" /> Ask AI
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>
      </dd>
    </div>
  );
}
