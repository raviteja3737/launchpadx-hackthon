import { cn } from "@/lib/utils";
import type { Status } from "@/types";
import { statusText } from "@/components/ui/status-badge";

export function StatCard({
  label,
  value,
  unit,
  delta,
  status = "good",
  caption,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  status?: Status;
  caption: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm transition-colors",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("font-display text-3xl font-semibold tabular-nums", statusText[status])}>
          {value}
        </span>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {delta ? (
        <p className={cn("mt-1 text-xs font-medium tabular-nums", statusText[status])}>{delta}</p>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  );
}
