import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
  Sliders,
  TrendingDown,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PrimaryButton } from "@/components/freshroute/PrimaryButton";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { usePlan } from "@/components/freshroute/PlanContext";
import { DESTINATIONS } from "@/lib/distribution-planner";
import {
  activeScenarioChanges,
  COMMODITIES,
  CONSERVATIVE_SHELF_LIFE_REDUCTION_HOURS,
  DEFAULT_SCENARIO,
  SCENARIO_LIMITS,
  type ScenarioParams,
} from "@/lib/scenario";

export default function ScenariosPage() {
  const { scenario, applyScenario, resetScenario, runs, planDataset } = usePlan();

  const [form, setForm] = useState<ScenarioParams>(
    scenario ?? DEFAULT_SCENARIO
  );

  const activeChanges = scenario ? activeScenarioChanges(scenario) : [];
  const isRunning =
    runs.baseline.status === "running" || runs.fresh.status === "running";

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyScenario(form);
  };

  const handleReset = () => {
    setForm(DEFAULT_SCENARIO);
    resetScenario();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-info/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-info">
              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
              What-If Stress Testing
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Scenario Simulation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulate highway delays, mandi demand shifts, warehouse intake bottlenecks, and conservative shelf-life degradation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scenario ? (
            <StatusBadge tone="warning">Scenario Active</StatusBadge>
          ) : (
            <StatusBadge tone="success">Base Operating Conditions</StatusBadge>
          )}
        </div>
      </header>

      {/* ACTIVE SCENARIO BANNER */}
      {scenario && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Active Simulation Disruption Applied:
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {activeChanges.map((change, i) => (
                  <span
                    key={i}
                    className="rounded bg-warning/15 px-2 py-0.5 text-xs font-mono font-medium text-warning"
                  >
                    {change}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              View Reports Impact
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <PrimaryButton
              variant="secondary"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Reset
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* SCENARIO PARAMETERS FORM */}
      <form onSubmit={handleApply} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 1. Highway Transit Delay */}
          <SectionCard
            title="1. Highway Transit Disruption"
            description="Inject transit delay on specific highway corridors to simulate fog, road repair, or toll congestion."
          >
            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="delay-destination"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Affected Corridor / Destination
                </label>
                <select
                  id="delay-destination"
                  value={form.delayDestinationId}
                  onChange={(e) =>
                    setForm({ ...form, delayDestinationId: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.travelHours} h base travel)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="delay-hours" className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Additional Route Delay
                  </label>
                  <span className="font-mono font-bold text-foreground">
                    +{form.extraDelayHours} Hours
                  </span>
                </div>
                <input
                  id="delay-hours"
                  type="range"
                  min={SCENARIO_LIMITS.delayHours.min}
                  max={SCENARIO_LIMITS.delayHours.max}
                  step={1}
                  value={form.extraDelayHours}
                  onChange={(e) =>
                    setForm({ ...form, extraDelayHours: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0 h (Normal)</span>
                  <span>4 h (Moderate)</span>
                  <span>8 h (Severe)</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 2. Destination Demand Shift */}
          <SectionCard
            title="2. Mandi Demand Fluctuations"
            description="Simulate sudden market demand surges or drops due to local wholesale arrival variations."
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="demand-destination"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Target Mandi
                  </label>
                  <select
                    id="demand-destination"
                    value={form.demandDestinationId}
                    onChange={(e) =>
                      setForm({ ...form, demandDestinationId: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="demand-commodity"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Commodity
                  </label>
                  <select
                    id="demand-commodity"
                    value={form.demandCommodity}
                    onChange={(e) =>
                      setForm({ ...form, demandCommodity: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="demand-pct" className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Demand Shift Percentage
                  </label>
                  <span className="font-mono font-bold text-foreground">
                    {form.demandChangePct > 0 ? "+" : ""}
                    {form.demandChangePct}%
                  </span>
                </div>
                <input
                  id="demand-pct"
                  type="range"
                  min={SCENARIO_LIMITS.demandChangePct.min}
                  max={SCENARIO_LIMITS.demandChangePct.max}
                  step={5}
                  value={form.demandChangePct}
                  onChange={(e) =>
                    setForm({ ...form, demandChangePct: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>−30% (Slump)</span>
                  <span>0% (Stable)</span>
                  <span>+50% (Surge)</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. Destination Intake Capacity Bottleneck */}
          <SectionCard
            title="3. Destination Capacity Restriction"
            description="Simulate dock congestion, labor shortages, or cold store maintenance reducing receipt capacity."
          >
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="capacity-pct" className="font-semibold uppercase tracking-wider text-muted-foreground">
                    System-wide Capacity Reduction
                  </label>
                  <span className="font-mono font-bold text-foreground">
                    −{form.capacityReductionPct}%
                  </span>
                </div>
                <input
                  id="capacity-pct"
                  type="range"
                  min={SCENARIO_LIMITS.capacityReductionPct.min}
                  max={SCENARIO_LIMITS.capacityReductionPct.max}
                  step={5}
                  value={form.capacityReductionPct}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      capacityReductionPct: Number(e.target.value),
                    })
                  }
                  className="mt-2 w-full accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0% (Full Capacity)</span>
                  <span>15% (Congestion)</span>
                  <span>30% (Severe Choke)</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 4. Biological Shelf-Life Degradation */}
          <SectionCard
            title="4. Conservative Shelf-Life Degradation"
            description="Account for ambient heat waves or interrupted pre-cooling by reducing effective shelf-life margins."
          >
            <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <input
                id="conservative-shelf"
                type="checkbox"
                checked={form.conservativeShelfLife}
                onChange={(e) =>
                  setForm({ ...form, conservativeShelfLife: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-white/20 bg-card text-primary focus:ring-primary"
              />
              <label htmlFor="conservative-shelf" className="text-sm cursor-pointer">
                <span className="font-semibold text-foreground">
                  Apply −{CONSERVATIVE_SHELF_LIFE_REDUCTION_HOURS} h Shelf-Life Safety Buffer
                </span>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Deducts 3 hours of usable life across all inventory batches. Stresses whether FEFO prioritizations still clear destination transit buffers under adverse conditions.
                </p>
              </label>
            </div>
          </SectionCard>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <PrimaryButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isRunning}
          >
            Reset to Default
          </PrimaryButton>
          <PrimaryButton type="submit" disabled={isRunning}>
            {isRunning ? "Simulating Scenario…" : "Apply Simulation Scenario"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
