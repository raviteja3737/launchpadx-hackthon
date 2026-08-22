import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendCriticalAlertEmail } from "@/lib/alertEmail.functions";
import { MACHINES } from "@/lib/mockData";
import { useSimulationStore } from "@/stores/simulationStore";

/**
 * Watches the live simulation and sends one real email per critical incident.
 * A machine must recover (leave critical) before it can alert again.
 */
export function useCriticalAlertEmails() {
  const machines = useSimulationStore((s) => s.machines);
  const send = useServerFn(sendCriticalAlertEmail);
  const alerted = useRef<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const machine of MACHINES) {
      const state = machines[machine.id];
      if (!state) continue;

      if (state.status !== "critical") {
        alerted.current.delete(machine.id);
        continue;
      }
      if (alerted.current.has(machine.id) || inFlight.current.has(machine.id)) continue;

      alerted.current.add(machine.id);
      inFlight.current.add(machine.id);

      void send({
        data: {
          machineId: machine.id,
          machineName: machine.name,
          status: state.status,
          vibration: state.vibration,
          cycleTime: state.cycleTime,
          output: state.output,
          temperature: state.temperature,
          detectedAt: new Date().toLocaleString(),
        },
      })
        .then((result) => {
          if (result.sent) {
            toast.error(`Critical alert emailed — ${machine.id}`, {
              description: `Sent to ${result.to}`,
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
          console.error("Critical alert email failed", error);
        })
        .finally(() => {
          inFlight.current.delete(machine.id);
        });
    }
  }, [machines, send]);
}
