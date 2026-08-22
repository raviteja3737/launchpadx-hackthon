import { MACHINES } from "@/lib/mockData";
import { statusFromHealth } from "@/lib/simulation";
import type { MachineState, Status } from "@/types";

export interface FactoryKpis {
  output: number;
  targetOutput: number;
  outputDeltaPct: number;
  cycleTime: number;
  downtimeMin: number;
  health: number;
  quality: number;
  energy: number;
  impactPerHour: number;
  status: Status;
}

export function computeFactoryKpis(machines: Record<string, MachineState>): FactoryKpis {
  const states: MachineState[] = MACHINES.map((m) => machines[m.id]).filter(
    (s): s is MachineState => Boolean(s),
  );
  const target = MACHINES.reduce((sum, m) => sum + m.baseline.output, 0);
  const output = states.reduce((sum, s) => sum + s.output, 0);
  const cycleTime =
    states.filter((s) => s.online).reduce((sum, s) => sum + s.cycleTime, 0) /
    Math.max(1, states.filter((s) => s.online).length);
  const health = states.reduce((sum, s) => sum + s.health, 0) / Math.max(1, states.length);
  const energy = states.reduce((sum, s) => sum + s.power, 0);
  const lost = Math.max(0, target - output);
  const outputDeltaPct = ((output - target) / target) * 100;
  const avgVib = states.reduce((sum, s) => sum + s.vibration, 0) / Math.max(1, states.length);

  return {
    output: Math.round(output),
    targetOutput: target,
    outputDeltaPct: Math.round(outputDeltaPct * 10) / 10,
    cycleTime: Math.round(cycleTime * 10) / 10,
    downtimeMin: Math.round(lost / 6),
    health: Math.round(health),
    quality: Math.round((99.4 - Math.max(0, avgVib - 2) * 1.6) * 10) / 10,
    energy: Math.round(energy),
    impactPerHour: Math.round(lost * 42),
    status: statusFromHealth(health),
  };
}

export function pct(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
