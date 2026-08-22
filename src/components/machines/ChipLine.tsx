import { Cpu } from "lucide-react";
import type { Status } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";

/**
 * Decorative fab line: silicon chips travelling left → right along a conveyor belt.
 */
export function ChipLine({
  status,
  throughput,
  oilTemp,
}: {
  status: Status;
  throughput: number;
  oilTemp: number;
}) {
  const chips = Array.from({ length: 9 });
  // Faster belt when the line is healthy.
  const duration = status === "critical" ? 9 : status === "warning" ? 7 : 4.5;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Cpu className="size-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Chip fabrication line</h2>
        <StatusBadge status={status} />
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {throughput} chips/hr · belt oil {oilTemp}°C
        </span>
      </div>

      <div className="relative mt-5 h-28 rounded-lg bg-secondary/50">
        {/* belt */}
        <div className="absolute inset-x-0 bottom-6 h-6 overflow-hidden rounded-sm bg-foreground/80">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 14px, hsl(0 0% 100% / 0.6) 14px 18px)",
              animation: `chip-belt ${duration / 6}s linear infinite`,
            }}
          />
        </div>
        {/* rollers */}
        <div className="absolute inset-x-2 bottom-2 flex justify-between">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="size-3 rounded-full border border-border bg-muted" />
          ))}
        </div>

        {/* chips */}
        {chips.map((_, i) => (
          <div
            key={i}
            className="absolute bottom-12"
            style={{
              animation: `chip-travel ${duration}s linear infinite`,
              animationDelay: `${(duration / chips.length) * i * -1}s`,
            }}
          >
            <ChipGlyph />
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Wafers are diced, picked and placed, then taped into reels. Belt speed follows live line
        health — a degrading asset visibly slows the flow.
      </p>

      <style>{`
        @keyframes chip-travel {
          from { transform: translateX(-3rem); }
          to { transform: translateX(calc(100% + 100vw)); }
        }
        @keyframes chip-belt {
          from { transform: translateX(0); }
          to { transform: translateX(18px); }
        }
      `}</style>
    </section>
  );
}

function ChipGlyph() {
  return (
    <div className="relative flex size-8 items-center justify-center rounded-[3px] bg-primary/90 shadow-sm">
      <div className="size-3.5 rounded-[1px] border border-primary-foreground/60" />
      {["left-0 top-1.5", "left-0 bottom-1.5", "right-0 top-1.5", "right-0 bottom-1.5"].map((p) => (
        <span key={p} className={`absolute ${p} h-0.5 w-1.5 -mx-1.5 bg-muted-foreground`} />
      ))}
    </div>
  );
}
