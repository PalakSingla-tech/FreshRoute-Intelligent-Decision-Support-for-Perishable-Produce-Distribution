import {
  DESTINATIONS,
  type AllocationPlan,
  type AllocationRow,
  type Destination,
} from "@/lib/distribution-planner";
import {
  INVENTORY_BATCHES,
  WAREHOUSES,
  type InventoryBatch,
  type Warehouse,
} from "@/lib/inventory-batches";

export interface DestinationStats {
  destination: Destination;
  allocatedKg: number;
  remainingDemandKg: number;
  capacityUsedPct: number;
  rows: AllocationRow[];
  hasViolation: boolean;
}

export interface RouteStats {
  key: string;
  warehouse: Warehouse;
  destination: Destination;
  allocatedKg: number;
  rows: AllocationRow[];
  infeasible: boolean;
}

export interface WarehouseStats {
  warehouse: Warehouse;
  stockKg: number;
  batches: InventoryBatch[];
}

export const routeKey = (warehouseId: string, destinationId: string) =>
  `${warehouseId}>${destinationId}`;

export function destinationStats(
  plan: AllocationPlan | null,
  destinations: Destination[] = DESTINATIONS,
): DestinationStats[] {
  const targetDestinations = destinations ?? DESTINATIONS;
  return targetDestinations.map((destination) => {
    const rows =
      plan?.allocations.filter((row) => row.destinationId === destination.id) ??
      [];
    const allocatedKg = rows.reduce((sum, row) => sum + row.allocatedKg, 0);

    return {
      destination,
      allocatedKg,
      remainingDemandKg: Math.max(destination.demandKg - allocatedKg, 0),
      capacityUsedPct: Math.round((allocatedKg / destination.capacityKg) * 100),
      rows,
      hasViolation: rows.some((row) => row.checks.some((check) => !check.passed)),
    };
  });
}

export function routeStats(
  plan: AllocationPlan | null,
  destinations: Destination[] = DESTINATIONS,
): RouteStats[] {
  if (!plan) return [];

  const targetDestinations = destinations ?? DESTINATIONS;
  const groups = new Map<string, AllocationRow[]>();
  for (const row of plan.allocations) {
    const key = routeKey(row.warehouseId, row.destinationId);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const routes: RouteStats[] = [];
  for (const [key, rows] of groups) {
    const warehouse = WAREHOUSES.find((item) => item.id === rows[0].warehouseId);
    const destination = targetDestinations.find(
      (item) => item.id === rows[0].destinationId,
    );
    if (!warehouse || !destination) continue;

    routes.push({
      key,
      warehouse,
      destination,
      allocatedKg: rows.reduce((sum, row) => sum + row.allocatedKg, 0),
      rows,
      infeasible: rows.some((row) => row.checks.some((check) => !check.passed)),
    });
  }
  return routes;
}

export function warehouseStats(): WarehouseStats[] {
  return WAREHOUSES.map((warehouse) => {
    const batches = INVENTORY_BATCHES.filter(
      (batch) => batch.warehouseId === warehouse.id,
    );
    return {
      warehouse,
      stockKg: batches.reduce((sum, batch) => sum + batch.quantityKg, 0),
      batches,
    };
  });
}
