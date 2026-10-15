import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { NetworkMap } from "@/components/freshroute/NetworkMap";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import type { PlanRun } from "@/components/freshroute/PlanContext";
import {
  routeStats,
  warehouseStats,
  type DestinationStats,
  type RouteStats,
} from "@/lib/distribution-network";
import {
  formatHours,
  type AllocationRow,
} from "@/lib/distribution-planner";
import { WAREHOUSES } from "@/lib/inventory-batches";

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

const LEGEND_SWATCHES = {
  warehouse: "#34d399",
  destination: "#22d3ee",
  route: "#2563eb",
  delay: "#fbbf24",
  infeasible: "#f87171",
};

function LegendItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-xs text-muted-foreground">{children}</li>
  );
}

export function DistributionMap({
  run,
  stats,
  selectedDestinationId,
  selectedRouteKey,
  onSelectDestination,
  onSelectRoute,
  onClear,
  onOpenAllocation,
}: {
  run: PlanRun;
  stats: DestinationStats[];
  selectedDestinationId: string | null;
  selectedRouteKey: string | null;
  onSelectDestination: (id: string) => void;
  onSelectRoute: (route: RouteStats) => void;
  onClear: () => void;
  onOpenAllocation: (row: AllocationRow) => void;
}) {
  const [open, setOpen] = useState(true);
  const [fitSignal, setFitSignal] = useState(0);

  const plan = run.status === "ready" ? run.plan : null;
  const routes = useMemo(
    () => routeStats(plan, stats.map((stat) => stat.destination)),
    [plan, stats],
  );
  const warehouses = useMemo(() => warehouseStats(), []);
  const routeDelayHours = plan?.routeDelayHours ?? 0;

  const selectedRoute = routes.find((route) => route.key === selectedRouteKey) ?? null;
  const selectedDestination =
    stats.find((stat) => stat.destination.id === selectedDestinationId) ?? null;
  const hasSelection = selectedDestinationId !== null || selectedRouteKey !== null;

  const unlocatedCount =
    WAREHOUSES.filter((warehouse) => !warehouse.location).length +
    stats.filter((stat) => !stat.destination.location).length;

  const statusMessage =
    run.status === "running"
      ? null
      : run.status === "error"
        ? "Allocation links are unavailable because the plan failed. Markers still show the dataset locations."
        : "No plan has run yet. Run a plan from the topbar to draw allocation links. Markers show the dataset locations.";

  return (
    <SectionCard
      title="Distribution Map"
      description="Warehouse-to-destination allocation overview"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to="/scenarios"
            className="rounded-md px-2.5 py-1 text-xs font-medium text-info transition-colors hover:bg-info/10"
          >
            Test a disruption
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="distribution-map-body"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            {open ? "Collapse" : "Expand"}
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      }
    >
      {open && (
        <div id="distribution-map-body" className="flex flex-col gap-4">
          {run.status === "running" && (
            <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              Drawing allocation links once the plan finishes…
            </div>
          )}
          {statusMessage && (
            <div
              role={run.status === "error" ? "alert" : undefined}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              {run.status === "error" && (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              )}
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {hasSelection
                ? "Selections filter the Allocation Table and highlight matching rows."
                : "Click a connection or destination to filter the Allocation Table."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFitSignal((value) => value + 1)}
                className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                Fit All Locations
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={!hasSelection}
                className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-transparent disabled:hover:text-foreground"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <NetworkMap
            warehouses={warehouses}
            destinations={stats}
            routes={routes}
            hasPlan={plan !== null}
            routeDelayHours={routeDelayHours}
            selectedDestinationId={selectedDestinationId}
            selectedRouteKey={selectedRouteKey}
            fitSignal={fitSignal}
            onSelectDestination={onSelectDestination}
            onSelectRoute={onSelectRoute}
            onOpenAllocation={onOpenAllocation}
          />

          <p className="text-xs text-muted-foreground">
            Connections show allocation links, not road routes. Travel times come from the planning dataset.
          </p>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <LegendItem>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEGEND_SWATCHES.warehouse }} />
              Warehouse
            </LegendItem>
            <LegendItem>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEGEND_SWATCHES.destination }} />
              Destination
            </LegendItem>
            <LegendItem>
              <span className="h-1 w-8 rounded-full" style={{ background: LEGEND_SWATCHES.route }} />
              Allocation link (thicker = more kg)
            </LegendItem>
            <LegendItem>
              <span className="h-1 w-8 rounded-full" style={{ background: LEGEND_SWATCHES.delay }} />
              Scenario-delayed link
            </LegendItem>
            <LegendItem>
              <span className="h-1 w-8 rounded-full" style={{ background: LEGEND_SWATCHES.infeasible }} />
              Infeasible link
            </LegendItem>
          </ul>

          {unlocatedCount > 0 && (
            <p className="text-xs text-warning">
              {unlocatedCount} location{unlocatedCount === 1 ? " has" : "s have"} no coordinates and{" "}
              {unlocatedCount === 1 ? "is" : "are"} not drawn on the map.
            </p>
          )}

          {selectedRoute ? (
            <RouteDetails
              route={selectedRoute}
              routeDelayHours={routeDelayHours}
              onOpenAllocation={onOpenAllocation}
            />
          ) : selectedDestination ? (
            <p className="text-sm text-muted-foreground">
              Showing allocations for {selectedDestination.destination.name}
              {plan ? ` (${selectedDestination.rows.length} rows)` : ""}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No connection selected.</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function RouteDetails({
  route,
  routeDelayHours,
  onOpenAllocation,
}: {
  route: RouteStats;
  routeDelayHours: number;
  onOpenAllocation: (row: AllocationRow) => void;
}) {
  const travelHours = route.destination.travelHours + routeDelayHours;

  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold text-foreground">
        {route.warehouse.name} → {route.destination.name}
      </h3>
      {route.infeasible && (
        <div className="mt-2">
          <StatusBadge tone="danger">Constraint violation on this connection</StatusBadge>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Source</dt>
          <dd className="font-medium text-foreground">{route.warehouse.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Destination</dt>
          <dd className="font-medium text-foreground">{route.destination.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Quantity</dt>
          <dd className="font-medium tabular-nums text-foreground">{kg(route.allocatedKg)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Travel time</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatHours(travelHours)}
            {routeDelayHours > 0 && (
              <span className="ml-1 text-xs text-warning">incl. {formatHours(routeDelayHours)} delay</span>
            )}
          </dd>
        </div>
      </dl>

      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Affected batches
      </h4>
      <ul className="mt-2 flex flex-col divide-y divide-white/[0.05]">
        {route.rows.map((row) => {
          const passed = row.checks.every((check) => check.passed);
          return (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
              <span className="font-mono text-xs text-foreground">
                {row.batchId} · {row.commodity}
              </span>
              <span className="flex items-center gap-3 tabular-nums text-muted-foreground">
                {kg(row.allocatedKg)}
                <StatusBadge tone={passed ? "success" : "danger"} className="px-2 py-0.5 text-[11px]">
                  {passed ? "Pass" : "Fail"}
                </StatusBadge>
                <button
                  type="button"
                  onClick={() => onOpenAllocation(row)}
                  className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  Why this allocation?
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">Simulated result from the shared dataset.</p>
    </section>
  );
}
