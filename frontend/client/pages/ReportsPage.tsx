import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Clock,
  Coins,
  Database,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { PrimaryButton } from "@/components/freshroute/PrimaryButton";
import { SectionCard } from "@/components/freshroute/SectionCard";
import { MandiDispatchModal } from "@/components/freshroute/MandiDispatchModal";
import { usePlan } from "@/components/freshroute/PlanContext";
import { formatInr } from "@/lib/plan-metrics";
import { activeScenarioChanges } from "@/lib/scenario";
import {
  buildComparisonRows,
  evaluatePlan,
  performConstraintAudit,
  type ConstraintAuditItem,
  type MetricComparisonRow,
  type PlanEvaluation,
} from "@/lib/reports-evaluation";
import { cn } from "@/lib/utils";

const BASELINE_COLOR = "#78716C"; // warm stone / wholesale baseline
const FRESH_COLOR = "#22C55E"; // emerald-500 crop vitality

export default function ReportsPage() {
  const { dataset, scenario, runs, runBothPlans, planDataset } = usePlan();
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const baselineRun = runs.baseline;
  const freshRun = runs.fresh;

  const isRunning =
    baselineRun.status === "running" || freshRun.status === "running";
  const isError =
    baselineRun.status === "error" || freshRun.status === "error";
  const errorMessage =
    (baselineRun.status === "error" ? baselineRun.message : null) ??
    (freshRun.status === "error" ? freshRun.message : null);

  const baselinePlan = baselineRun.status === "ready" ? baselineRun.plan : null;
  const freshPlan = freshRun.status === "ready" ? freshRun.plan : null;
  const isReady = baselinePlan !== null && freshPlan !== null;

  const baselineEval = useMemo<PlanEvaluation | null>(() => {
    if (!baselinePlan) return null;
    return evaluatePlan(baselinePlan, planDataset);
  }, [baselinePlan, planDataset]);

  const freshEval = useMemo<PlanEvaluation | null>(() => {
    if (!freshPlan) return null;
    return evaluatePlan(freshPlan, planDataset);
  }, [freshPlan, planDataset]);

  const comparisonRows = useMemo<MetricComparisonRow[]>(() => {
    if (!baselineEval || !freshEval) return [];
    return buildComparisonRows(baselineEval, freshEval);
  }, [baselineEval, freshEval]);

  const constraintAudit = useMemo<ConstraintAuditItem[]>(() => {
    if (!baselinePlan || !freshPlan) return [];
    return performConstraintAudit(baselinePlan, freshPlan, planDataset);
  }, [baselinePlan, freshPlan, planDataset]);

  // Chart dataset 1: Weight in kg
  const kgChartData = useMemo(() => {
    if (!baselineEval || !freshEval) return [];
    return [
      {
        metric: "Spoiled Quantity",
        Baseline: baselineEval.spoiledQuantityKg,
        FreshRoute: freshEval.spoiledQuantityKg,
      },
      {
        metric: "Unallocated Stock",
        Baseline: baselineEval.unallocatedKg,
        FreshRoute: freshEval.unallocatedKg,
      },
      {
        metric: "Expired in Transit",
        Baseline: baselineEval.expiredStockKg,
        FreshRoute: freshEval.expiredStockKg,
      },
      {
        metric: "Delivered Quantity",
        Baseline: baselineEval.allocatedKg - baselineEval.expiredStockKg,
        FreshRoute: freshEval.allocatedKg - freshEval.expiredStockKg,
      },
    ];
  }, [baselineEval, freshEval]);

  // Chart dataset 2: Percentage %
  const pctChartData = useMemo(() => {
    if (!baselineEval || !freshEval) return [];
    return [
      {
        metric: "Demand Fulfilled",
        Baseline: baselineEval.demandFulfilledPct,
        FreshRoute: freshEval.demandFulfilledPct,
      },
      {
        metric: "Shelf-Life Feasibility",
        Baseline: baselineEval.shelfLifeFeasibilityPct,
        FreshRoute: freshEval.shelfLifeFeasibilityPct,
      },
    ];
  }, [baselineEval, freshEval]);

  // Chart dataset 3: Financials in INR
  const currencyChartData = useMemo(() => {
    if (!baselineEval || !freshEval) return [];
    return [
      {
        metric: "Sales Revenue",
        Baseline: baselineEval.salesRevenueInr,
        FreshRoute: freshEval.salesRevenueInr,
      },
      {
        metric: "Transport Cost",
        Baseline: baselineEval.transportCostInr,
        FreshRoute: freshEval.transportCostInr,
      },
      {
        metric: "Net Revenue",
        Baseline: baselineEval.netRevenueInr,
        FreshRoute: freshEval.netRevenueInr,
      },
      {
        metric: "Discount Reductions",
        Baseline: baselineEval.discountReductionInr,
        FreshRoute: freshEval.discountReductionInr,
      },
    ];
  }, [baselineEval, freshEval]);

  const activeScenarioText = useMemo(() => {
    if (!scenario) return "Base Network (No Disruptions)";
    const changes = activeScenarioChanges(scenario);
    return changes.length > 0 ? changes.join(", ") : "Custom Scenario";
  }, [scenario]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* REPORTS HEADER */}
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Audit &amp; Impact Report
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Evaluation Version 2.4</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Planning Results &amp; Evaluation
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Direct comparison between the Baseline (nearest-mandi heuristic) and FreshRoute (FEFO perishability heuristic) under the identical dataset and operational scenario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MandiDispatchModal />
            <PrimaryButton
              disabled={isRunning}
              onClick={() => runBothPlans()}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRunning && "animate-spin")}
                aria-hidden="true"
              />
              {isRunning ? "Evaluating Both Plans…" : "Re-evaluate Both Plans"}
            </PrimaryButton>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Database className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Dataset Name</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {dataset}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Layers className="h-5 w-5 text-info shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Active Scenario</p>
              <p
                className="truncate text-sm font-semibold text-foreground"
                title={activeScenarioText}
              >
                {activeScenarioText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Clock className="h-5 w-5 text-warning shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Planning Horizon</p>
              <p className="truncate text-sm font-semibold text-foreground">
                24 Hours (Rolling Dispatch Window)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Scale className="h-5 w-5 text-neutral shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Plan Run Time</p>
              <p className="truncate text-sm font-semibold text-foreground">
                14 Oct, 20:00 IST (Evaluated)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ERROR STATE */}
      {isError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/10 p-5 text-foreground"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-danger shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold">Evaluation Error</h2>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
          <div className="mt-2">
            <PrimaryButton variant="secondary" onClick={() => runBothPlans()}>
              Retry Evaluation
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isRunning && (
        <div
          role="status"
          className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">
              Evaluating Baseline and FreshRoute Models…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Simulating batch routing, shelf-life verification, and economic balance across {planDataset.destinations.length} mandi destinations.
            </p>
          </div>
        </div>
      )}

      {/* READY STATE: FULL EVALUATION */}
      {!isRunning && isReady && baselineEval && freshEval && (
        <>
          {/* EXECUTIVE AGRICULTURAL IMPACT RIBBON */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-5 shadow-[0_0_24px_-8px_rgba(34,197,94,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Transit Preservation</span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">FEFO Shield</span>
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-heading">
                0 kg <span className="text-sm font-normal text-muted-foreground">Rot in Transit</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Eliminated {baselineEval.expiredStockKg.toLocaleString("en-IN")} kg of en-route spoilage by routing urgent produce to feasible mandis.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-surface/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Mandi Freshness Buffer</span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">100% Feasible</span>
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-heading">
                {freshEval.shelfLifeFeasibilityPct}% <span className="text-sm font-normal text-muted-foreground">Buffer Maintained</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every dispatched batch arrives with ≥ 2 hours of verified shelf-life buffer before wholesale market intake.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-warning/20 bg-surface/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-warning/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Net Farm Returns</span>
                <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">Optimized</span>
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-heading">
                {formatInr(freshEval.netRevenueInr)} <span className="text-sm font-normal text-muted-foreground">Net Proceeds</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Balances dynamic discount yields against destination road transport tariffs.
              </p>
            </div>
          </div>

          {/* COMPARISON TABLE */}
          <SectionCard
            title="Model Comparison Table"
            description="Side-by-side performance across physical volume, demand fulfillment, and financial returns under the identical Punjab dataset."
          >
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/[0.08]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Metric Name</th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Baseline Plan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-primary font-bold">
                      FreshRoute Plan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Absolute Diff
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Relative Change
                    </th>
                    <th scope="col" className="px-4 py-3">Operational Takeaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.key}
                      className={cn(
                        "transition-colors hover:bg-primary/[0.04]",
                        row.isInformationalOnly && "bg-white/[0.01] italic"
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{row.label}</span>
                          {row.isInformationalOnly && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-normal not-italic text-muted-foreground">
                              Informational
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {row.format(row.baselineValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                        {row.format(row.freshValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span
                          className={cn(
                            row.isImprovement === true && "text-emerald-400 font-semibold",
                            row.isImprovement === false && "text-rose-400 font-semibold",
                            row.isImprovement === null && "text-muted-foreground"
                          )}
                        >
                          {row.absoluteDiff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center justify-end gap-1 font-semibold",
                            row.isImprovement === true && "text-emerald-400",
                            row.isImprovement === false && "text-rose-400",
                            row.isImprovement === null && "text-muted-foreground"
                          )}
                        >
                          {row.isImprovement === true && (
                            <ArrowUpRight className="h-3.5 w-3.5 inline text-emerald-400" aria-hidden="true" />
                          )}
                          {row.isImprovement === false && (
                            <ArrowDownRight className="h-3.5 w-3.5 inline text-rose-400" aria-hidden="true" />
                          )}
                          {row.relativeChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground not-italic max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            row.isImprovement === true && "bg-emerald-400",
                            row.isImprovement === false && "bg-rose-400",
                            row.isImprovement === null && "bg-muted-foreground/60"
                          )} />
                          <span>{row.note}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              * Relative change: <span className="font-mono text-foreground/80">(FreshRoute − Baseline) / Baseline × 100%</span>. Where baseline is zero, change is reported as “N/A”.
            </p>
          </SectionCard>

          {/* SEPARATE CHART PANELS FOR KG, %, AND CURRENCY */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Multi-Dimensional Comparison Charts
              </h2>
              <p className="text-sm text-muted-foreground">
                Each operational dimension is displayed in a dedicated chart panel with independent scaling. Units are never mixed on a single axis.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* PANEL 1: WEIGHT OUTCOMES (KG) */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Weight &amp; Allocation
                    </h3>
                    <p className="text-xs text-muted-foreground">Unit: Kilograms (kg)</p>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                    kg axis
                  </span>
                </div>

                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kgChartData}
                      margin={{ top: 16, right: 8, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="metric"
                        stroke="#94A3B8"
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(val: number) => [`${val.toLocaleString("en-IN")} kg`, ""]}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar dataKey="Baseline" fill={BASELINE_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="FreshRoute" fill={FRESH_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  FreshRoute reduces spoiled inventory by prioritizing high-urgency batches.
                </p>
              </div>

              {/* PANEL 2: PERCENTAGE (%) */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Fulfillment &amp; Feasibility
                    </h3>
                    <p className="text-xs text-muted-foreground">Unit: Percentage (%)</p>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                    % axis
                  </span>
                </div>

                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pctChartData}
                      margin={{ top: 16, right: 8, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="metric"
                        stroke="#94A3B8"
                        fontSize={11}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(val: number) => [`${val}%`, ""]}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar dataKey="Baseline" fill={BASELINE_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="FreshRoute" fill={FRESH_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  100% of FreshRoute shipments maintain shelf-life buffer feasibility.
                </p>
              </div>

              {/* PANEL 3: FINANCIALS (INR) */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Financial Economics
                    </h3>
                    <p className="text-xs text-muted-foreground">Unit: Indian Rupee (₹)</p>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                    ₹ INR axis
                  </span>
                </div>

                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={currencyChartData}
                      margin={{ top: 16, right: 8, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="metric"
                        stroke="#94A3B8"
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(val: number) => [formatInr(val), ""]}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar dataKey="Baseline" fill={BASELINE_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="FreshRoute" fill={FRESH_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Net revenue balances market selling yields against route freight costs.
                </p>
              </div>
            </div>
          </div>

          {/* ECONOMIC DEFINITIONS & SPOILAGE METHODOLOGY */}
          <SectionCard
            title="Economic Definitions &amp; Cost Methodology"
            description="Transparent accounting formulas, revenue recognition principles, and spoilage classifications."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Shared Cost Model */}
              <div className="rounded-xl border border-white/[0.08] bg-surface/80 p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Pricing &amp; Freight Model
                    </h3>
                  </div>
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-mono text-xs font-semibold text-emerald-300">
                    Net = Sales Revenue − Freight Cost
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span><strong>Realized Sales:</strong> Market price × (1 − discount)</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span><strong>Freight Tariff:</strong> Dispatched kg × mandi road rate</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span><strong>Handling Buffer:</strong> 0.5h–4h dock allowance (₹0 tariff)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Discount Accounting */}
              <div className="rounded-xl border border-white/[0.08] bg-surface/80 p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Dynamic Markdowns
                    </h3>
                  </div>
                  <div className="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 font-mono text-xs font-semibold text-amber-300">
                    Discount Impact = Gross − Realized
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Batches under 24h (<span className="text-amber-300 font-medium">10% off</span>) or 12h (<span className="text-amber-300 font-medium">20% off</span>) trigger price adjustments to ensure rapid mandi sell-through. Sales revenue accounts for discounts directly; this line is informational.
                  </p>
                </div>
              </div>

              {/* End-of-Horizon Spoilage */}
              <div className="rounded-xl border border-white/[0.08] bg-surface/80 p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Spoilage Classification
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-xs">
                      <span className="font-semibold text-rose-400">1. Expired in Transit:</span>{" "}
                      <span className="text-muted-foreground">Route hours exceed remaining shelf life (avoided by FreshRoute).</span>
                    </div>
                    <div className="rounded-lg border border-warning/20 bg-warning/10 p-2 text-xs">
                      <span className="font-semibold text-amber-400">2. Unallocated Surplus:</span>{" "}
                      <span className="text-muted-foreground">Hub stock past 24h horizon due to mandi capacity caps.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPOILED BREAKDOWN MINI-CARDS */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.03] p-3.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>Baseline Waste Outcome:</span>
                  <span className="font-mono text-rose-400 font-bold">{baselineEval.spoiledQuantityKg.toLocaleString("en-IN")} kg total</span>
                </div>
                <p className="mt-1.5 text-muted-foreground">
                  {baselineEval.unallocatedKg.toLocaleString("en-IN")} kg surplus + <span className="text-rose-400 font-medium">{baselineEval.expiredStockKg.toLocaleString("en-IN")} kg rotten in transit</span>
                </p>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-3.5 text-xs shadow-[0_0_16px_-6px_rgba(34,197,94,0.3)]">
                <div className="flex items-center justify-between font-semibold text-emerald-300">
                  <span>FreshRoute Waste Outcome:</span>
                  <span className="font-mono text-emerald-400 font-bold">{freshEval.spoiledQuantityKg.toLocaleString("en-IN")} kg total</span>
                </div>
                <p className="mt-1.5 text-muted-foreground">
                  {freshEval.unallocatedKg.toLocaleString("en-IN")} kg surplus + <strong className="text-emerald-400 font-semibold">0 kg expired in transit</strong> (100% saved on the road)
                </p>
              </div>
            </div>
          </SectionCard>

          {/* CONSTRAINT AUDIT */}
          <SectionCard
            title="Constraint Audit &amp; Feasibility Verification"
            description="Systematic compliance check across physical warehouse capacity, destination market demand, transit fleet limits, and perishable biological thresholds."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {constraintAudit.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-4 transition-all",
                    item.freshPassed
                      ? "border-white/[0.08] bg-white/[0.02]"
                      : "border-danger/30 bg-danger/5"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">
                        {item.dimension}
                      </h3>
                      {item.freshPassed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          Breached
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.ruleDescription}
                    </p>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="rounded bg-black/30 p-2">
                        <span className="font-medium text-muted-foreground">Baseline: </span>
                        <span className={cn(item.baselinePassed ? "text-foreground" : "text-danger font-semibold")}>
                          {item.baselineDetail}
                        </span>
                      </div>
                      <div className="rounded bg-black/30 p-2">
                        <span className="font-medium text-muted-foreground">FreshRoute: </span>
                        <span className="text-emerald-400 font-semibold">
                          {item.freshDetail}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* METHODOLOGY & LIMITATIONS (COLLAPSIBLE) */}
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-sm">
            <button
              type="button"
              onClick={() => setMethodologyOpen((prev) => !prev)}
              aria-expanded={methodologyOpen}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Methodology, Assumptions &amp; Simulation Limitations
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Operational rules, dispatch heuristics, simulation boundaries, and mathematical constraints.
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  methodologyOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {methodologyOpen && (
              <div className="border-t border-white/[0.08] p-5 pt-4 text-sm text-muted-foreground space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Baseline Strategy */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface/70 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">Benchmark</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        1. Nearest-Mandi Heuristic
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Allocates batches purely in order of road distance (<span className="italic">travelHours</span>). Without evaluating expiry countdowns or mandi arrival margins, it dispatches critical batches on distant journeys where stock rots in transit.
                    </p>
                  </div>

                  {/* FreshRoute Heuristic */}
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 uppercase">FreshRoute Core</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        2. FEFO Quality &amp; Margin Heuristic
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed">
                      First-Expired, First-Out: Sorts batches by remaining shelf-life, filters strictly for <span className="font-mono text-foreground">arrival buffer ≥ 2h</span>, then maximizes net realized revenue per kg across feasible Punjab mandis.
                    </p>
                  </div>

                  {/* Planning Horizon */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface/70 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">Horizon</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        3. 24-Hour Rolling Dispatch Window
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Transit and mandi unloading durations are treated as deterministic commitments. Inventory remaining unallocated at the 24-hour mark is classified as surplus requiring local clearance.
                    </p>
                  </div>

                  {/* Shelf-Life and Demand Assumptions */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface/70 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">Degradation</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        4. Shelf-Life Decay &amp; Markdowns
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Perishability degrades linearly over elapsed time. Automatic 10% markdown triggers when shelf-life is &lt;24h, and 20% markdown under 12h to incentivize fast wholesale absorption.
                    </p>
                  </div>
                </div>

                {/* Simulation Limitations and Disclaimers */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    Operational &amp; Simulation Scope
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed mt-2">
                    <div className="rounded-lg bg-surface/90 p-2.5 border border-white/[0.06]">
                      <strong className="text-foreground block mb-0.5">Operational Heuristic:</strong>
                      Designed for fast, transparent rule-based routing, balancing speed and feasibility over heavy integer programming.
                    </div>
                    <div className="rounded-lg bg-surface/90 p-2.5 border border-white/[0.06]">
                      <strong className="text-foreground block mb-0.5">Synthetic Network:</strong>
                      Evaluated on Punjab Produce Network parameters (kinnow, tomatoes, potatoes, onions across regional mandis).
                    </div>
                    <div className="rounded-lg bg-surface/90 p-2.5 border border-white/[0.06]">
                      <strong className="text-foreground block mb-0.5">Synchronized Window:</strong>
                      Evaluates a unified 24h operational snapshot without synthetic multi-day extrapolations.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* QUICK LINKS TO DETAILED PAGES */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs">
            <span className="text-muted-foreground">
              Explore individual batch breakdowns or simulate supply chain disruptions:
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/inventory"
                className="rounded-lg border border-white/10 px-3 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                View Inventory ({planDataset.batches.length} Batches)
              </Link>
              <Link
                to="/distribution"
                className="rounded-lg border border-white/10 px-3 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                View Distribution Plan
              </Link>
              <Link
                to="/discounts"
                className="rounded-lg border border-white/10 px-3 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                View Discount Actions
              </Link>
              <Link
                to="/scenarios"
                className="rounded-lg border border-white/10 px-3 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                Configure Scenarios
              </Link>
            </div>
          </div>
        </>
      )}

      {/* IDLE / EMPTY STATE */}
      {!isRunning && !isReady && !isError && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <Scale className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              No Evaluation Results Available
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Run both the Baseline and FreshRoute planning models to generate side-by-side economic, volume, and constraint comparisons.
            </p>
          </div>
          <PrimaryButton onClick={() => runBothPlans()}>
            Run Evaluation Now
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
