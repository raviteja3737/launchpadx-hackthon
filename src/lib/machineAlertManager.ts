import { MACHINES } from "@/lib/mockData";
import { emailQueueManager, type AlertEmailPayload } from "@/lib/emailQueue";
import { triggerOutboundAlertCall } from "@/lib/alertCall.functions";
import type { MachineState } from "@/types";

interface MachineTrackRecord {
  lastOnlineState: boolean;
  lastSensorOffline: boolean;
  lastStatus: string;
  lastAlertSentType: "STOPPED" | "STARTED" | "CRITICAL" | "WARNING" | "RESTORED" | null;
  lastAlertTimestamp: number;
}

class MachineAlertManager {
  private tracker = new Map<string, MachineTrackRecord>();
  private initialized = false;

  /**
   * Initializes baseline state for machines on first run
   */
  public init(machines: Record<string, MachineState>) {
    if (this.initialized) return;
    for (const m of MACHINES) {
      const st = machines[m.id];
      if (st) {
        this.tracker.set(m.id, {
          lastOnlineState: st.online,
          lastSensorOffline: st.sensorOffline,
          lastStatus: st.status,
          lastAlertSentType: null,
          lastAlertTimestamp: 0,
        });
      }
    }
    this.initialized = true;
  }

  /**
   * Evaluates machine state transitions and ensures:
   * 1. EXACTLY 1 email when stopped
   * 2. EXACTLY 1 email when started
   * 3. EXACTLY 1 email when entering critical anomaly
   * 4. Zero duplicate re-sent emails while remaining in the same state
   */
  public evaluate(
    machines: Record<string, MachineState>,
    sendFn: (opts: { data: AlertEmailPayload }) => Promise<{ sent: boolean; to?: string | undefined; error?: string | undefined }>
  ) {
    if (!this.initialized) {
      this.init(machines);
      return;
    }

    for (const machine of MACHINES) {
      const state = machines[machine.id];
      if (!state) continue;

      let record = this.tracker.get(machine.id);
      if (!record) {
        record = {
          lastOnlineState: state.online,
          lastSensorOffline: state.sensorOffline,
          lastStatus: state.status,
          lastAlertSentType: null,
          lastAlertTimestamp: 0,
        };
        this.tracker.set(machine.id, record);
      }

      const wasOnline = record.lastOnlineState;
      const isOnline = state.online;

      // -------------------------------------------------------------
      // EVENT 1: Machine was turned OFF / STOPPED (Online -> Offline)
      // -------------------------------------------------------------
      if (wasOnline && !isOnline) {
        if (record.lastAlertSentType !== "STOPPED") {
          record.lastAlertSentType = "STOPPED";
          record.lastOnlineState = false;
          record.lastStatus = state.status;
          record.lastAlertTimestamp = Date.now();

          void emailQueueManager.enqueue(
            {
              machineId: machine.id,
              machineName: machine.name,
              status: "Machine Powered Off / Halted",
              vibration: state.vibration,
              cycleTime: state.cycleTime,
              output: state.output,
              temperature: state.temperature,
              detectedAt: new Date().toLocaleTimeString(),
              eventType: "STOPPED",
            },
            "System Stopped / Powered Down",
            sendFn
          );

          // Automatically trigger the Voice AI outbound phone call alert
          void triggerOutboundAlertCall({
            data: {
              machineId: machine.id,
              machineName: machine.name,
            },
          }).catch((err) => {
            console.error("[Outbound Alert Call Error]", err);
          });
        }
        continue;
      }

      // -------------------------------------------------------------
      // EVENT 2: Machine was turned ON / STARTED (Offline -> Online)
      // -------------------------------------------------------------
      if (!wasOnline && isOnline) {
        if (record.lastAlertSentType !== "STARTED") {
          record.lastAlertSentType = "STARTED";
          record.lastOnlineState = true;
          record.lastStatus = state.status;
          record.lastAlertTimestamp = Date.now();

          void emailQueueManager.enqueue(
            {
              machineId: machine.id,
              machineName: machine.name,
              status: "Machine Started & Operational",
              vibration: state.vibration,
              cycleTime: state.cycleTime,
              output: state.output,
              temperature: state.temperature,
              detectedAt: new Date().toLocaleTimeString(),
              eventType: "STARTED",
            },
            "System Started & Online",
            sendFn
          );
        }
        continue;
      }

      // -------------------------------------------------------------
      // EVENT 3: Machine is Online -> Anomaly / Critical fault triggered
      // -------------------------------------------------------------
      if (isOnline) {
        const isFault = state.status === "critical" || state.status === "warning" || state.sensorOffline;
        const faultType = state.status === "critical" ? "CRITICAL" : "WARNING";

        if (isFault) {
          if (record.lastAlertSentType !== faultType && record.lastAlertSentType !== "CRITICAL") {
            record.lastAlertSentType = faultType;
            record.lastStatus = state.status;
            record.lastAlertTimestamp = Date.now();

            const reason = state.sensorOffline
              ? "Sensor Feed Offline"
              : state.status === "critical"
              ? "Critical Degradation"
              : "High Vibration / Cycle Drift";

            void emailQueueManager.enqueue(
              {
                machineId: machine.id,
                machineName: machine.name,
                status: `${state.status} — ${reason}`,
                vibration: state.vibration,
                cycleTime: state.cycleTime,
                output: state.output,
                temperature: state.temperature,
                detectedAt: new Date().toLocaleTimeString(),
                eventType: faultType,
              },
              reason,
              sendFn
            );

            if (state.sensorOffline || state.status === "critical") {
              void triggerOutboundAlertCall({
                data: {
                  machineId: machine.id,
                  machineName: machine.name,
                },
              }).catch((err) => {
                console.error("[Outbound Alert Call Error]", err);
              });
            }
          }
        } else {
          // Machine is healthy / normal (status "good" or "watch")
          // If it was previously faulted or stopped, re-arm for future incidents
          if (record.lastAlertSentType === "CRITICAL" || record.lastAlertSentType === "WARNING") {
            record.lastAlertSentType = null;
          }
          if (record.lastAlertSentType === "STARTED") {
            // Keep status normal, no spam
            record.lastAlertSentType = null;
          }
        }
      }

      record.lastOnlineState = isOnline;
      record.lastSensorOffline = state.sensorOffline;
      record.lastStatus = state.status;
    }
  }

  /**
   * Resets all tracking state (e.g. on manual reset)
   */
  public reset() {
    this.tracker.clear();
    this.initialized = false;
  }
}

export const machineAlertManager = new MachineAlertManager();
