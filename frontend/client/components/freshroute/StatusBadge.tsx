import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

interface StatusBadgeProps {
  tone?: StatusTone;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<StatusTone, { pill: string; dot: string }> = {
  success: {
    pill: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  info: {
    pill: "border-info/30 bg-info/10 text-info",
    dot: "bg-info",
  },
  warning: {
    pill: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  danger: {
    pill: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
  neutral: {
    pill: "border-white/10 bg-white/[0.04] text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function StatusBadge({
  tone = "neutral",
  pulse = false,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone].pill,
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              toneClasses[tone].dot,
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            toneClasses[tone].dot,
          )}
        />
      </span>
      {children}
    </span>
  );
}
