import {
  ArrowRight,
  CircleCheck,
  IndianRupee,
  Leaf,
  PackageCheck,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DispatchTable } from "@/components/freshroute/DispatchTable";
import { KpiCard, type KpiTrend } from "@/components/freshroute/KpiCard";
import { PlanImpact } from "@/components/freshroute/PlanImpact";
import { usePlan } from "@/components/freshroute/PlanContext";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { ShelfLifeCountdown } from "@/components/freshroute/ShelfLifeCountdown";
import { PunjabHubsOverview } from "@/components/freshroute/PunjabHubsOverview";
import { AgriClimateTicker } from "@/components/freshroute/AgriClimateTicker";
import { useMemo } from "react";
import { useCountUp } from "@/hooks/use-count-up";
import { INVENTORY_BATCHES, riskFor } from "@/lib/inventory-batches";
import { formatInr } from "@/lib/plan-metrics";

const signed = (delta: number, format: (abs: number) => string) =>
  `${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`;

const baselineTrend: KpiTrend = {
  direction: "flat",
  text: "Baseline reference",
};

function ViewAllLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

export default function Index() {
  const { mode, baseline, freshRoute, planDataset } = usePlan();
  const isFresh = mode === "fresh";
  const target = isFresh ? freshRoute : baseline;

  const criticalBatches = useMemo(() => {
    const batches = planDataset?.batches ?? INVENTORY_BATCHES;
    return batches
      .filter((batch) => riskFor(batch.remainingHours) === "High")
      .sort((a, b) => a.remainingHours - b.remainingHours)
      .slice(0, 3);
  }, [planDataset]);

  const spoilageKg = useCountUp(target.spoilageKg);
  const demandFulfilled = useCountUp(target.demandFulfilled);
  const netRevenue = useCountUp(target.netRevenue);
  const highRiskBatches = useCountUp(target.highRiskBatches);

  const spoilageDelta = freshRoute.spoilageKg - baseline.spoilageKg;
  const demandDelta = freshRoute.demandFulfilled - baseline.demandFulfilled;
  const revenueDelta = freshRoute.netRevenue - baseline.netRevenue;
  const riskDelta = freshRoute.highRiskBatches - baseline.highRiskBatches;

  return (
    <div className="flex flex-col gap-6">
      {/* Live Agri-Climate & Reefer Cold-Chain Telemetry (scrollable, dismissible/collapsible) */}
      <AgriClimateTicker />

      <section
        aria-label="Impact KPIs"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          compact
          label="Spoilage Reduction"
          value={`${Math.round(spoilageKg)} kg`}
          icon={Leaf}
          tone="danger"
          ringValue={
            ((baseline.spoilageKg - spoilageKg) / baseline.spoilageKg) * 100
          }
          trend={
            isFresh
              ? {
                  direction: spoilageDelta < 0 ? "down" : "up",
                  text: `${signed(spoilageDelta, (n) => `${n} kg`)} vs baseline`,
                  good: spoilageDelta < 0,
                }
              : baselineTrend
          }
        />
        <KpiCard
          compact
          label="Demand Fulfilled"
          value={`${Math.round(demandFulfilled)}%`}
          icon={PackageCheck}
          tone="primary"
          ringValue={demandFulfilled}
          trend={
            isFresh
              ? {
                  direction: demandDelta > 0 ? "up" : "down",
                  text: `${signed(demandDelta, (n) => `${n} pts`)} vs baseline`,
                  good: demandDelta > 0,
                }
              : baselineTrend
          }
        />
        <KpiCard
          compact
          label="Net Revenue"
          value={formatInr(netRevenue)}
          icon={IndianRupee}
          tone="info"
          trend={
            isFresh
              ? {
                  direction: revenueDelta > 0 ? "up" : "down",
                  text: `${signed(revenueDelta, formatInr)} vs baseline`,
                  good: revenueDelta > 0,
                }
              : baselineTrend
          }
        />
        <KpiCard
          compact
          label="High-Risk Batches"
          value={`${Math.round(highRiskBatches)}`}
          icon={isFresh && riskDelta < 0 ? CircleCheck : TriangleAlert}
          tone="warning"
          trend={
            isFresh
              ? {
                  direction: riskDelta < 0 ? "down" : "up",
                  text: `${signed(riskDelta, (n) => `${n} batches`)} vs baseline`,
                  good: riskDelta < 0,
                }
              : baselineTrend
          }
        />
      </section>

      <PlanImpact variant="compact" />

      <SectionCard
        title="Critical Inventory Alerts"
        description="High-risk batches with live decaying shelf-life countdown"
        action={<ViewAllLink to="/inventory" label="View inventory" />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {criticalBatches.map((batch) => (
            <div
              key={batch.id}
              className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger/5 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-foreground">
                  <span className="mr-2" aria-hidden="true">
                    {batch.emoji}
                  </span>
                  {batch.id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {batch.commodity}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {batch.quantityKg.toLocaleString("en-IN")} kg · {batch.recommendedAction}
              </p>
              <ShelfLifeCountdown initialHours={batch.remainingHours} className="mt-1" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Punjab Farm Hubs &amp; Cold Storage Clusters"
        description="Active regional production clusters, storage capacity, and dispatch readiness"
        action={<ViewAllLink to="/inventory" label="View all inventory" />}
      >
        <PunjabHubsOverview />
      </SectionCard>

      <SectionCard
        title="Recommended Dispatch Preview"
        description="Next lanes from the FreshRoute plan"
        action={<ViewAllLink to="/distribution" label="View full plan" />}
      >
        <DispatchTable limit={5} />
      </SectionCard>
    </div>
  );
}
