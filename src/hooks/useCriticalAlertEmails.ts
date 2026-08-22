import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendCriticalAlertEmail } from "@/lib/alertEmail.functions";
import { MACHINES } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";
import type { MachineState } from "@/types";

/**
 * Every machine is wired for email alerts. An email fires whenever an asset enters
 * a fault condition — powered off, sensor offline, warning or critical — and re-arms
 * only after the asset returns to a healthy/watch state with its sensor back online.
 */
function faultReason(state: MachineState): string | null {
  if (!state.online) return "Machine powered off";
  if (state.sensorOffline) return "Sensor feed offline";
  if (state.status === "critical") return "Critical degradation";
  if (state.status === "warning") return "Warning — degrading fast";
  return null;
}

export function useCriticalAlertEmails() {
  const machines = useSimulationStore((s) => s.machines);
  const send = useServerFn(sendCriticalAlertEmail);
  const alerted = useRef<Map<string, string>>(new Map());
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const machine of MACHINES) {
      const state = machines[machine.id];
      if (!state) continue;

      const reason = faultReason(state);
      if (!reason) {
        alerted.current.delete(machine.id);
        continue;
      }
      // One email per distinct fault condition per incident.
      if (alerted.current.get(machine.id) === reason) continue;
      if (inFlight.current.has(machine.id)) continue;

      alerted.current.set(machine.id, reason);
      inFlight.current.add(machine.id);

      void send({
        data: {
          machineId: machine.id,
          machineName: machine.name,
          status: `${state.status}${state.online ? "" : " (offline)"}${
            state.sensorOffline ? " (sensor offline)" : ""
          } — ${reason}`,
          vibration: state.vibration,
          cycleTime: state.cycleTime,
          output: state.output,
          temperature: state.temperature,
          detectedAt: new Date().toLocaleString(),
        },
      })
        .then((result) => {
          if (result.sent) {
            toast.error(`Alert emailed — ${machine.id}`, {
              description: `${reason} · sent to ${result.to}`,
            });
          } else {
            alerted.current.delete(machine.id);
            toast.warning(`Could not email alert for ${machine.id}`, {
              description: result.error ?? "Unknown error",
            });
          }
        })
        .catch((error: unknown) => {
          alerted.current.delete(machine.id);
          console.error("Alert email failed", error);
        })
        .finally(() => {
          inFlight.current.delete(machine.id);
        });
    }
  }, [machines, send]);
}
