export type Status = "good" | "watch" | "warning" | "critical";

export interface Machine {
  id: string;
  name: string;
  kind: string;
  line: string;
  mission: string;
  baseline: MachineMetrics;
  installed: string;
  lastService: string;
}

export interface MachineMetrics {
  output: number; // units / hr
  cycleTime: number; // seconds
  vibration: number; // mm/s RMS
  temperature: number; // °C
  power: number; // kW
}

export interface MachineState extends MachineMetrics {
  id: string;
  health: number; // 0-100
  status: Status;
  online: boolean;
  sensorOffline: boolean;
}

export interface TelemetryPoint extends MachineMetrics {
  t: number;
  label: string;
}

export interface ConnectedSource {
  id: string;
  name: string;
  type: string;
  status: "streaming" | "degraded" | "offline";
  latencyMs: number;
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  severity: Status;
  machineId?: string;
  mission: string;
  confidence: number;
  signals: string[];
  createdAt: string;
  status: "Open" | "Acknowledged" | "Investigating" | "Action Recommended" | "Resolved";
}

export interface InvestigationStep {
  id: string;
  agent: string;
  role: string;
  tools: string[];
  finding: string;
  confidence: number;
  cost: number;
}

export interface Investigation {
  id: string;
  title: string;
  machineId: string;
  trigger: string;
  confidence: number;
  cost: number;
  status: "Queued" | "Running" | "Awaiting Approval" | "Approved" | "Rejected";
  steps: InvestigationStep[];
  conclusion: string;
  recommendation: string;
}

export interface EvidenceItem {
  id: string;
  source: string;
  summary: string;
  weight: number;
  captured: string;
}

export interface EmailEvent {
  id: string;
  subject: string;
  from: string;
  to: string;
  stage: string;
  status: "Draft" | "Queued" | "Sent" | "Approved" | "Completed";
  sentAt: string;
  body: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  kind?: "analytics" | "evidence" | "diagnosis" | "approval" | "email";
  bullets?: string[];
  createdAt: number;
}
