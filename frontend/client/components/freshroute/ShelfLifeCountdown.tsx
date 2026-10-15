import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShelfLifeCountdownProps {
  initialHours: number;
  className?: string;
}

export function ShelfLifeCountdown({
  initialHours,
  className,
}: ShelfLifeCountdownProps) {
  // Convert hours to seconds
  const [secondsLeft, setSecondsLeft] = useState(
    Math.round(initialHours * 3600),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formatted = `${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = hours < 6;
  const isCritical = hours < 4;

  const pct = Math.min(Math.max((secondsLeft / (24 * 3600)) * 100, 5), 100);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold tabular-nums">
          {isCritical ? (
            <Flame className="h-3.5 w-3.5 animate-bounce text-danger" aria-hidden="true" />
          ) : isUrgent ? (
            <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          )}
          <span
            className={cn(
              isCritical
                ? "text-danger animate-pulse"
                : isUrgent
                  ? "text-amber-400"
                  : "text-foreground",
            )}
          >
            {formatted}
          </span>
        </div>

        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isCritical
              ? "bg-danger/15 text-danger border border-danger/30"
              : isUrgent
                ? "bg-warning/15 text-amber-400 border border-warning/30"
                : "bg-primary/10 text-primary border border-primary/20",
          )}
        >
          {isCritical ? "Critical Rot Risk" : isUrgent ? "FEFO Priority" : "Stable"}
        </span>
      </div>

      {/* Mini shelf-life buffer gauge */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isCritical ? "bg-danger" : isUrgent ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
