import { cn } from "@/lib/utils";
import { usePlan } from "./PlanContext";

const badgeBase =
  "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export function PlanModeSelector() {
  const { mode, setMode } = usePlan();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Active plan
      </span>
      <div role="group" aria-label="Plan mode" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={mode === "baseline"}
          onClick={() => setMode("baseline")}
          className={cn(
            badgeBase,
            "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground",
            mode === "baseline" &&
              "border-white/30 bg-white/10 text-foreground ring-1 ring-white/20",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          Baseline Plan
        </button>
        <button
          type="button"
          aria-pressed={mode === "fresh"}
          onClick={() => setMode("fresh")}
          className={cn(
            badgeBase,
            "border-primary/25 bg-primary/5 text-primary/70 hover:text-primary",
            mode === "fresh" &&
              "border-primary/50 bg-primary/15 text-primary shadow-glow",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          FreshRoute Plan
        </button>
      </div>
    </div>
  );
}
