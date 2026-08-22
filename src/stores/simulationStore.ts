import { create } from "zustand";
import { createBroadcastSync } from "@/lib/broadcastSync";
import { MACHINES, TARGET_MACHINE } from "@/lib/mockData";
import {
  computeMachineState,
  defaultControl,
  initialStates,
  type MachineControl,
} from "@/lib/simulation";
import type { MachineMetrics, MachineState, TelemetryPoint } from "@/types";

export type Preset =
  | "off"
  | "on"
  | "upgrade"
  | "degrade"
  | "vibration"
  | "slowCycle"
  | "sensorOffline"
  | "restore";

const TICK_MS = 1500;
const HISTORY = 40;

const makeControls = (): Record<string, MachineControl> =>
  Object.fromEntries(MACHINES.map((m) => [m.id, defaultControl()]));

interface ControlSnapshot {
  controls: Record<string, MachineControl>;
  degradation: number;
  autoDegrade: boolean;
  aiResponses: Record<string, string>;
}

export const DEFAULT_AI_RESPONSES: Record<string, string> = {
  production:
    "Mission B is running at {{output}} u/hr against a target of 124 u/hr — a 9.8% shortfall concentrated on Line B.",
  why: "The drop traces to Pick & Place Arm #37. Vibration is {{vibration}} mm/s and cycle time {{cycle}} s, adding retries that starve the downstream welder.",
  diagnose:
    "Diagnosis for #37: Axis-2 harmonic drive wear. Vision, vibration and MES data all converge on the same asset (84% confidence).",
  evidence:
    "Five evidence items are attached: vibration harmonic at 148 Hz, CCTV overshoot on 61% of picks, cycle-time drift, overdue grease interval, and an 18% servo current rise.",
  action:
    "Recommended action: 45-minute maintenance window — re-grease and inspect the Axis-2 harmonic drive, re-run gripper calibration, verify with a 30-cycle test.",
  email:
    "Email trail: alert sent 08:22, approval request queued 08:31, work order draft ready for technician Rivera. Nothing is sent without your approval.",
};

interface SimState extends ControlSnapshot {
  tick: number;
  running: boolean;
  machines: Record<string, MachineState>;
  history: Record<string, TelemetryPoint[]>;
  startEngine: () => void;
  stopEngine: () => void;
  applyPreset: (machineId: string, preset: Preset) => void;
  nudge: (machineId: string, key: keyof MachineMetrics, delta: number) => void;
  setDegradation: (value: number) => void;
  setAutoDegrade: (value: boolean) => void;
  setAiResponse: (key: string, text: string) => void;
  resetAll: () => void;
}

let timer: ReturnType<typeof setInterval> | null = null;
let sync: ReturnType<typeof createBroadcastSync<ControlSnapshot>> | null = null;
let receiving = false;

const initialControls = makeControls();
const initialDegradation = 0.35;

export const useSimulationStore = create<SimState>((set, get) => {
  const publish = () => {
    if (receiving) return;
    const { controls, degradation, autoDegrade, aiResponses } = get();
    sync?.post({ controls, degradation, autoDegrade, aiResponses });
  };

  return {
    controls: initialControls,
    degradation: initialDegradation,
    autoDegrade: true,
    aiResponses: { ...DEFAULT_AI_RESPONSES },
    tick: 0,
    running: false,
    machines: initialStates(initialControls, initialDegradation),
    history: Object.fromEntries(MACHINES.map((m) => [m.id, [] as TelemetryPoint[]])),

    startEngine: () => {
      if (typeof window === "undefined") return;
      if (!sync) {
        sync = createBroadcastSync<ControlSnapshot>("cross-sense-sim", (payload) => {
          receiving = true;
          set(payload);
          receiving = false;
        });
      }
      if (timer) return;
      set({ running: true });
      timer = setInterval(() => {
        const state = get();
        const degradation = state.autoDegrade
          ? Math.min(1, state.degradation + 0.006)
          : state.degradation;
        const machines: Record<string, MachineState> = {};
        const history: Record<string, TelemetryPoint[]> = {};
        const label = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        for (const machine of MACHINES) {
          const control = state.controls[machine.id] ?? defaultControl();
          const next = computeMachineState(machine, control, degradation);
          machines[machine.id] = next;
          const prev = state.history[machine.id] ?? [];
          history[machine.id] = [
            ...prev,
            {
              t: Date.now(),
              label,
              output: next.output,
              cycleTime: next.cycleTime,
              vibration: next.vibration,
              temperature: next.temperature,
              power: next.power,
            },
          ].slice(-HISTORY);
        }
        set({ machines, history, degradation, tick: state.tick + 1 });
      }, TICK_MS);
    },

    stopEngine: () => {
      if (timer) clearInterval(timer);
      timer = null;
      set({ running: false });
    },

    applyPreset: (machineId, preset) => {
      const controls = { ...get().controls };
      const current = { ...(controls[machineId] ?? defaultControl()) };
      const overrides = { ...current.overrides };
      switch (preset) {
        case "off":
          current.online = false;
          break;
        case "on":
          current.online = true;
          break;
        case "upgrade":
          current.bias = Math.min(1, current.bias + 0.4);
          break;
        case "degrade":
          current.bias = Math.max(-1, current.bias - 0.4);
          break;
        case "vibration":
          overrides.vibration = (overrides.vibration ?? 2.2) + 2.4;
          break;
        case "slowCycle":
          overrides.cycleTime = (overrides.cycleTime ?? 29) + 6;
          break;
        case "sensorOffline":
          current.sensorOffline = !current.sensorOffline;
          break;
        case "restore":
          current.online = true;
          current.bias = 0;
          current.sensorOffline = false;
          if (machineId === TARGET_MACHINE) set({ degradation: 0, autoDegrade: false });
          Object.keys(overrides).forEach((k) => delete overrides[k as keyof MachineMetrics]);
          break;
      }
      current.overrides = overrides;
      controls[machineId] = current;
      set({ controls });
      publish();
    },

    nudge: (machineId, key, delta) => {
      const controls = { ...get().controls };
      const current = { ...(controls[machineId] ?? defaultControl()) };
      const base = get().machines[machineId]?.[key] ?? 0;
      current.overrides = {
        ...current.overrides,
        [key]: Math.max(0, Math.round((base + delta) * 10) / 10),
      };
      controls[machineId] = current;
      set({ controls });
      publish();
    },

    setDegradation: (value) => {
      set({ degradation: Math.max(0, Math.min(1, value)), autoDegrade: false });
      publish();
    },

    setAutoDegrade: (value) => {
      set({ autoDegrade: value });
      publish();
    },

    setAiResponse: (key, text) => {
      set({ aiResponses: { ...get().aiResponses, [key]: text } });
      publish();
    },

    resetAll: () => {
      set({
        controls: makeControls(),
        degradation: initialDegradation,
        autoDegrade: true,
        aiResponses: { ...DEFAULT_AI_RESPONSES },
      });
      publish();
    },
  };
});

export function useMachineState(machineId: string) {
  return useSimulationStore((s) => s.machines[machineId]);
}
