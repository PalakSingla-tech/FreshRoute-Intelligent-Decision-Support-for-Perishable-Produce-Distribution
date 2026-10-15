import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "info" | "warning" | "danger";

export interface KpiTrend {
  direction: "up" | "down" | "flat";
  text: string;
  good?: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: KpiTone;
  trend: KpiTrend;
  ringValue?: number;
  compact?: boolean;
}

const toneClasses: Record<
  KpiTone,
  { bar: string; iconBg: string; hex: string }
> = {
  primary: {
    bar: "bg-primary",
    iconBg: "bg-primary/15 text-primary",
    hex: "#22C55E",
  },
  info: { bar: "bg-info", iconBg: "bg-info/15 text-info", hex: "#0284C7" },
  warning: {
    bar: "bg-warning",
    iconBg: "bg-warning/15 text-warning",
    hex: "#EAB308",
  },
  danger: {
    bar: "bg-danger",
    iconBg: "bg-danger/15 text-danger",
    hex: "#EF4444",
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

function ProgressRing({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={[{ value: clamped }]}
          innerRadius="76%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill={color}
            background={{ fill: "rgba(255,255,255,0.06)" }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-foreground">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  trend,
  ringValue,
  compact = false,
}: KpiCardProps) {
  const TrendIcon = trendIcons[trend.direction];
  const trendColor =
    trend.good === undefined
      ? "text-muted-foreground"
      : trend.good
        ? "text-primary"
        : "text-danger";

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-lg",
        compact ? "p-4" : "p-6",
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-1 transition-opacity group-hover:opacity-100", toneClasses[tone].bar)}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              toneClasses[tone].iconBg,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="truncate text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {label}
          </p>
        </div>
        {ringValue !== undefined && (
          <ProgressRing value={ringValue} color={toneClasses[tone].hex} />
        )}
      </div>

      <p className="mt-6 text-2xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-3xl font-heading">
        {value}
      </p>

      <div
        className={cn(
          "mt-3 flex items-center gap-2 text-sm font-medium",
          trendColor,
        )}
      >
        <TrendIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        <span>{trend.text}</span>
      </div>
    </motion.div>
  );
}
