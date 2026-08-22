import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, RotateCcw, Terminal } from "lucide-react";
import { MACHINES } from "@/lib/mockData";
import { useSimEngine } from "@/hooks/useSimEngine";
import { useSimulationStore, type Preset } from "@/stores/simulationStore";
import type { MachineMetrics } from "@/types";

export const Route = createFileRoute("/hacker")({
  head: () => ({
    meta: [
      { title: "Hacker Pod — Cross-Sense AI+" },
      {
        name: "description",
        content:
          "Demo control room: force machine faults, nudge KPIs and edit AI responses. Changes sync to the operator console live.",
      },
      { property: "og:title", content: "Hacker Pod — Cross-Sense AI+" },
      {
        property: "og:description",
        content: "Force faults and nudge live KPIs to drive the operator console demo.",
      },
    ],
  }),
  component: HackerPod,
});

const PRESETS: { key: Preset; label: string }[] = [
  { key: "off", label: "Turn Off" },
  { key: "on", label: "Turn On" },
  { key: "upgrade", label: "Upgrade" },
  { key: "degrade", label: "Degrade" },
  { key: "vibration", label: "Inject Vibration" },
  { key: "slowCycle", label: "Slow Cycle" },
  { key: "sensorOffline", label: "Sensor Offline" },
  { key: "restore", label: "Restore Normal" },
];

const METRICS: { key: keyof MachineMetrics; label: string; step: number }[] = [
  { key: "output", label: "Output (u/hr)", step: 5 },
  { key: "cycleTime", label: "Cycle time (s)", step: 1 },
  { key: "vibration", label: "Vibration (mm/s)", step: 0.5 },
  { key: "temperature", label: "Oil temperature (°C)", step: 2 },
  { key: "power", label: "Power (kW)", step: 2 },
];

function HackerPod() {
  useSimEngine();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState("M-37");

  const machines = useSimulationStore((s) => s.machines);
  const applyPreset = useSimulationStore((s) => s.applyPreset);
  const nudge = useSimulationStore((s) => s.nudge);
  const resetAll = useSimulationStore((s) => s.resetAll);
  const degradation = useSimulationStore((s) => s.degradation);
  const autoDegrade = useSimulationStore((s) => s.autoDegrade);
  const setDegradation = useSimulationStore((s) => s.setDegradation);
  const setAutoDegrade = useSimulationStore((s) => s.setAutoDegrade);
  const aiResponses = useSimulationStore((s) => s.aiResponses);
  const setAiResponse = useSimulationStore((s) => s.setAiResponse);

  const state = machines[selected];

  if (!authed) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-surface p-6 text-foreground">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAuthed(true);
          }}
          className="w-full max-w-sm rounded-xl border border-border bg-surface-strong p-6"
        >
          <div className="flex items-center gap-2">
            <Terminal className="size-5 text-accent" />
            <h1 className="font-display text-lg font-bold">Hacker Pod</h1>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Demo control room. Any password works.
          </p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Passphrase
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Lock className="size-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="••••••••"
            />
          </div>
          <button className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
            Enter pod
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-surface p-5 text-foreground">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <Terminal className="size-5 text-accent" />
        <h1 className="font-display text-lg font-bold">Hacker Pod</h1>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
          Syncs to operator tab in ~1.5s
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-strong"
          >
            <RotateCcw className="size-3.5" /> Reset all
          </button>
          <Link
            to="/"
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-strong"
          >
            Operator console
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-strong p-4">
          <h2 className="font-display text-sm font-semibold">Target machine</h2>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {MACHINES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name}
              </option>
            ))}
          </select>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(selected, p.key)}
                className="rounded-lg border border-border px-2 py-2 text-xs font-semibold hover:border-accent hover:text-accent"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">#37 degradation</span>
              <span className="font-mono">{Math.round(degradation * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(degradation * 100)}
              onChange={(e) => setDegradation(Number(e.target.value) / 100)}
              className="mt-2 w-full accent-[var(--accent)]"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoDegrade}
                onChange={(e) => setAutoDegrade(e.target.checked)}
              />
              Auto-degrade over time
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-strong p-4">
          <h2 className="font-display text-sm font-semibold">KPI direct control — {selected}</h2>
          <div className="mt-3 space-y-2">
            {METRICS.map((m) => (
              <div
                key={m.key}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span className="text-xs">{m.label}</span>
                <span className="ml-auto font-mono text-sm tabular-nums">
                  {state?.[m.key] ?? "—"}
                </span>
                <button
                  onClick={() => nudge(selected, m.key, -m.step)}
                  className="rounded-md border border-border px-2 text-sm hover:text-accent"
                >
                  −
                </button>
                <button
                  onClick={() => nudge(selected, m.key, m.step)}
                  className="rounded-md border border-border px-2 text-sm hover:text-accent"
                >
                  +
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Status: {state?.status ?? "—"} · health {state?.health ?? "—"}/100 ·{" "}
            {state?.online ? "online" : "stopped"}
            {state?.sensorOffline ? " · sensor offline" : ""}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface-strong p-4 lg:col-span-2">
          <h2 className="font-display text-sm font-semibold">AI response editor</h2>
          <p className="text-xs text-muted-foreground">
            Placeholders: {"{{output}}"}, {"{{vibration}}"}, {"{{cycle}}"}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(aiResponses).map(([key, value]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {key}
                </span>
                <textarea
                  value={value}
                  onChange={(e) => setAiResponse(key, e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
