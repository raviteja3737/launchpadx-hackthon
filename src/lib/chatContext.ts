import { computeFactoryKpis } from "@/lib/kpis";
import {
  CONNECTED_SOURCES,
  EVIDENCE,
  INVESTIGATIONS,
  MACHINES,
  SEED_ALERTS,
  SEED_EMAILS,
  TARGET_MACHINE,
} from "@/lib/mockData";
import type { AlertItem, EmailEvent, Investigation, MachineState } from "@/types";

export interface ChatContextPayload {
  factoryKpis: {
    output: number;
    targetOutput: number;
    outputDeltaPct: number;
    cycleTime: number;
    downtimeMin: number;
    health: number;
    quality: number;
    energy: number;
    impactPerHour: number;
    status: string;
  };
  targetMachineId: string;
  machines: Array<{
    id: string;
    name: string;
    kind: string;
    line: string;
    mission: string;
    status: string;
    health: number;
    online: boolean;
    sensorOffline: boolean;
    current: {
      output: number;
      cycleTime: number;
      vibration: number;
      temperature: number;
      power: number;
    };
    baseline: {
      output: number;
      cycleTime: number;
      vibration: number;
      temperature: number;
      power: number;
    };
    installed: string;
    lastService: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    detail: string;
    severity: string;
    machineId?: string | undefined;
    mission: string;
    confidence: number;
    signals: string[];
    createdAt: string;
    status: string;
  }>;
  investigations: Array<{
    id: string;
    title: string;
    machineId: string;
    trigger: string;
    confidence: number;
    cost: number;
    status: string;
    conclusion: string;
    recommendation: string;
    steps: Array<{
      id: string;
      agent: string;
      role: string;
      tools: string[];
      finding: string;
      confidence: number;
      cost: number;
    }>;
  }>;
  evidence: Array<{
    id: string;
    source: string;
    summary: string;
    weight: number;
    captured: string;
  }>;
  connectedSources: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    latencyMs: number;
  }>;
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    to: string;
    stage: string;
    status: string;
    sentAt: string;
  }>;
  degradationLevel?: number | undefined;
}

/**
 * Builds the structured context payload from current live simulation state.
 */
export function buildChatContext(
  machineStates: Record<string, MachineState>,
  activeAlerts?: AlertItem[],
  customInvestigations?: Investigation[],
  customEmails?: EmailEvent[],
  degradation?: number,
): ChatContextPayload {
  const kpi = computeFactoryKpis(machineStates);

  const machineList = MACHINES.map((m) => {
    const st = machineStates[m.id];
    return {
      id: m.id,
      name: m.name,
      kind: m.kind,
      line: m.line,
      mission: m.mission,
      status: st?.status ?? "good",
      health: st?.health ?? 100,
      online: st?.online ?? true,
      sensorOffline: st?.sensorOffline ?? false,
      current: {
        output: st?.output ?? m.baseline.output,
        cycleTime: st?.cycleTime ?? m.baseline.cycleTime,
        vibration: st?.vibration ?? m.baseline.vibration,
        temperature: st?.temperature ?? m.baseline.temperature,
        power: st?.power ?? m.baseline.power,
      },
      baseline: m.baseline,
      installed: m.installed,
      lastService: m.lastService,
    };
  });

  const alerts = (activeAlerts ?? SEED_ALERTS).map((a) => ({
    id: a.id,
    title: a.title,
    detail: a.detail,
    severity: a.severity,
    machineId: a.machineId,
    mission: a.mission,
    confidence: a.confidence,
    signals: a.signals,
    createdAt: a.createdAt,
    status: a.status,
  }));

  const investigations = (customInvestigations ?? INVESTIGATIONS).map((inv) => ({
    id: inv.id,
    title: inv.title,
    machineId: inv.machineId,
    trigger: inv.trigger,
    confidence: inv.confidence,
    cost: inv.cost,
    status: inv.status,
    conclusion: inv.conclusion,
    recommendation: inv.recommendation,
    steps: inv.steps.map((s) => ({
      id: s.id,
      agent: s.agent,
      role: s.role,
      tools: s.tools,
      finding: s.finding,
      confidence: s.confidence,
      cost: s.cost,
    })),
  }));

  const emails = (customEmails ?? SEED_EMAILS).map((e) => ({
    id: e.id,
    subject: e.subject,
    from: e.from,
    to: e.to,
    stage: e.stage,
    status: e.status,
    sentAt: e.sentAt,
  }));

  return {
    factoryKpis: {
      output: kpi.output,
      targetOutput: kpi.targetOutput,
      outputDeltaPct: kpi.outputDeltaPct,
      cycleTime: kpi.cycleTime,
      downtimeMin: kpi.downtimeMin,
      health: kpi.health,
      quality: kpi.quality,
      energy: kpi.energy,
      impactPerHour: kpi.impactPerHour,
      status: kpi.status,
    },
    targetMachineId: TARGET_MACHINE,
    machines: machineList,
    alerts,
    investigations,
    evidence: EVIDENCE.map((e) => ({
      id: e.id,
      source: e.source,
      summary: e.summary,
      weight: e.weight,
      captured: e.captured,
    })),
    connectedSources: CONNECTED_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
      latencyMs: s.latencyMs,
    })),
    emails,
    degradationLevel: degradation !== undefined ? Math.round(degradation * 100) : undefined,
  };
}

/**
 * Formats the context payload into a dense text summary suitable for the system/context prompt.
 */
export function formatContextForPrompt(ctx: ChatContextPayload): string {
  const lines: string[] = [];

  lines.push("=== LIVE FACTORY TELEMETRY & KPIS (REAL-TIME SNAPSHOT) ===");
  lines.push(`Factory Overall Status: ${ctx.factoryKpis.status.toUpperCase()}`);
  lines.push(
    `Total Throughput: ${ctx.factoryKpis.output} chips/hr (Target: ${ctx.factoryKpis.targetOutput} chips/hr, Delta: ${ctx.factoryKpis.outputDeltaPct > 0 ? "+" : ""}${ctx.factoryKpis.outputDeltaPct}%)`,
  );
  lines.push(`Factory Mean Cycle Time: ${ctx.factoryKpis.cycleTime}s`);
  lines.push(
    `Factory Health Index: ${ctx.factoryKpis.health}/100 | Die Yield Quality: ${ctx.factoryKpis.quality}%`,
  );
  lines.push(
    `Energy Draw: ${ctx.factoryKpis.energy} kW | Business Financial Impact: $${ctx.factoryKpis.impactPerHour.toLocaleString()}/hr loss`,
  );
  if (ctx.degradationLevel !== undefined) {
    lines.push(`Global Degradation Simulator Level: ${ctx.degradationLevel}%`);
  }
  lines.push("");

  lines.push("=== FLEET MACHINE METRICS (6 ASSETS) ===");
  for (const m of ctx.machines) {
    const isTarget = m.id === ctx.targetMachineId ? " [FOCUS TARGET ASSET]" : "";
    const isOnline = m.online ? "ONLINE" : "STOPPED / OFFLINE";
    const sensorStatus = m.sensorOffline ? " [SENSOR OFFLINE]" : "";
    lines.push(
      `Machine ${m.id} (${m.name})${isTarget} - Line: ${m.line} | Mission: ${m.mission} | State: ${isOnline}${sensorStatus} | Status: ${m.status.toUpperCase()} | Health: ${m.health}/100`,
    );
    lines.push(
      `  Live Metrics: Output=${m.current.output} u/hr (base ${m.baseline.output}), CycleTime=${m.current.cycleTime}s (base ${m.baseline.cycleTime}s), Vibration=${m.current.vibration} mm/s (base ${m.baseline.vibration} mm/s), Temp=${m.current.temperature}°C (base ${m.baseline.temperature}°C), Power=${m.current.power} kW`,
    );
    lines.push(
      `  Maintenance: Last Service=${m.lastService}, Installed=${m.installed}`,
    );
  }
  lines.push("");

  lines.push("=== ACTIVE FACTORY ALERTS ===");
  for (const a of ctx.alerts) {
    lines.push(
      `[${a.id}] (${a.severity.toUpperCase()}) ${a.title} - Status: ${a.status} | Confidence: ${(a.confidence * 100).toFixed(0)}% | Time: ${a.createdAt}`,
    );
    lines.push(`  Detail: ${a.detail}`);
    lines.push(`  Contributing Signals: ${a.signals.join(", ")}`);
    if (a.machineId) lines.push(`  Associated Asset: ${a.machineId}`);
  }
  lines.push("");

  lines.push("=== MULTI-AGENT ROOT-CAUSE INVESTIGATIONS ===");
  for (const inv of ctx.investigations) {
    lines.push(
      `[${inv.id}] "${inv.title}" - Asset: ${inv.machineId} | Status: ${inv.status} | Confidence: ${(inv.confidence * 100).toFixed(0)}% | Agent Cost: $${inv.cost.toFixed(2)}`,
    );
    lines.push(`  Trigger: ${inv.trigger}`);
    lines.push(`  Conclusion: ${inv.conclusion}`);
    lines.push(`  Recommendation: ${inv.recommendation}`);
    if (inv.steps.length > 0) {
      lines.push("  Specialist Agent Steps & Findings:");
      for (const st of inv.steps) {
        lines.push(
          `    - ${st.agent} (${st.role}, Confidence: ${(st.confidence * 100).toFixed(0)}%): ${st.finding} [Tools: ${st.tools.join(", ")}]`,
        );
      }
    }
  }
  lines.push("");

  lines.push("=== CORRELATED MULTI-MODAL EVIDENCE PACK ===");
  for (const ev of ctx.evidence) {
    lines.push(
      `[${ev.id}] (Source: ${ev.source}, Weight: ${(ev.weight * 100).toFixed(0)}%, Captured: ${ev.captured}): ${ev.summary}`,
    );
  }
  lines.push("");

  lines.push("=== CONNECTED DATA SOURCES (13 FEEDS) ===");
  for (const src of ctx.connectedSources) {
    lines.push(
      `- ${src.name} (${src.type}): Status=${src.status.toUpperCase()}, Latency=${src.latencyMs}ms`,
    );
  }
  lines.push("");

  lines.push("=== EMAIL & NOTIFICATION WORKFLOW LOG ===");
  for (const em of ctx.emails) {
    lines.push(
      `[${em.id}] Stage: ${em.stage} | Status: ${em.status} | Time: ${em.sentAt} | From: ${em.from} -> To: ${em.to} | Subject: ${em.subject}`,
    );
  }

  return lines.join("\n");
}
