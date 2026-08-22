import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Cpu,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Moon,
  Search,
  Sun,
  Terminal,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSimEngine } from "@/hooks/useSimEngine";
import { useCriticalAlertEmails } from "@/hooks/useCriticalAlertEmails";
import { Toaster } from "@/components/ui/sonner";
import { useSimulationStore } from "@/stores/simulationStore";
import { SEED_ALERTS } from "@/lib/mockData";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/investigations", label: "Investigations", icon: Search },
  { to: "/chat", label: "Ask AI", icon: MessageSquare },
  { to: "/email-trail", label: "Email Trail", icon: Mail },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cs-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cs-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function OperatorLayout({ children }: { children: ReactNode }) {
  useSimEngine();
  useCriticalAlertEmails();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tick = useSimulationStore((s) => s.tick);
  const openAlerts = SEED_ALERTS.filter((a) => a.status !== "Resolved").length;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Activity className="size-5 text-accent" />
          <div>
            <p className="font-display text-sm font-bold leading-tight">Cross-Sense AI+</p>
            <p className="text-[11px] text-muted-foreground">Factory Operations</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                {item.label === "Alerts" ? (
                  <span className="ml-auto rounded-full bg-status-critical/15 px-1.5 text-[11px] font-bold text-status-critical">
                    {openAlerts}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Link
            to="/hacker"
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Terminal className="size-4" /> Hacker Pod
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-card/85 px-5 py-3 backdrop-blur">
          <div className="md:hidden">
            <Activity className="size-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold">Northgate Plant 2 · Shift B</p>
            <p className="text-xs text-muted-foreground">
              Mission A · Mission B · Mission C — 6 assets, 13 connected sources
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-good/40 bg-status-good/10 px-2.5 py-1 text-xs font-semibold text-status-good">
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              Live · tick {tick}
            </span>
            <span className="hidden rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
              Role: Operator
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
