import {
  DESTINATIONS,
  type PlanDataset,
} from "@/lib/distribution-planner";
import { INVENTORY_BATCHES } from "@/lib/inventory-batches";

export const CONSERVATIVE_SHELF_LIFE_REDUCTION_HOURS = 3;

export const SCENARIO_LIMITS = {
  delayHours: { min: 0, max: 8 },
  demandChangePct: { min: -30, max: 50 },
  capacityReductionPct: { min: 0, max: 30 },
} as const;

export interface ScenarioParams {
  delayDestinationId: string;
  extraDelayHours: number;
  demandDestinationId: string;
  demandCommodity: string;
  demandChangePct: number;
  capacityReductionPct: number;
  conservativeShelfLife: boolean;
}

export const COMMODITIES = Array.from(
  new Set(INVENTORY_BATCHES.map((batch) => batch.commodity)),
);

export const DEFAULT_SCENARIO: ScenarioParams = {
  delayDestinationId: DESTINATIONS[0].id,
  extraDelayHours: 0,
  demandDestinationId: DESTINATIONS[0].id,
  demandCommodity: COMMODITIES[0],
  demandChangePct: 0,
  capacityReductionPct: 0,
  conservativeShelfLife: false,
};

const destinationNameFor = (id: string) =>
  DESTINATIONS.find((destination) => destination.id === id)?.name ?? id;

// Demand is modelled per destination. A commodity's share of it is assumed to
// follow that commodity's share of total supply.
const commodityDemandShare = (commodity: string) => {
  const total = INVENTORY_BATCHES.reduce((sum, batch) => sum + batch.quantityKg, 0);
  const supply = INVENTORY_BATCHES.filter(
    (batch) => batch.commodity === commodity,
  ).reduce((sum, batch) => sum + batch.quantityKg, 0);
  return total === 0 ? 0 : supply / total;
};

export function buildScenarioDataset(params: ScenarioParams): PlanDataset {
  const demandShare = commodityDemandShare(params.demandCommodity);
  const capacityFactor = 1 - params.capacityReductionPct / 100;

  return {
    batches: INVENTORY_BATCHES.map((batch) => ({
      ...batch,
      remainingHours: params.conservativeShelfLife
        ? Math.max(
            0,
            batch.remainingHours - CONSERVATIVE_SHELF_LIFE_REDUCTION_HOURS,
          )
        : batch.remainingHours,
    })),
    destinations: DESTINATIONS.map((destination) => ({
      ...destination,
      travelHours:
        destination.id === params.delayDestinationId
          ? destination.travelHours + params.extraDelayHours
          : destination.travelHours,
      demandKg:
        destination.id === params.demandDestinationId
          ? Math.max(
              0,
              Math.round(
                destination.demandKg *
                  (1 + (demandShare * params.demandChangePct) / 100),
              ),
            )
          : destination.demandKg,
      capacityKg: Math.round(destination.capacityKg * capacityFactor),
    })),
  };
}

export function activeScenarioChanges(params: ScenarioParams): string[] {
  const changes: string[] = [];
  if (params.extraDelayHours > 0) {
    changes.push(
      `+${params.extraDelayHours} h delay at ${destinationNameFor(params.delayDestinationId)}`,
    );
  }
  if (params.demandChangePct !== 0) {
    changes.push(
      `${params.demandChangePct > 0 ? "+" : "−"}${Math.abs(params.demandChangePct)}% ${params.demandCommodity} demand at ${destinationNameFor(params.demandDestinationId)}`,
    );
  }
  if (params.capacityReductionPct > 0) {
    changes.push(`−${params.capacityReductionPct}% destination capacity`);
  }
  if (params.conservativeShelfLife) {
    changes.push(`−${CONSERVATIVE_SHELF_LIFE_REDUCTION_HOURS} h shelf life on all batches`);
  }
  return changes;
}
