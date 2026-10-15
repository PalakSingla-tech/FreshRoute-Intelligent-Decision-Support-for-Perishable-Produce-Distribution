import { CircleCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { PlanModeSelector } from "@/components/freshroute/PlanModeSelector";
import { usePlan } from "@/components/freshroute/PlanContext";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { formatInr, type PlanMetrics } from "@/lib/plan-metrics";

interface ImpactMetric {
  label: string;
  baseline: number;
  fresh: number;
  format: (value: number) => string;
}

const buildMetrics = (
  baseline: PlanMetrics,
  fresh: PlanMetrics,
): ImpactMetric[] => [
  {
    label: "Spoiled stock (kg)",
    baseline: baseline.spoilageKg,
    fresh: fresh.spoilageKg,
    format: (v) => `${Math.round(v)} kg`,
  },
  {
    label: "Demand fulfilled (%)",
    baseline: baseline.demandFulfilled,
    fresh: fresh.demandFulfilled,
    format: (v) => `${Math.round(v)}%`,
  },
  {
    label: "Transport cost (INR)",
    baseline: baseline.transportCost,
    fresh: fresh.transportCost,
    format: formatInr,
  },
  {
    label: "Discount cost (INR)",
    baseline: baseline.discountCost,
    fresh: fresh.discountCost,
    format: formatInr,
  },
  {
    label: "Net revenue (INR)",
    baseline: baseline.netRevenue,
    fresh: fresh.netRevenue,
    format: formatInr,
  },
];

const insights = [
  "Perishability-first dispatch reduced early expiry.",
  "Demand-aware allocation improved fulfillment.",
  "Targeted discounts recovered at-risk stock.",
];

const BASELINE_COLOR = "#4B5563";
const FRESH_COLOR = "#22C55E";

function ImpactBarChart({
  metric,
  compact,
}: {
  metric: ImpactMetric;
  compact: boolean;
}) {
  const data = [
    {
      name: metric.label,
      baseline: metric.baseline,
      fresh: metric.fresh,
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-muted-foreground">
        {metric.label}
      </p>
      <div className={compact ? "mt-2 h-40" : "mt-3 h-56"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" hide />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={(v) => Number(v).toLocaleString("en-IN")}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#F9FAFB",
              }}
              formatter={(value, name) => [
                metric.format(Number(value)),
                String(name),
              ]}
            />
            <Bar
              dataKey="baseline"
              name="Baseline"
              fill={BASELINE_COLOR}
              radius={[6, 6, 0, 0]}
              barSize={40}
              isAnimationActive
            >
              <LabelList
                dataKey="baseline"
                position="top"
                formatter={(v: unknown) => metric.format(Number(v))}
                fill="#9CA3AF"
                fontSize={12}
              />
            </Bar>
            <Bar
              dataKey="fresh"
              name="FreshRoute"
              fill={FRESH_COLOR}
              radius={[6, 6, 0, 0]}
              barSize={40}
              isAnimationActive
            >
              <LabelList
                dataKey="fresh"
                position="top"
                formatter={(v: unknown) => metric.format(Number(v))}
                fill={FRESH_COLOR}
                fontSize={12}
                fontWeight={700}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface PlanImpactProps {
  variant?: "compact" | "full";
}

export function PlanImpact({ variant = "full" }: PlanImpactProps) {
  const compact = variant === "compact";
  const { baseline, freshRoute } = usePlan();
  const metrics = buildMetrics(baseline, freshRoute);

  return (
    <SectionCard
      title="Plan Impact"
      description="Baseline (gray) vs. FreshRoute (green) across five outcome metrics"
      action={
        compact ? (
          <div className="flex items-center gap-2">
            <Link
              to="/reports"
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              Detailed Report →
            </Link>
            <PlanModeSelector />
          </div>
        ) : undefined
      }
      className="border-primary/30 shadow-[0_0_40px_-12px_rgba(34,197,94,0.35)] ring-1 ring-primary/20"
      bodyClassName={compact ? "mt-5" : "mt-6"}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <ImpactBarChart
            key={metric.label}
            metric={metric}
            compact={compact}
          />
        ))}
      </div>

      {!compact && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why FreshRoute wins
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {insights.map((text) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-4"
              >
                <CircleCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium leading-relaxed text-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
