import { cn } from "@/lib/utils";
import type { Status } from "@/types";

const LABEL: Record<Status, string> = {
  good: "Healthy",
  watch: "Watch",
  warning: "Degrading",
  critical: "Critical",
};

const TONE: Record<Status, string> = {
  good: "bg-status-good/12 text-status-good border-status-good/35",
  watch: "bg-status-watch/15 text-status-watch border-status-watch/40",
  warning: "bg-status-warning/15 text-status-warning border-status-warning/40",
  critical: "bg-status-critical/12 text-status-critical border-status-critical/40",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        TONE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? LABEL[status]}
    </span>
  );
}

export const statusText: Record<Status, string> = {
  good: "text-status-good",
  watch: "text-status-watch",
  warning: "text-status-warning",
  critical: "text-status-critical",
};

export const statusStroke: Record<Status, string> = {
  good: "var(--status-good)",
  watch: "var(--status-watch)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};
