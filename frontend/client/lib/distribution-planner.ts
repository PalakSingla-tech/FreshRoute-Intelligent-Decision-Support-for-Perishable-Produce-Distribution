import {
  INVENTORY_BATCHES,
  riskFor,
  type GeoPoint,
  type InventoryBatch,
  type RiskLevel,
} from "@/lib/inventory-batches";
import type { PlanMode } from "@/lib/plan-metrics";

export const MIN_SHELF_LIFE_BUFFER_HOURS = 2;
const SIMULATED_LATENCY_MS = 700;

export interface Destination {
  id: string;
  name: string;
  demandKg: number;
  capacityKg: number;
  travelHours: number;
  handlingHours: number;
  marketPricePerKg: number;
  transportCostPerKg: number;
  location?: GeoPoint;
}

// Punjab destinations use synthetic demo coordinates, not real businesses.
export const DESTINATIONS: Destination[] = [
  {
    id: "ludhiana-mandi",
    name: "Ludhiana Mandi",
    demandKg: 2400,
    capacityKg: 2000,
    travelHours: 2.5,
    handlingHours: 1,
    marketPricePerKg: 34,
    transportCostPerKg: 3.5,
    location: { lat: 30.901, lng: 75.8573 },
  },
  {
    id: "jalandhar-retail",
    name: "Jalandhar Retail",
    demandKg: 800,
    capacityKg: 900,
    travelHours: 1.5,
    handlingHours: 0.5,
    marketPricePerKg: 30,
    transportCostPerKg: 2.5,
    location: { lat: 31.326, lng: 75.5762 },
  },
  {
    id: "amritsar-wholesale",
    name: "Amritsar Wholesale",
    demandKg: 2000,
    capacityKg: 2200,
    travelHours: 3.5,
    handlingHours: 1,
    marketPricePerKg: 31,
    transportCostPerKg: 3,
    location: { lat: 31.634, lng: 74.8723 },
  },
  {
    id: "patiala-institutional",
    name: "Patiala Institutional Buyers",
    demandKg: 900,
    capacityKg: 900,
    travelHours: 2.5,
    handlingHours: 1,
    marketPricePerKg: 33,
    transportCostPerKg: 3,
    location: { lat: 30.3398, lng: 76.3869 },
  },
  {
    id: "processing-unit",
    name: "Processing Unit",
    demandKg: 300,
    capacityKg: 300,
    travelHours: 1,
    handlingHours: 0.5,
    marketPricePerKg: 20,
    transportCostPerKg: 2,
    location: { lat: 30.7046, lng: 76.7179 },
  },
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    demandKg: 1800,
    capacityKg: 2000,
    travelHours: 9,
    handlingHours: 2,
    marketPricePerKg: 38,
    transportCostPerKg: 5,
    location: { lat: 28.6139, lng: 77.209 },
  },
  {
    id: "kolkata-cold-chain",
    name: "Kolkata Cold Chain",
    demandKg: 1500,
    capacityKg: 1500,
    travelHours: 30,
    handlingHours: 4,
    marketPricePerKg: 36,
    transportCostPerKg: 7.5,
    location: { lat: 22.5726, lng: 88.3639 },
  },
];

export interface PlanDataset {
  batches: InventoryBatch[];
  destinations: Destination[];
}

export const BASE_DATASET: PlanDataset = {
  batches: INVENTORY_BATCHES,
  destinations: DESTINATIONS,
};

export interface ConstraintCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface AllocationRow {
  id: string;
  batchId: string;
  commodity: string;
  emoji: string;
  warehouseId: string;
  destinationId: string;
  destinationName: string;
  allocatedKg: number;
  batchQuantityKg: number;
  shelfLifeAtDispatchHours: number;
  demandLeftKg: number;
  capacityLeftKg: number;
  travelHours: number;
  handlingHours: number;
  travelAndHandlingHours: number;
  arrivalShelfLifeHours: number;
  marketPricePerKg: number;
  discountRate: number;
  appliedPricePerKg: number;
  transportCostInr: number;
  discountCostInr: number;
  netProceedsInr: number;
  priority: RiskLevel;
  decisionReason: string;
  checks: ConstraintCheck[];
}

export interface AllocationSummary {
  totalSupplyKg: number;
  allocatedKg: number;
  unallocatedKg: number;
  totalDemandKg: number;
  demandFulfilledPct: number;
  constraintViolations: number;
}

export interface AllocationPlan {
  mode: PlanMode;
  routeDelayHours: number;
  allocations: AllocationRow[];
  summary: AllocationSummary;
}

interface DestinationState {
  destination: Destination;
  demandLeftKg: number;
  capacityLeftKg: number;
}

export const formatHours = (value: number) => `${Math.round(value * 10) / 10} h`;

export const formatRate = (value: number) => `₹${value.toFixed(2)}/kg`;

const discountRateFor = (arrivalHours: number) => {
  if (arrivalHours < 12) return 0.2;
  if (arrivalHours < 24) return 0.1;
  return 0;
};

const travelHoursFor = (destination: Destination, routeDelayHours: number) =>
  destination.travelHours + routeDelayHours;

const travelAndHandlingFor = (
  destination: Destination,
  routeDelayHours: number,
) => travelHoursFor(destination, routeDelayHours) + destination.handlingHours;

const arrivalHoursFor = (
  batch: InventoryBatch,
  destination: Destination,
  routeDelayHours: number,
) => batch.remainingHours - travelAndHandlingFor(destination, routeDelayHours);

const netPerKgFor = (
  batch: InventoryBatch,
  destination: Destination,
  routeDelayHours: number,
) => {
  const rate = discountRateFor(
    arrivalHoursFor(batch, destination, routeDelayHours),
  );
  return (
    destination.marketPricePerKg * (1 - rate) - destination.transportCostPerKg
  );
};

function orderDestinations(
  mode: PlanMode,
  batch: InventoryBatch,
  states: DestinationState[],
  routeDelayHours: number,
): DestinationState[] {
  if (mode === "baseline") {
    return [...states].sort(
      (a, b) => a.destination.travelHours - b.destination.travelHours,
    );
  }
  return states
    .filter(
      (state) =>
        arrivalHoursFor(batch, state.destination, routeDelayHours) >=
        MIN_SHELF_LIFE_BUFFER_HOURS,
    )
    .sort(
      (a, b) =>
        netPerKgFor(batch, b.destination, routeDelayHours) -
        netPerKgFor(batch, a.destination, routeDelayHours),
    );
}

function buildRow(
  mode: PlanMode,
  batch: InventoryBatch,
  state: DestinationState,
  allocatedKg: number,
  routeDelayHours: number,
): AllocationRow {
  const { destination, demandLeftKg, capacityLeftKg } = state;
  const travelHours = travelHoursFor(destination, routeDelayHours);
  const travelAndHandlingHours = travelAndHandlingFor(
    destination,
    routeDelayHours,
  );
  const arrivalShelfLifeHours = batch.remainingHours - travelAndHandlingHours;
  const discountRate = discountRateFor(arrivalShelfLifeHours);
  const appliedPricePerKg = destination.marketPricePerKg * (1 - discountRate);
  const transportCostInr = Math.round(
    allocatedKg * destination.transportCostPerKg,
  );
  const discountCostInr = Math.round(
    allocatedKg * destination.marketPricePerKg * discountRate,
  );
  const netProceedsInr = Math.round(
    allocatedKg * appliedPricePerKg - transportCostInr,
  );

  const shelfNote =
    travelAndHandlingHours > batch.remainingHours
      ? "travel and handling exceed the remaining shelf life"
      : arrivalShelfLifeHours < MIN_SHELF_LIFE_BUFFER_HOURS
        ? `arrival shelf life falls below the ${MIN_SHELF_LIFE_BUFFER_HOURS} h buffer`
        : `arrival shelf life clears the ${MIN_SHELF_LIFE_BUFFER_HOURS} h buffer`;
  const basis =
    mode === "fresh"
      ? "Ranked by net proceeds per kg among destinations that pass the shelf-life check"
      : "Assigned by nearest-destination order without a shelf-life check";

  return {
    id: `${batch.id}:${destination.id}`,
    batchId: batch.id,
    commodity: batch.commodity,
    emoji: batch.emoji,
    warehouseId: batch.warehouseId,
    destinationId: destination.id,
    destinationName: destination.name,
    allocatedKg,
    batchQuantityKg: batch.quantityKg,
    shelfLifeAtDispatchHours: batch.remainingHours,
    demandLeftKg,
    capacityLeftKg,
    travelHours,
    handlingHours: destination.handlingHours,
    travelAndHandlingHours,
    arrivalShelfLifeHours,
    marketPricePerKg: destination.marketPricePerKg,
    discountRate,
    appliedPricePerKg,
    transportCostInr,
    discountCostInr,
    netProceedsInr,
    priority: riskFor(batch.remainingHours),
    decisionReason: `${basis}; ${shelfNote}.`,
    checks: [
      {
        label: "Shelf-life feasibility",
        passed: travelAndHandlingHours <= batch.remainingHours,
        detail: `${formatHours(travelAndHandlingHours)} travel + handling vs ${formatHours(batch.remainingHours)} remaining`,
      },
      {
        label: "Minimum shelf-life buffer",
        passed: arrivalShelfLifeHours >= MIN_SHELF_LIFE_BUFFER_HOURS,
        detail: `${formatHours(arrivalShelfLifeHours)} on arrival vs ${MIN_SHELF_LIFE_BUFFER_HOURS} h buffer`,
      },
      {
        label: "Destination demand",
        passed: allocatedKg <= demandLeftKg,
        detail: `${allocatedKg} kg allocated vs ${demandLeftKg} kg demand left`,
      },
      {
        label: "Destination capacity",
        passed: allocatedKg <= capacityLeftKg,
        detail: `${allocatedKg} kg allocated vs ${capacityLeftKg} kg capacity left`,
      },
    ],
  };
}

function allocate(
  mode: PlanMode,
  routeDelayHours: number,
  dataset: PlanDataset,
): AllocationRow[] {
  const states: DestinationState[] = dataset.destinations.map((destination) => ({
    destination,
    demandLeftKg: destination.demandKg,
    capacityLeftKg: destination.capacityKg,
  }));
  const batches =
    mode === "fresh"
      ? [...dataset.batches].sort((a, b) => a.remainingHours - b.remainingHours)
      : dataset.batches;

  const rows: AllocationRow[] = [];
  for (const batch of batches) {
    let remainingKg = batch.quantityKg;
    for (const state of orderDestinations(mode, batch, states, routeDelayHours)) {
      const availableKg = Math.min(state.demandLeftKg, state.capacityLeftKg);
      if (remainingKg <= 0 || availableKg <= 0) continue;

      const allocatedKg = Math.min(remainingKg, availableKg);
      rows.push(buildRow(mode, batch, state, allocatedKg, routeDelayHours));
      state.demandLeftKg -= allocatedKg;
      state.capacityLeftKg -= allocatedKg;
      remainingKg -= allocatedKg;
    }
  }
  return rows;
}

function summarise(
  rows: AllocationRow[],
  dataset: PlanDataset,
): AllocationSummary {
  const totalSupplyKg = dataset.batches.reduce(
    (sum, batch) => sum + batch.quantityKg,
    0,
  );
  const totalDemandKg = dataset.destinations.reduce(
    (sum, destination) => sum + destination.demandKg,
    0,
  );
  const allocatedKg = rows.reduce((sum, row) => sum + row.allocatedKg, 0);

  return {
    totalSupplyKg,
    allocatedKg,
    unallocatedKg: totalSupplyKg - allocatedKg,
    totalDemandKg,
    demandFulfilledPct: Math.round((allocatedKg / totalDemandKg) * 100),
    constraintViolations: rows.filter((row) =>
      row.checks.some((check) => !check.passed),
    ).length,
  };
}

export async function runDistributionPlan(
  mode: PlanMode,
  routeDelayHours: number,
  dataset: PlanDataset = BASE_DATASET,
): Promise<AllocationPlan> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

  if (dataset.batches.length === 0) {
    throw new Error("No inventory batches are available to plan.");
  }

  const allocations = allocate(mode, routeDelayHours, dataset);
  return {
    mode,
    routeDelayHours,
    allocations,
    summary: summarise(allocations, dataset),
  };
}
