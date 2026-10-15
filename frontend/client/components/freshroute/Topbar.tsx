import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { usePlan } from "./PlanContext";
import { useTheme } from "./ThemeContext";
import { PrimaryButton } from "./PrimaryButton";
import { StatusBadge } from "./StatusBadge";
import { MandiDispatchModal } from "./MandiDispatchModal";

export function Topbar() {
  const { runPlan, runs, scenario } = usePlan();
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl font-heading">
                Perishable Distribution Command Center
              </h1>
              <StatusBadge tone="success" pulse>
                Planner Ready
              </StatusBadge>
              {scenario && (
                <StatusBadge tone="warning">
                  Scenario Active
                </StatusBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Planning Window: 14 Oct, 8:00 PM – 15 Oct, 8:00 PM · Punjab APMC Network
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to Daytime Farm-Fresh mode" : "Switch to Botanical Dark mode"}
              title={isDark ? "Switch to Daytime Farm-Fresh mode" : "Switch to Botanical Dark mode"}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 shadow-sm"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-warning" aria-hidden="true" />
                  <span className="hidden sm:inline">Daytime Fresh</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="hidden sm:inline">Botanical Dark</span>
                </>
              )}
            </button>
            <MandiDispatchModal />
            <PrimaryButton
              variant="secondary"
              disabled={runs.baseline.status === "running"}
              onClick={() => runPlan("baseline")}
            >
              Run Baseline Plan
            </PrimaryButton>
            <PrimaryButton
              disabled={runs.fresh.status === "running"}
              onClick={() => runPlan("fresh")}
            >
              Run FreshRoute Plan
            </PrimaryButton>
            <Link to="/scenarios">
              <PrimaryButton variant="warning">
                Simulate Disruptions
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
