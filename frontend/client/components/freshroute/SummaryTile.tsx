import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SummaryTile({
  label,
  value,
  tone,
  footnote,
}: {
  label: string;
  value: string;
  tone?: "danger";
  footnote?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-card/80 p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "danger" ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </p>
      {footnote && (
        <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
      )}
    </div>
  );
}
