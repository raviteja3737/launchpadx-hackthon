import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendCriticalAlertEmail } from "@/lib/alertEmail.functions";
import { machineAlertManager } from "@/lib/machineAlertManager";
import { useSimulationStore } from "@/stores/simulationStore";

/**
 * Global Alert Lifecycle Observer:
 * - Listens to factory machine state changes
 * - Dispatches EXACTLY ONE email when a system is stopped / powered off
 * - Dispatches EXACTLY ONE email when a system is started / powered on
 * - Dispatches EXACTLY ONE email on critical anomaly/degradation
 * - Prevents all duplicate re-sent emails and spamming loops
 */
export function useCriticalAlertEmails() {
  const machines = useSimulationStore((s) => s.machines);
  const send = useServerFn(sendCriticalAlertEmail);

  useEffect(() => {
    machineAlertManager.evaluate(machines, send);
  }, [machines, send]);
}


