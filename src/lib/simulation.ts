import { MACHINES, TARGET_MACHINE } from "@/lib/mockData";
import type { Machine, MachineMetrics, MachineState, Status } from "@/types";

export interface MachineControl {
  online: boolean;
  sensorOffline: boolean;
  /** -1 (fully degraded) .. +1 (upgraded) manual bias */
  bias: number;
  overrides: Partial<MachineMetrics>;
}

export const defaultControl = (): MachineControl => ({
  online: true,
  sensorOffline: false,
  bias: 0,
  overrides: {},
});

const jitter = (amount: number) => (Math.random() - 0.5) * amount;

export function statusFromHealth(health: number): Status {
  if (health >= 85) return "good";
  if (health >= 70) return "watch";
  if (health >= 50) return "warning";
  return "critical";
}

/** Degradation profile for the story machine (#37). d = 0..1 */
function degrade(base: MachineMetrics, d: number): MachineMetrics {
  return {
    output: base.output - 30 * d,
    cycleTime: base.cycleTime + 7.5 * d,
    vibration: base.vibration + 4.6 * d,
    temperature: base.temperature + 17 * d,
    power: base.power + 7 * d,
  };
}

/** Manual bias: negative = worse, positive = better */
function applyBias(m: MachineMetrics, bias: number): MachineMetrics {
  const b = -bias; // b > 0 means worse
  return {
    output: m.output * (1 - 0.22 * b),
    cycleTime: m.cycleTime * (1 + 0.2 * b),
    vibration: m.vibration * (1 + 0.9 * b),
    temperature: m.temperature * (1 + 0.14 * b),
    power: m.power * (1 + 0.16 * b),
  };
}

export function computeMachineState(
  machine: Machine,
  control: MachineControl,
  degradation: number,
): MachineState {
  const base = machine.baseline;
  let m: MachineMetrics =
    machine.id === TARGET_MACHINE ? degrade(base, degradation) : { ...base };
  m = applyBias(m, control.bias);

  m = {
    output: Math.max(0, m.output + jitter(3)),
    cycleTime: Math.max(1, m.cycleTime + jitter(0.6)),
    vibration: Math.max(0, m.vibration + jitter(0.18)),
    temperature: m.temperature + jitter(0.8),
    power: Math.max(0, m.power + jitter(1.1)),
  };

  const o = control.overrides;
  m = {
    output: o.output ?? m.output,
    cycleTime: o.cycleTime ?? m.cycleTime,
    vibration: o.vibration ?? m.vibration,
    temperature: o.temperature ?? m.temperature,
    power: o.power ?? m.power,
  };

  if (!control.online) {
    m = { output: 0, cycleTime: 0, vibration: 0, temperature: 24, power: 0.4 };
  }

  const outputScore = Math.min(1, m.output / base.output);
  const cycleScore = control.online ? Math.min(1, base.cycleTime / Math.max(m.cycleTime, 0.1)) : 0;
  const vibScore = Math.max(0, 1 - Math.max(0, m.vibration - base.vibration) / 4.5);
  const tempScore = Math.max(0, 1 - Math.max(0, m.temperature - base.temperature) / 30);

  const health = control.online
    ? Math.round(100 * (0.4 * outputScore + 0.2 * cycleScore + 0.28 * vibScore + 0.12 * tempScore))
    : 0;

  return {
    id: machine.id,
    ...round(m),
    health: Math.max(0, Math.min(100, health)),
    status: control.online ? statusFromHealth(health) : "critical",
    online: control.online,
    sensorOffline: control.sensorOffline,
  };
}

function round(m: MachineMetrics): MachineMetrics {
  return {
    output: Math.round(m.output * 10) / 10,
    cycleTime: Math.round(m.cycleTime * 10) / 10,
    vibration: Math.round(m.vibration * 100) / 100,
    temperature: Math.round(m.temperature * 10) / 10,
    power: Math.round(m.power * 10) / 10,
  };
}

export function initialStates(
  controls: Record<string, MachineControl>,
  degradation: number,
): Record<string, MachineState> {
  const out: Record<string, MachineState> = {};
  for (const machine of MACHINES) {
    out[machine.id] = computeMachineState(
      machine,
      controls[machine.id] ?? defaultControl(),
      degradation,
    );
  }
  return out;
}
