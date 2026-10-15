import type { AllocationPlan } from "@/lib/distribution-planner";
import { riskFor, type InventoryBatch } from "@/lib/inventory-batches";

export type PlanMode = "baseline" | "fresh";

export interface PlanMetrics {
  spoilageKg: number;
  demandFulfilled: number;
  netRevenue: number;
  highRiskBatches: number;
  transportCost: number;
  discountCost: number;
}

export interface PlanSnapshot extends PlanMetrics {
  unallocatedKg: number;
  constraintViolations: number;
}

// Spoilage estimate: unallocated stock plus allocations whose travel and
// handling time exceed the batch's remaining shelf life at dispatch.
export function snapshotFromPlan(
  plan: AllocationPlan,
  batches: InventoryBatch[],
): PlanSnapshot {
  let infeasibleKg = 0;
  let netRevenue = 0;
  let transportCost = 0;
  let discountCost = 0;
  const allocatedByBatch = new Map<string, number>();
  const batchesWithInfeasibleRows = new Set<string>();

  for (const row of plan.allocations) {
    netRevenue += row.netProceedsInr;
    transportCost += row.transportCostInr;
    discountCost += row.discountCostInr;
    allocatedByBatch.set(
      row.batchId,
      (allocatedByBatch.get(row.batchId) ?? 0) + row.allocatedKg,
    );
    if (row.travelAndHandlingHours > row.shelfLifeAtDispatchHours) {
      infeasibleKg += row.allocatedKg;
      batchesWithInfeasibleRows.add(row.batchId);
    }
  }

  const { unallocatedKg, demandFulfilledPct, constraintViolations } =
    plan.summary;
  const highRiskAtRisk = batches.filter(
    (batch) =>
      riskFor(batch.remainingHours) === "High" &&
      (batchesWithInfeasibleRows.has(batch.id) ||
        (allocatedByBatch.get(batch.id) ?? 0) < batch.quantityKg),
  ).length;

  return {
    spoilageKg: Math.round(infeasibleKg + unallocatedKg),
    demandFulfilled: demandFulfilledPct,
    netRevenue: Math.round(netRevenue),
    highRiskBatches: highRiskAtRisk,
    transportCost: Math.round(transportCost),
    discountCost: Math.round(discountCost),
    unallocatedKg,
    constraintViolations,
  };
}

export const PLAN_METRICS: Record<PlanMode, PlanMetrics> = {
  baseline: {
    spoilageKg: 180,
    demandFulfilled: 68,
    netRevenue: 42000,
    highRiskBatches: 5,
    transportCost: 9200,
    discountCost: 1800,
  },
  fresh: {
    spoilageKg: 40,
    demandFulfilled: 89,
    netRevenue: 58500,
    highRiskBatches: 2,
    transportCost: 7600,
    discountCost: 3100,
  },
};

export const PLAN_LABELS: Record<PlanMode, string> = {
  baseline: "Baseline Plan",
  fresh: "FreshRoute Plan",
};

export const formatInr = (amount: number) =>
  `₹${Math.round(amount).toLocaleString("en-IN")}`;
