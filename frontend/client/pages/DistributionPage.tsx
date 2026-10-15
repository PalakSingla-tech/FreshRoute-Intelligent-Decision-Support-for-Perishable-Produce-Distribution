import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AllocationTable } from "@/components/freshroute/AllocationTable";
import { DestinationConstraintsTable } from "@/components/freshroute/DestinationConstraintsTable";
import { DistributionMap } from "@/components/freshroute/DistributionMap";
import { PrimaryButton } from "@/components/freshroute/PrimaryButton";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { SummaryTile } from "@/components/freshroute/SummaryTile";
import { usePlan } from "@/components/freshroute/PlanContext";
import { destinationStats, type RouteStats } from "@/lib/distribution-network";
import {
  DESTINATIONS,
  MIN_SHELF_LIFE_BUFFER_HOURS,
} from "@/lib/distribution-planner";
import { PLAN_LABELS } from "@/lib/plan-metrics";

interface Selection {
  destinationId: string | null;
  routeKey: string | null;
}

const NO_SELECTION: Selection = { destinationId: null, routeKey: null };

export default function DistributionPage() {
  const { mode, runs, runPlan, planDataset } = usePlan();
  const run = runs[mode];
  const label = PLAN_LABELS[mode];
  const summary = run.status === "ready" ? run.plan.summary : null;
  const dash = "—";

  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const destinations = planDataset?.destinations ?? DESTINATIONS;
  const selectedDestinationId = selection.destinationId;
  const selectedDestination =
    destinations.find((destination) => destination.id === selectedDestinationId) ?? null;

  const toggleDestination = useCallback((id: string) => {
    setSelection((current) =>
      current.destinationId === id
        ? NO_SELECTION
        : { destinationId: id, routeKey: null },
    );
  }, []);
  const toggleRoute = useCallback((route: RouteStats) => {
    setSelection((current) =>
      current.routeKey === route.key
        ? NO_SELECTION
        : { destinationId: route.destination.id, routeKey: route.key },
    );
  }, []);
  const clearSelection = useCallback(() => setSelection(NO_SELECTION), []);

  const plan = run.status === "ready" ? run.plan : null;
  const stats = useMemo(() => destinationStats(plan, destinations), [plan, destinations]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Distribution Plan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Allocate perishable stock within demand, capacity, and shelf-life
            constraints.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={mode === "fresh" ? "success" : "neutral"}>
            {label}
          </StatusBadge>
          <StatusBadge tone="info">Simulation dataset</StatusBadge>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryTile
          label="Allocated quantity"
          value={summary ? `${summary.allocatedKg.toLocaleString("en-IN")} kg` : dash}
        />
        <SummaryTile
          label="Unallocated quantity"
          value={summary ? `${summary.unallocatedKg.toLocaleString("en-IN")} kg` : dash}
        />
        <SummaryTile
          label="Demand fulfilled"
          value={summary ? `${summary.demandFulfilledPct}%` : dash}
        />
        <SummaryTile
          label="Constraint violations"
          value={summary ? String(summary.constraintViolations) : dash}
          tone={summary && summary.constraintViolations > 0 ? "danger" : undefined}
        />
      </div>

      <SectionCard
        title="Allocation Table"
        description={`Simulated ${label} · ${MIN_SHELF_LIFE_BUFFER_HOURS} h minimum shelf-life buffer`}
      >
        {run.status === "idle" && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              No {label} has run yet. Run it to allocate batches to
              destinations within shelf-life and capacity limits.
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
          <div className="flex flex-col gap-3">
            <AllocationTable
              rows={run.plan.allocations}
              destination={selectedDestination}
              onClearDestination={clearSelection}
              highlightedRouteKey={selection.routeKey}
              openRowId={openRowId}
              onOpenRow={setOpenRowId}
            />
            <p className="text-xs text-muted-foreground">
              All figures are simulated mock results, not live operational data.
            </p>
          </div>
        )}
      </SectionCard>

      <DistributionMap
        run={run}
        stats={stats}
        selectedDestinationId={selectedDestinationId}
        selectedRouteKey={selection.routeKey}
        onSelectDestination={toggleDestination}
        onSelectRoute={toggleRoute}
        onClear={clearSelection}
        onOpenAllocation={(row) => setOpenRowId(row.id)}
      />

      <SectionCard
        title="Destination Constraints"
        description="Capacity is the maximum kg each destination can take in one plan run, from the shared dataset. Demand is each destination's total kg and is not split by commodity."
      >
        <DestinationConstraintsTable
          stats={stats}
          hasPlan={plan !== null}
          routeDelayHours={plan?.routeDelayHours ?? 0}
          selectedId={selectedDestinationId}
          onSelect={toggleDestination}
        />
      </SectionCard>
    </div>
  );
}
