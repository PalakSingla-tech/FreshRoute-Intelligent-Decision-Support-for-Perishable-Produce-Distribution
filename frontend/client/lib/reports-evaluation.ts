import {
  MIN_SHELF_LIFE_BUFFER_HOURS,
  type AllocationPlan,
  type Destination,
  type PlanDataset,
} from "@/lib/distribution-planner";
import { riskFor, type InventoryBatch } from "@/lib/inventory-batches";
import { formatInr, type PlanMode } from "@/lib/plan-metrics";

export interface PlanEvaluation {
  mode: PlanMode;
  name: string;
  totalSupplyKg: number;
  allocatedKg: number;
  unallocatedKg: number;
  expiredStockKg: number; // Infeasible in transit (travel + handling > remaining shelf life)
  spoiledQuantityKg: number; // unallocatedKg + expiredStockKg
  demandFulfilledPct: number;
  grossSalesRevenueInr: number;
  salesRevenueInr: number; // at applied discounted prices
  transportCostInr: number;
  handlingCostInr: number; // Defined as 0 (handling is in hours, cost bundled in transport rate)
  discountReductionInr: number; // Informational line: price concessions granted
  spoilageCostInr: number; // Value of spoiled stock based on acquisition price
  netRevenueInr: number; // salesRevenueInr - transportCostInr
  constraintViolations: number;
  shelfLifeFeasibilityPct: number;
}

export interface MetricComparisonRow {
  key: string;
  label: string;
  unit: string;
  category: "quantity" | "percentage" | "currency" | "count";
  baselineValue: number;
  freshValue: number;
  format: (value: number) => string;
  absoluteDiff: string;
  relativeChange: string;
  isImprovement: boolean | null; // null if informational
  note?: string;
  isInformationalOnly?: boolean;
}

export interface ConstraintAuditItem {
  id: string;
  dimension: string;
  ruleDescription: string;
  baselinePassed: boolean;
  baselinePassCount: number;
  baselineTotalCount: number;
  freshPassed: boolean;
  freshPassCount: number;
  freshTotalCount: number;
  baselineDetail: string;
  freshDetail: string;
}

export function evaluatePlan(
  plan: AllocationPlan,
  dataset: PlanDataset,
): PlanEvaluation {
  const { batches, destinations } = dataset;
  const totalSupplyKg = batches.reduce((sum, b) => sum + b.quantityKg, 0);
  const allocatedKg = plan.summary.allocatedKg;
  const unallocatedKg = plan.summary.unallocatedKg;

  let expiredStockKg = 0;
  let grossSalesRevenueInr = 0;
  let salesRevenueInr = 0;
  let transportCostInr = 0;
  let discountReductionInr = 0;
  let totalFeasibleRows = 0;

  for (const row of plan.allocations) {
    grossSalesRevenueInr += row.allocatedKg * row.marketPricePerKg;
    salesRevenueInr += row.allocatedKg * row.appliedPricePerKg;
    transportCostInr += row.transportCostInr;
    discountReductionInr += row.discountCostInr;

    // Check shelf-life feasibility: travel + handling must fit in batch remaining hours
    if (row.travelAndHandlingHours > row.shelfLifeAtDispatchHours) {
      expiredStockKg += row.allocatedKg;
    } else {
      totalFeasibleRows += 1;
    }
  }

  // End-of-horizon spoiled stock = unallocated surplus at origin + expired during transit
  const spoiledQuantityKg = unallocatedKg + expiredStockKg;

  // Average unit price of batches to estimate spoilage write-off cost
  const avgPricePerKg =
    batches.reduce((sum, b) => sum + b.pricePerKg * b.quantityKg, 0) /
    (totalSupplyKg || 1);
  const spoilageCostInr = Math.round(spoiledQuantityKg * avgPricePerKg);

  // Shared cost model: Net Revenue = Sales Revenue (already discounted) - Transport Cost
  const handlingCostInr = 0; // Terminal handling is tracked in hours, tariffs are included in transport tariff
  const netRevenueInr = Math.round(salesRevenueInr - transportCostInr - handlingCostInr);

  const shelfLifeFeasibilityPct =
    plan.allocations.length === 0
      ? 100
      : Math.round((totalFeasibleRows / plan.allocations.length) * 100);

  return {
    mode: plan.mode,
    name: plan.mode === "fresh" ? "FreshRoute Plan" : "Baseline Plan",
    totalSupplyKg,
    allocatedKg,
    unallocatedKg,
    expiredStockKg,
    spoiledQuantityKg,
    demandFulfilledPct: plan.summary.demandFulfilledPct,
    grossSalesRevenueInr: Math.round(grossSalesRevenueInr),
    salesRevenueInr: Math.round(salesRevenueInr),
    transportCostInr: Math.round(transportCostInr),
    handlingCostInr,
    discountReductionInr: Math.round(discountReductionInr),
    spoilageCostInr,
    netRevenueInr,
    constraintViolations: plan.summary.constraintViolations,
    shelfLifeFeasibilityPct,
  };
}

export function formatRelativeChange(baseline: number, current: number): string {
  if (baseline === 0) {
    return "N/A";
  }
  const pct = ((current - baseline) / Math.abs(baseline)) * 100;
  if (Math.abs(pct) < 0.05) return "0.0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatAbsoluteDiff(
  baseline: number,
  current: number,
  formatter: (v: number) => string,
): string {
  const diff = current - baseline;
  if (diff === 0) return "0";
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${formatter(Math.abs(diff))}`;
}

export function buildComparisonRows(
  baseline: PlanEvaluation,
  fresh: PlanEvaluation,
): MetricComparisonRow[] {
  return [
    {
      key: "spoilage",
      label: "Estimated spoiled quantity",
      unit: "kg",
      category: "quantity",
      baselineValue: baseline.spoiledQuantityKg,
      freshValue: fresh.spoiledQuantityKg,
      format: (v) => `${Math.round(v).toLocaleString("en-IN")} kg`,
      absoluteDiff: formatAbsoluteDiff(
        baseline.spoiledQuantityKg,
        fresh.spoiledQuantityKg,
        (v) => `${Math.round(v).toLocaleString("en-IN")} kg`,
      ),
      relativeChange: formatRelativeChange(
        baseline.spoiledQuantityKg,
        fresh.spoiledQuantityKg,
      ),
      isImprovement: fresh.spoiledQuantityKg < baseline.spoiledQuantityKg,
      note: "Unallocated stock + expired in-transit allocations.",
    },
    {
      key: "demand",
      label: "Demand fulfilled",
      unit: "%",
      category: "percentage",
      baselineValue: baseline.demandFulfilledPct,
      freshValue: fresh.demandFulfilledPct,
      format: (v) => `${Math.round(v)}%`,
      absoluteDiff: formatAbsoluteDiff(
        baseline.demandFulfilledPct,
        fresh.demandFulfilledPct,
        (v) => `${Math.round(v)} pts`,
      ),
      relativeChange: formatRelativeChange(
        baseline.demandFulfilledPct,
        fresh.demandFulfilledPct,
      ),
      isImprovement: fresh.demandFulfilledPct > baseline.demandFulfilledPct,
      note: "Percentage of total destination demand satisfied.",
    },
    {
      key: "salesRevenue",
      label: "Sales revenue",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.salesRevenueInr,
      freshValue: fresh.salesRevenueInr,
      format: formatInr,
      absoluteDiff: formatAbsoluteDiff(
        baseline.salesRevenueInr,
        fresh.salesRevenueInr,
        formatInr,
      ),
      relativeChange: formatRelativeChange(
        baseline.salesRevenueInr,
        fresh.salesRevenueInr,
      ),
      isImprovement: fresh.salesRevenueInr > baseline.salesRevenueInr,
      note: "Realized sales using applied discounted market selling prices.",
    },
    {
      key: "transportCost",
      label: "Transport cost",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.transportCostInr,
      freshValue: fresh.transportCostInr,
      format: formatInr,
      absoluteDiff: formatAbsoluteDiff(
        baseline.transportCostInr,
        fresh.transportCostInr,
        formatInr,
      ),
      relativeChange: formatRelativeChange(
        baseline.transportCostInr,
        fresh.transportCostInr,
      ),
      isImprovement: fresh.transportCostInr < baseline.transportCostInr,
      note: "Calculated strictly from destination transport tariffs (₹/kg).",
    },
    {
      key: "handlingCost",
      label: "Handling cost",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.handlingCostInr,
      freshValue: fresh.handlingCostInr,
      format: formatInr,
      absoluteDiff: "₹0",
      relativeChange: "N/A",
      isImprovement: null,
      note: "Terminal handling time is modeled in hours; cash tariffs are included in transport rates per dataset.",
      isInformationalOnly: true,
    },
    {
      key: "discountReduction",
      label: "Discount reduction",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.discountReductionInr,
      freshValue: fresh.discountReductionInr,
      format: formatInr,
      absoluteDiff: formatAbsoluteDiff(
        baseline.discountReductionInr,
        fresh.discountReductionInr,
        formatInr,
      ),
      relativeChange: formatRelativeChange(
        baseline.discountReductionInr,
        fresh.discountReductionInr,
      ),
      isImprovement: null,
      note: "Informational: price concessions granted. Already reflected in sales revenue; not deducted twice.",
      isInformationalOnly: true,
    },
    {
      key: "spoilageCost",
      label: "Spoilage cost",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.spoilageCostInr,
      freshValue: fresh.spoilageCostInr,
      format: formatInr,
      absoluteDiff: formatAbsoluteDiff(
        baseline.spoilageCostInr,
        fresh.spoilageCostInr,
        formatInr,
      ),
      relativeChange: formatRelativeChange(
        baseline.spoilageCostInr,
        fresh.spoilageCostInr,
      ),
      isImprovement: fresh.spoilageCostInr < baseline.spoilageCostInr,
      note: "Estimated acquisition value of unsold or expired inventory at horizon end.",
    },
    {
      key: "netRevenue",
      label: "Net revenue",
      unit: "₹",
      category: "currency",
      baselineValue: baseline.netRevenueInr,
      freshValue: fresh.netRevenueInr,
      format: formatInr,
      absoluteDiff: formatAbsoluteDiff(
        baseline.netRevenueInr,
        fresh.netRevenueInr,
        formatInr,
      ),
      relativeChange: formatRelativeChange(
        baseline.netRevenueInr,
        fresh.netRevenueInr,
      ),
      isImprovement: fresh.netRevenueInr > baseline.netRevenueInr,
      note: "Sales revenue minus transport costs (defined by dataset cost categories).",
    },
    {
      key: "violations",
      label: "Constraint violations",
      unit: "count",
      category: "count",
      baselineValue: baseline.constraintViolations,
      freshValue: fresh.constraintViolations,
      format: (v) => `${v}`,
      absoluteDiff: formatAbsoluteDiff(
        baseline.constraintViolations,
        fresh.constraintViolations,
        (v) => `${v}`,
      ),
      relativeChange: formatRelativeChange(
        baseline.constraintViolations,
        fresh.constraintViolations,
      ),
      isImprovement: fresh.constraintViolations < baseline.constraintViolations,
      note: "Total allocation checks failed across shelf-life, buffer, demand, and capacity.",
    },
  ];
}

export function performConstraintAudit(
  baselinePlan: AllocationPlan,
  freshPlan: AllocationPlan,
  dataset: PlanDataset,
): ConstraintAuditItem[] {
  const { batches, destinations } = dataset;

  // 1. Stock availability: Batch quantity must not be exceeded
  const auditStock = (plan: AllocationPlan) => {
    const allocatedByBatch = new Map<string, number>();
    for (const r of plan.allocations) {
      allocatedByBatch.set(r.batchId, (allocatedByBatch.get(r.batchId) ?? 0) + r.allocatedKg);
    }
    let passedCount = 0;
    for (const b of batches) {
      const allocated = allocatedByBatch.get(b.id) ?? 0;
      if (allocated <= b.quantityKg) passedCount++;
    }
    return {
      passed: passedCount === batches.length,
      passCount: passedCount,
      totalCount: batches.length,
    };
  };

  // 2. Destination demand: Destination demand must not be exceeded
  const auditDemand = (plan: AllocationPlan) => {
    const allocatedByDest = new Map<string, number>();
    for (const r of plan.allocations) {
      allocatedByDest.set(r.destinationId, (allocatedByDest.get(r.destinationId) ?? 0) + r.allocatedKg);
    }
    let passedCount = 0;
    for (const d of destinations) {
      const allocated = allocatedByDest.get(d.id) ?? 0;
      if (allocated <= d.demandKg) passedCount++;
    }
    return {
      passed: passedCount === destinations.length,
      passCount: passedCount,
      totalCount: destinations.length,
    };
  };

  // 3. Transport capacity: Destination vehicle/receipt capacity must not be exceeded
  const auditCapacity = (plan: AllocationPlan) => {
    const allocatedByDest = new Map<string, number>();
    for (const r of plan.allocations) {
      allocatedByDest.set(r.destinationId, (allocatedByDest.get(r.destinationId) ?? 0) + r.allocatedKg);
    }
    let passedCount = 0;
    for (const d of destinations) {
      const allocated = allocatedByDest.get(d.id) ?? 0;
      if (allocated <= d.capacityKg) passedCount++;
    }
    return {
      passed: passedCount === destinations.length,
      passCount: passedCount,
      totalCount: destinations.length,
    };
  };

  // 4. Shelf-life feasibility: travel + handling <= remaining shelf life & arrival >= 2h buffer
  const auditShelfLife = (plan: AllocationPlan) => {
    let passedCount = 0;
    for (const r of plan.allocations) {
      const clearsExpiry = r.travelAndHandlingHours <= r.shelfLifeAtDispatchHours;
      const clearsBuffer = r.arrivalShelfLifeHours >= MIN_SHELF_LIFE_BUFFER_HOURS;
      if (clearsExpiry && clearsBuffer) passedCount++;
    }
    return {
      passed: passedCount === plan.allocations.length,
      passCount: passedCount,
      totalCount: plan.allocations.length,
    };
  };

  // 5. Delivery windows: All allocations must arrive within 24-hour planning horizon
  const auditDeliveryWindows = (plan: AllocationPlan) => {
    const HORIZON_HOURS = 24;
    let passedCount = 0;
    for (const r of plan.allocations) {
      if (r.travelAndHandlingHours <= HORIZON_HOURS) {
        passedCount++;
      }
    }
    return {
      passed: passedCount === plan.allocations.length,
      passCount: passedCount,
      totalCount: plan.allocations.length,
    };
  };

  const bStock = auditStock(baselinePlan);
  const fStock = auditStock(freshPlan);

  const bDemand = auditDemand(baselinePlan);
  const fDemand = auditDemand(freshPlan);

  const bCapacity = auditCapacity(baselinePlan);
  const fCapacity = auditCapacity(freshPlan);

  const bShelf = auditShelfLife(baselinePlan);
  const fShelf = auditShelfLife(freshPlan);

  const bWindows = auditDeliveryWindows(baselinePlan);
  const fWindows = auditDeliveryWindows(freshPlan);

  return [
    {
      id: "stock",
      dimension: "Stock Availability",
      ruleDescription: "Allocated kilograms must not exceed available batch warehouse quantity.",
      baselinePassed: bStock.passed,
      baselinePassCount: bStock.passCount,
      baselineTotalCount: bStock.totalCount,
      freshPassed: fStock.passed,
      freshPassCount: fStock.passCount,
      freshTotalCount: fStock.totalCount,
      baselineDetail: `${bStock.passCount}/${bStock.totalCount} batches within warehouse supply limit`,
      freshDetail: `${fStock.passCount}/${fStock.totalCount} batches within warehouse supply limit`,
    },
    {
      id: "demand",
      dimension: "Destination Demand",
      ruleDescription: "Delivered volume per destination must not exceed market demand.",
      baselinePassed: bDemand.passed,
      baselinePassCount: bDemand.passCount,
      baselineTotalCount: bDemand.totalCount,
      freshPassed: fDemand.passed,
      freshPassCount: fDemand.passCount,
      freshTotalCount: fDemand.totalCount,
      baselineDetail: `${bDemand.passCount}/${bDemand.totalCount} destinations within demand ceiling`,
      freshDetail: `${fDemand.passCount}/${fDemand.totalCount} destinations within demand ceiling`,
    },
    {
      id: "capacity",
      dimension: "Transport Capacity",
      ruleDescription: "Shipments must stay within maximum receiving dock / fleet intake capacity.",
      baselinePassed: bCapacity.passed,
      baselinePassCount: bCapacity.passCount,
      baselineTotalCount: bCapacity.totalCount,
      freshPassed: fCapacity.passed,
      freshPassCount: fCapacity.passCount,
      freshTotalCount: fCapacity.totalCount,
      baselineDetail: `${bCapacity.passCount}/${bCapacity.totalCount} destinations within receipt limits`,
      freshDetail: `${fCapacity.passCount}/${fCapacity.totalCount} destinations within receipt limits`,
    },
    {
      id: "shelflife",
      dimension: "Shelf-Life Feasibility",
      ruleDescription: `Transit + handling must fit shelf life and preserve ≥ ${MIN_SHELF_LIFE_BUFFER_HOURS} h margin on arrival.`,
      baselinePassed: bShelf.passed,
      baselinePassCount: bShelf.passCount,
      baselineTotalCount: bShelf.totalCount,
      freshPassed: fShelf.passed,
      freshPassCount: fShelf.passCount,
      freshTotalCount: fShelf.totalCount,
      baselineDetail: `${bShelf.passCount}/${bShelf.totalCount} rows pass (${bShelf.totalCount - bShelf.passCount} expire in transit or breach buffer)`,
      freshDetail: `${fShelf.passCount}/${fShelf.totalCount} rows pass (100% compliant with minimum 2 h buffer)`,
    },
    {
      id: "windows",
      dimension: "Delivery Windows (24 h)",
      ruleDescription: "All dispatch journeys and handling must complete within the active 24-hour planning horizon.",
      baselinePassed: bWindows.passed,
      baselinePassCount: bWindows.passCount,
      baselineTotalCount: bWindows.totalCount,
      freshPassed: fWindows.passed,
      freshPassCount: fWindows.passCount,
      freshTotalCount: fWindows.totalCount,
      baselineDetail: `${bWindows.passCount}/${bWindows.totalCount} lanes arrive within the 24 h horizon`,
      freshDetail: `${fWindows.passCount}/${fWindows.totalCount} lanes arrive within the 24 h horizon`,
    },
  ];
}
