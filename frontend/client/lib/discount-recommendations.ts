import {
  BASE_DATASET,
  MIN_SHELF_LIFE_BUFFER_HOURS,
  formatHours,
  type AllocationPlan,
  type Destination,
  type PlanDataset,
} from "@/lib/distribution-planner";
import {
  riskFor,
  type InventoryBatch,
  type RiskLevel,
} from "@/lib/inventory-batches";

export const DISCOUNT_WINDOW_HOURS = 24;
export const HIGH_RISK_DISCOUNT_RATE = 0.25;
export const MEDIUM_RISK_DISCOUNT_RATE = 0.15;
export const CLEARANCE_SELL_THROUGH = 0.5;

export type DiscountAction = "discount" | "redirect" | "no-feasible-sale";

export interface DestinationCheck {
  destination: Destination;
  arrivalHours: number;
  shelfLifeOk: boolean;
  spareKg: number;
}

export interface DiscountRecommendation {
  batch: InventoryBatch;
  risk: RiskLevel;
  unallocatedKg: number;
  action: DiscountAction;
  discountRate: number | null;
  discountedPricePerKg: number | null;
  assumedSellableKg: number;
  potentialRevenueInr: number | null;
  redirectTo: DestinationCheck | null;
  destinationChecks: DestinationCheck[];
  reason: string;
}

export interface DiscountSummary {
  atRiskUnallocatedKg: number;
  discountedBatchCount: number;
  planDiscountedRevenueInr: number;
  potentialClearanceRevenueInr: number;
}

export interface DiscountResult {
  recommendations: DiscountRecommendation[];
  summary: DiscountSummary;
}

const EMPTY_SUMMARY: DiscountSummary = {
  atRiskUnallocatedKg: 0,
  discountedBatchCount: 0,
  planDiscountedRevenueInr: 0,
  potentialClearanceRevenueInr: 0,
};

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

const addTo = (map: Map<string, number>, key: string, value: number) => {
  map.set(key, (map.get(key) ?? 0) + value);
};

const clearanceRateFor = (
  batch: InventoryBatch,
  risk: RiskLevel,
): number | null => {
  if (batch.remainingHours < MIN_SHELF_LIFE_BUFFER_HOURS) return null;
  if (risk === "High") return HIGH_RISK_DISCOUNT_RATE;
  if (risk === "Medium") return MEDIUM_RISK_DISCOUNT_RATE;
  return null;
};

const reasonFor = (
  batch: InventoryBatch,
  action: DiscountAction,
  redirectTo: DestinationCheck | null,
  discountRate: number | null,
): string => {
  if (action === "redirect" && redirectTo) {
    return `${redirectTo.destination.name} can still take this batch: ${formatHours(redirectTo.arrivalHours)} of shelf life remains on arrival, and ${kg(redirectTo.spareKg)} of demand and capacity is spare in this plan. Redirecting is not a discount.`;
  }
  if (action === "discount" && discountRate !== null) {
    return `${formatHours(batch.remainingHours)} remain, so no destination in this plan fits travel and handling within shelf life. A ${Math.round(discountRate * 100)}% clearance discount for a local sale is the remaining option. The discount does not extend shelf life.`;
  }
  if (batch.remainingHours < MIN_SHELF_LIFE_BUFFER_HOURS) {
    return `Only ${formatHours(batch.remainingHours)} remain, below the ${MIN_SHELF_LIFE_BUFFER_HOURS} h buffer. No destination or discount makes a sale feasible.`;
  }
  return `${formatHours(batch.remainingHours)} remain, above the ${DISCOUNT_WINDOW_HOURS} h discount window, and no destination in this plan has spare capacity that fits its shelf life. No discount is recommended.`;
};

export function buildDiscountResult(
  plan: AllocationPlan | null,
  dataset: PlanDataset = BASE_DATASET,
): DiscountResult {
  if (!plan) return { recommendations: [], summary: EMPTY_SUMMARY };

  const effectiveDataset = dataset ?? BASE_DATASET;
  const destinations = effectiveDataset.destinations ?? [];
  const batches = effectiveDataset.batches ?? [];

  const allocatedByBatch = new Map<string, number>();
  const allocatedByDestination = new Map<string, number>();
  let planDiscountedRevenueInr = 0;
  for (const row of plan.allocations) {
    addTo(allocatedByBatch, row.batchId, row.allocatedKg);
    addTo(allocatedByDestination, row.destinationId, row.allocatedKg);
    if (row.discountRate > 0) {
      planDiscountedRevenueInr += row.allocatedKg * row.appliedPricePerKg;
    }
  }

  const spareKgByDestination = new Map(
    destinations.map((destination) => [
      destination.id,
      Math.max(
        0,
        Math.min(destination.demandKg, destination.capacityKg) -
          (allocatedByDestination.get(destination.id) ?? 0),
      ),
    ]),
  );

  const recommendations: DiscountRecommendation[] = [];
  for (const batch of batches) {
    const unallocatedKg =
      batch.quantityKg - (allocatedByBatch.get(batch.id) ?? 0);
    if (unallocatedKg <= 0) continue;

    const risk = riskFor(batch.remainingHours);
    const destinationChecks: DestinationCheck[] = destinations.map(
      (destination) => {
        const arrivalHours =
          batch.remainingHours -
          (destination.travelHours +
            plan.routeDelayHours +
            destination.handlingHours);
        return {
          destination,
          arrivalHours,
          shelfLifeOk: arrivalHours >= MIN_SHELF_LIFE_BUFFER_HOURS,
          spareKg: spareKgByDestination.get(destination.id) ?? 0,
        };
      },
    );
    const redirectTo =
      destinationChecks
        .filter((check) => check.shelfLifeOk && check.spareKg > 0)
        .sort((a, b) => b.spareKg - a.spareKg)[0] ?? null;

    const clearanceRate = clearanceRateFor(batch, risk);
    const action: DiscountAction = redirectTo
      ? "redirect"
      : clearanceRate !== null
        ? "discount"
        : "no-feasible-sale";
    const discountRate = action === "discount" ? clearanceRate : null;

    const assumedSellableKg = redirectTo
      ? Math.min(unallocatedKg, redirectTo.spareKg)
      : discountRate !== null
        ? Math.round(unallocatedKg * CLEARANCE_SELL_THROUGH)
        : 0;
    const discountedPricePerKg =
      discountRate === null ? null : batch.pricePerKg * (1 - discountRate);
    const potentialRevenueInr =
      discountedPricePerKg === null
        ? null
        : Math.round(assumedSellableKg * discountedPricePerKg);

    recommendations.push({
      batch,
      risk,
      unallocatedKg,
      action,
      discountRate,
      discountedPricePerKg,
      assumedSellableKg,
      potentialRevenueInr,
      redirectTo,
      destinationChecks,
      reason: reasonFor(batch, action, redirectTo, discountRate),
    });
  }

  recommendations.sort(
    (a, b) => a.batch.remainingHours - b.batch.remainingHours,
  );

  const summary: DiscountSummary = {
    atRiskUnallocatedKg: recommendations
      .filter((rec) => rec.risk !== "Low")
      .reduce((sum, rec) => sum + rec.unallocatedKg, 0),
    discountedBatchCount: recommendations.filter(
      (rec) => rec.action === "discount",
    ).length,
    planDiscountedRevenueInr: Math.round(planDiscountedRevenueInr),
    potentialClearanceRevenueInr: recommendations.reduce(
      (sum, rec) => sum + (rec.potentialRevenueInr ?? 0),
      0,
    ),
  };

  return { recommendations, summary };
}
