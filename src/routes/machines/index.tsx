import { createFileRoute, Link } from "@tanstack/react-router";
import { OperatorLayout } from "@/components/layout/OperatorLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { MACHINES } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";

export const Route = createFileRoute("/machines/")({
  head: () => ({
    meta: [
      { title: "Machines — Cross-Sense AI+" },
      {
        name: "description",
        content: "All monitored assets with live output, cycle time, vibration, temperature and power.",
      },
      { property: "og:title", content: "Machines — Cross-Sense AI+" },
      { property: "og:description", content: "Live telemetry for every monitored factory asset." },
    ],
  }),
  component: MachineList,
});

function MachineList() {
  const machines = useSimulationStore((s) => s.machines);

  return (
    <OperatorLayout>
      <h1 className="font-display text-xl font-bold">Machines</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Six chip-fab assets across three missions. Values refresh every 1.5 seconds.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Machine</th>
              <th className="px-4 py-3">Mission</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Output</th>
              <th className="px-4 py-3 text-right">Cycle</th>
              <th className="px-4 py-3 text-right">Vibration</th>
              <th className="px-4 py-3 text-right">Oil temp</th>
              <th className="px-4 py-3 text-right">Power</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {MACHINES.map((machine) => {
              const s = machines[machine.id];
              return (
                <tr key={machine.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{machine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {machine.id} · {machine.line}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{machine.mission}</td>
                  <td className="px-4 py-3">{s ? <StatusBadge status={s.status} /> : null}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{s?.output}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{s?.cycleTime}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{s?.vibration}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{s?.temperature}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{s?.power}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/machines/$machineId"
                      params={{ machineId: machine.id }}
                      className="text-xs font-semibold text-accent-foreground underline underline-offset-4"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </OperatorLayout>
  );
}
