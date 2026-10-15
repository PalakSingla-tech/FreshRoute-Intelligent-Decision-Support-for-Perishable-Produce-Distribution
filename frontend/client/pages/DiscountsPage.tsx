import { AlertTriangle, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { DiscountRecommendations } from "@/components/freshroute/DiscountRecommendations";
import { DiscountRulesPanel } from "@/components/freshroute/DiscountRulesPanel";
import { PrimaryButton } from "@/components/freshroute/PrimaryButton";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { SummaryTile } from "@/components/freshroute/SummaryTile";
import { usePlan } from "@/components/freshroute/PlanContext";
import { buildDiscountResult } from "@/lib/discount-recommendations";
import { formatInr, PLAN_LABELS } from "@/lib/plan-metrics";

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

export default function DiscountsPage() {
  const { mode, runs, runPlan, planDataset } = usePlan();
  const run = runs[mode];
  const label = PLAN_LABELS[mode];
  const plan = run.status === "ready" ? run.plan : null;
  const result = useMemo(
    () => buildDiscountResult(plan, planDataset),
    [plan, planDataset],
  );
  const { summary } = result;
  const dash = "—";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            At-Risk Stock &amp; Discount Actions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review unsold stock and transparent discount recommendations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={mode === "fresh" ? "success" : "neutral"}>
            {label}
          </StatusBadge>
          <StatusBadge tone="info">Simulation dataset</StatusBadge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryTile
          label="At-risk unallocated stock"
          value={plan ? kg(summary.atRiskUnallocatedKg) : dash}
          footnote="Unallocated kg in batches with 24 h or less remaining"
        />
        <SummaryTile
          label="Batches with recommended discounts"
          value={plan ? String(summary.discountedBatchCount) : dash}
          footnote="Clearance discounts for local sale"
        />
        <SummaryTile
          label="Estimated discounted sales revenue"
          value={plan ? formatInr(summary.planDiscountedRevenueInr) : dash}
          footnote={
            plan
              ? `From plan allocations at discounted prices. Suggested clearance potential of ${formatInr(summary.potentialClearanceRevenueInr)} is not counted.`
              : "From plan allocations at discounted prices"
          }
        />
      </div>

      <SectionCard
        title="Recommendations"
        description={`Unallocated stock in the ${label} · shelf life checked against the planning dataset`}
      >
        {run.status === "idle" && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              No {label} has run yet. Run it to see which unallocated batches
              need a discount, a redirect, or have no feasible sale.
            </p>
            <PrimaryButton onClick={() => runPlan(mode)}>
              Run {label}
            </PrimaryButton>
          </div>
        )}

        {run.status === "running" && (
          <div
            role="status"
            className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-10 text-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Running simulated {label}…
            </p>
          </div>
        )}

        {run.status === "error" && (
          <div
            role="alert"
            className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-10 text-center"
          >
            <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                The {label} could not be generated.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{run.message}</p>
            </div>
            <PrimaryButton variant="secondary" onClick={() => runPlan(mode)}>
              Retry {label}
            </PrimaryButton>
          </div>
        )}

        {run.status === "ready" && (
          <DiscountRecommendations recommendations={result.recommendations} />
        )}
      </SectionCard>

      <DiscountRulesPanel />
    </div>
  );
}
