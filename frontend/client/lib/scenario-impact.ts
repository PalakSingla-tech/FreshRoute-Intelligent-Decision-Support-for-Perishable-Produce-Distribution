import {
  MIN_SHELF_LIFE_BUFFER_HOURS,
  formatHours,
  type AllocationPlan,
  type PlanDataset,
} from "@/lib/distribution-planner";
import { formatInr, type PlanSnapshot } from "@/lib/plan-metrics";

export interface PlanRunView {
  plan: AllocationPlan;
  dataset: PlanDataset;
}

export interface Split {
  destinationId: string;
  destinationName: string;
  kg: number;
}

export interface BatchAllocationChange {
  batchId: string;
  commodity: string;
  previous: Split[];
  next: Split[];
  previousKg: number;
  nextKg: number;
  reason: string;
}

export interface DisruptionLine {
  text: string;
  outcome: "better" | "worse" | "unchanged";
}

const splitsFor = (plan: AllocationPlan, batchId: string): Split[] =>
  plan.allocations
    .filter((row) => row.batchId === batchId)
    .map((row) => ({
      destinationId: row.destinationId,
      destinationName: row.destinationName,
      kg: row.allocatedKg,
    }));

const sumKg = (splits: Split[]) => splits.reduce((sum, split) => sum + split.kg, 0);

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function reasonFor(
  batchId: string,
  previous: Split[],
  next: Split[],
  before: PlanRunView,
  after: PlanRunView,
): string {
  const reasons = new Set<string>();
  const batch = after.dataset.batches.find((item) => item.id === batchId);
  const nextByDestination = new Map(next.map((split) => [split.destinationId, split.kg]));

  for (const split of previous) {
    if ((nextByDestination.get(split.destinationId) ?? 0) >= split.kg) continue;
    const destination = after.dataset.destinations.find(
      (item) => item.id === split.destinationId,
    );
    const earlier = before.dataset.destinations.find(
      (item) => item.id === split.destinationId,
    );
    if (!destination || !earlier || !batch) continue;

    const arrivalHours =
      batch.remainingHours -
      (destination.travelHours + after.plan.routeDelayHours + destination.handlingHours);
    if (arrivalHours < MIN_SHELF_LIFE_BUFFER_HOURS) {
      reasons.add(
        `${destination.name} arrival shelf life falls to ${formatHours(arrivalHours)}, below the ${MIN_SHELF_LIFE_BUFFER_HOURS} h buffer`,
      );
    } else if (destination.travelHours > earlier.travelHours) {
      reasons.add(`travel time to ${destination.name} increased`);
    } else if (
      destination.capacityKg < earlier.capacityKg ||
      destination.demandKg < earlier.demandKg
    ) {
      reasons.add(`capacity or demand at ${destination.name} was reduced`);
    } else {
      reasons.add(`replanning changed the spare room at ${destination.name}`);
    }
  }

  for (const split of next) {
    if (!previous.some((item) => item.destinationId === split.destinationId)) {
      reasons.add(`newly assigned to ${split.destinationName} after replanning`);
    }
  }

  if (reasons.size === 0) {
    reasons.add("allocation shifted after replanning");
  }
  return capitalise([...reasons].join("; "));
}

export function batchAllocationChanges(
  before: PlanRunView,
  after: PlanRunView,
): BatchAllocationChange[] {
  const changes: BatchAllocationChange[] = [];
  for (const batch of after.dataset.batches) {
    const previous = splitsFor(before.plan, batch.id);
    const next = splitsFor(after.plan, batch.id);
    const previousByDestination = new Map(
      previous.map((split) => [split.destinationId, split.kg]),
    );
    const nextByDestination = new Map(next.map((split) => [split.destinationId, split.kg]));
    const unchanged =
      previousByDestination.size === nextByDestination.size &&
      [...previousByDestination].every(
        ([id, kg]) => nextByDestination.get(id) === kg,
      );
    if (unchanged) continue;

    changes.push({
      batchId: batch.id,
      commodity: batch.commodity,
      previous,
      next,
      previousKg: sumKg(previous),
      nextKg: sumKg(next),
      reason: reasonFor(batch.id, previous, next, before, after),
    });
  }
  return changes;
}

const signedChange = (delta: number, format: (value: number) => string) =>
  `${delta > 0 ? "rises" : "falls"} by ${format(Math.abs(delta))}`;

export function describeDisruption(
  before: PlanSnapshot,
  after: PlanSnapshot,
  changes: BatchAllocationChange[],
): DisruptionLine[] {
  const lines: DisruptionLine[] = [];

  const spoilage = after.spoilageKg - before.spoilageKg;
  lines.push({
    text:
      spoilage === 0
        ? `Estimated spoilage is unchanged at ${before.spoilageKg.toLocaleString("en-IN")} kg.`
        : `Estimated spoilage ${signedChange(spoilage, (value) => `${value.toLocaleString("en-IN")} kg`)}, from ${before.spoilageKg.toLocaleString("en-IN")} kg to ${after.spoilageKg.toLocaleString("en-IN")} kg.`,
    outcome: spoilage === 0 ? "unchanged" : spoilage < 0 ? "better" : "worse",
  });

  const demand = after.demandFulfilled - before.demandFulfilled;
  lines.push({
    text:
      demand === 0
        ? `Demand fulfilled is unchanged at ${before.demandFulfilled}%.`
        : `Demand fulfilled ${signedChange(demand, (value) => `${value} percentage points`)}, from ${before.demandFulfilled}% to ${after.demandFulfilled}%.`,
    outcome: demand === 0 ? "unchanged" : demand > 0 ? "better" : "worse",
  });

  const revenue = after.netRevenue - before.netRevenue;
  lines.push({
    text:
      revenue === 0
        ? `Net revenue is unchanged at ${formatInr(before.netRevenue)}.`
        : `Net revenue ${signedChange(revenue, formatInr)}, from ${formatInr(before.netRevenue)} to ${formatInr(after.netRevenue)}.`,
    outcome: revenue === 0 ? "unchanged" : revenue > 0 ? "better" : "worse",
  });

  const unallocated = after.unallocatedKg - before.unallocatedKg;
  lines.push({
    text:
      unallocated === 0
        ? `Unallocated stock is unchanged at ${before.unallocatedKg.toLocaleString("en-IN")} kg.`
        : `Unallocated stock ${signedChange(unallocated, (value) => `${value.toLocaleString("en-IN")} kg`)}, from ${before.unallocatedKg.toLocaleString("en-IN")} kg to ${after.unallocatedKg.toLocaleString("en-IN")} kg.`,
    outcome: unallocated === 0 ? "unchanged" : unallocated < 0 ? "better" : "worse",
  });

  const violations = after.constraintViolations - before.constraintViolations;
  lines.push({
    text:
      violations === 0
        ? `Constraint violations are unchanged at ${before.constraintViolations}.`
        : `Constraint violations go from ${before.constraintViolations} to ${after.constraintViolations}.`,
    outcome: violations === 0 ? "unchanged" : violations < 0 ? "better" : "worse",
  });

  if (changes.length === 0) {
    lines.push({
      text: "No batch changed destination or quantity in this scenario.",
      outcome: "unchanged",
    });
  } else {
    const fullyUnallocated = changes.filter(
      (change) => change.nextKg === 0 && change.previousKg > 0,
    ).length;
    lines.push({
      text: `${changes.length} ${changes.length === 1 ? "batch changed" : "batches changed"} allocation${fullyUnallocated > 0 ? `; ${fullyUnallocated} ${fullyUnallocated === 1 ? "is" : "are"} now fully unallocated` : ""}.`,
      outcome: fullyUnallocated > 0 ? "worse" : "unchanged",
    });
  }

  return lines;
}
