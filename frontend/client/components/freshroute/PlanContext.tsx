import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  BASE_DATASET,
  runDistributionPlan,
  type AllocationPlan,
  type PlanDataset,
} from "@/lib/distribution-planner";
import {
  PLAN_LABELS,
  PLAN_METRICS,
  snapshotFromPlan,
  type PlanMetrics,
  type PlanMode,
  type PlanSnapshot,
} from "@/lib/plan-metrics";
import { buildScenarioDataset, type ScenarioParams } from "@/lib/scenario";
import { api, toInventoryBatch, type BackendBatch } from "@/lib/api-client";
import type { InventoryBatch } from "@/lib/inventory-batches";

export const DEMO_DATASET_NAME = "Punjab Produce Network";

export type PlanRun =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ready"; plan: AllocationPlan }
  | { status: "error"; message: string };

export type RunSet = Record<PlanMode, PlanRun>;
type RunSlot = "original" | "scenario";

const PLAN_MODES: PlanMode[] = ["baseline", "fresh"];
const IDLE_RUNS: RunSet = { baseline: { status: "idle" }, fresh: { status: "idle" } };
const RUNNING_RUNS: RunSet = {
  baseline: { status: "running" },
  fresh: { status: "running" },
};

interface PlanContextValue {
  dataset: string;
  mode: PlanMode;
  setMode: (mode: PlanMode) => void;
  runPlan: (mode: PlanMode) => void;
  runBothPlans: () => Promise<void>;
  runs: RunSet;
  baseline: PlanMetrics;
  freshRoute: PlanMetrics;
  routeDelayHours: number;
  setRouteDelayHours: (hours: number) => void;
  planDataset: PlanDataset;
  scenario: ScenarioParams | null;
  originalRuns: RunSet;
  scenarioRuns: RunSet;
  applyScenario: (params: ScenarioParams) => void;
  resetScenario: () => void;
  backendConnected: boolean;
  refreshBackendData: () => Promise<void>;
  createBatch: (batch: Partial<BackendBatch>) => Promise<void>;
  updateBatch: (id: number | string, batch: Partial<BackendBatch>) => Promise<void>;
  deleteBatch: (id: number | string) => Promise<void>;
  resetInventory: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlanMode>("baseline");
  const [routeDelayHours, setRouteDelayHours] = useState(0);
  const [scenario, setScenario] = useState<ScenarioParams | null>(null);
  const [originalRuns, setOriginalRuns] = useState<RunSet>(IDLE_RUNS);
  const [scenarioRuns, setScenarioRuns] = useState<RunSet>(IDLE_RUNS);
  const [backendBatches, setBackendBatches] = useState<InventoryBatch[] | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const runTokens = useRef<Record<string, number>>({});
  const applyCount = useRef(0);

  // Sync with live Spring Boot backend
  const refreshBackendData = useCallback(async () => {
    try {
      const data = await api.getInventory();
      if (Array.isArray(data)) {
        const mapped = data.map(toInventoryBatch);
        setBackendBatches(mapped);
        setBackendConnected(true);
      }
    } catch (e) {
      console.warn("Backend sync notice: Using resilient local planner", e);
    }
  }, []);

  const createBatch = useCallback(async (batch: Partial<BackendBatch>) => {
    try {
      await api.createBatch(batch);
      await refreshBackendData();
      toast.success(`Batch ${batch.batchCode || ""} created and saved to database.`);
    } catch (err: any) {
      toast.error(`Failed to create batch: ${err.message}`);
      throw err;
    }
  }, [refreshBackendData]);

  const updateBatch = useCallback(async (id: number | string, batch: Partial<BackendBatch>) => {
    try {
      await api.updateBatch(id, batch);
      await refreshBackendData();
      toast.success(`Batch updated in database.`);
    } catch (err: any) {
      toast.error(`Failed to update batch: ${err.message}`);
      throw err;
    }
  }, [refreshBackendData]);

  const deleteBatch = useCallback(async (id: number | string) => {
    try {
      await api.deleteBatch(id);
      await refreshBackendData();
      toast.success(`Batch removed from database.`);
    } catch (err: any) {
      toast.error(`Failed to delete batch: ${err.message}`);
      throw err;
    }
  }, [refreshBackendData]);

  const resetInventory = useCallback(async () => {
    try {
      await api.resetInventory();
      await refreshBackendData();
      toast.success(`Inventory reset to MoFPI 22-batch baseline in database.`);
    } catch (err: any) {
      toast.error(`Failed to reset inventory: ${err.message}`);
      throw err;
    }
  }, [refreshBackendData]);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  const planDataset = useMemo(() => {
    const base = scenario ? buildScenarioDataset(scenario) : BASE_DATASET;
    if (backendBatches && backendBatches.length > 0) {
      return {
        ...base,
        batches: backendBatches,
      };
    }
    return base;
  }, [backendBatches, scenario]);

  const launch = useCallback(
    (slot: RunSlot, target: PlanMode, dataset: PlanDataset) => {
      const key = `${slot}:${target}`;
      const token = (runTokens.current[key] ?? 0) + 1;
      runTokens.current[key] = token;

      const write = (run: PlanRun) => {
        if (runTokens.current[key] !== token) return;
        const update = (prev: RunSet) => ({ ...prev, [target]: run });
        if (slot === "original") setOriginalRuns(update);
        else setScenarioRuns(update);
      };

      write({ status: "running" });

      // Trigger Spring Boot backend execution in tandem
      if (target === "fresh") {
        api.runFreshRoutePlan().catch(() => {});
      } else {
        api.runBaselinePlan().catch(() => {});
      }

      return runDistributionPlan(target, routeDelayHours, dataset).then(
        (plan): PlanRun => {
          const run: PlanRun = { status: "ready", plan };
          write(run);
          return run;
        },
        (error: unknown): PlanRun => {
          const run: PlanRun = {
            status: "error",
            message: error instanceof Error ? error.message : "Plan run failed.",
          };
          write(run);
          return run;
        },
      );
    },
    [routeDelayHours],
  );

  // Auto-launch baseline and fresh plans on initial mount so all pages have evaluation data
  useEffect(() => {
    launch("original", "baseline", planDataset);
    launch("original", "fresh", planDataset);
  }, [launch, planDataset]);

  const invalidateScenarioRuns = useCallback(() => {
    for (const target of PLAN_MODES) {
      const key = `scenario:${target}`;
      runTokens.current[key] = (runTokens.current[key] ?? 0) + 1;
    }
  }, []);

  const runPlan = useCallback(
    (target: PlanMode) => {
      setMode(target);
      const slot: RunSlot = scenario ? "scenario" : "original";
      launch(slot, target, planDataset).then((run) => {
        if (run.status === "ready") {
          toast.success(
            scenario
              ? `${PLAN_LABELS[target]} replanned on the scenario dataset.`
              : `${PLAN_LABELS[target]} generated successfully.`,
          );
        } else if (run.status === "error") {
          toast.error(run.message);
        }
      });
    },
    [launch, planDataset, scenario],
  );

  const runBothPlans = useCallback(async () => {
    const slot: RunSlot = scenario ? "scenario" : "original";
    await Promise.all([
      launch(slot, "baseline", planDataset),
      launch(slot, "fresh", planDataset),
    ]);
    toast.success("Evaluated both plans under current configuration.");
  }, [launch, planDataset, scenario]);

  const applyScenario = useCallback(
    (params: ScenarioParams) => {
      const applyId = ++applyCount.current;
      invalidateScenarioRuns();
      const dataset = buildScenarioDataset(params);
      setScenario(params);
      setScenarioRuns(RUNNING_RUNS);

      Promise.all([
        ...PLAN_MODES.map((target) => launch("original", target, BASE_DATASET)),
        ...PLAN_MODES.map((target) => launch("scenario", target, dataset)),
      ]).then((runs) => {
        if (applyId !== applyCount.current) return;
        const failure = runs.find((run) => run.status === "error");
        if (failure && failure.status === "error") {
          toast.error(failure.message);
        } else {
          toast.success("Scenario applied. Both plans were replanned on the scenario dataset.");
        }
      });
    },
    [invalidateScenarioRuns, launch],
  );

  const resetScenario = useCallback(() => {
    applyCount.current += 1;
    invalidateScenarioRuns();
    setScenario(null);
    setScenarioRuns(IDLE_RUNS);
  }, [invalidateScenarioRuns]);

  const activeRuns = scenario ? scenarioRuns : originalRuns;

  const metrics = useMemo<Record<PlanMode, PlanSnapshot> | null>(() => {
    const baselineRun = activeRuns.baseline;
    const freshRun = activeRuns.fresh;
    if (baselineRun.status !== "ready" || freshRun.status !== "ready") {
      return null;
    }
    return {
      baseline: snapshotFromPlan(baselineRun.plan, planDataset.batches),
      fresh: snapshotFromPlan(freshRun.plan, planDataset.batches),
    };
  }, [activeRuns.baseline, activeRuns.fresh, planDataset.batches]);

  const value = useMemo(
    () => ({
      dataset: DEMO_DATASET_NAME,
      mode,
      setMode,
      runPlan,
      runBothPlans,
      runs: activeRuns,
      baseline: metrics?.baseline ?? PLAN_METRICS.baseline,
      freshRoute: metrics?.fresh ?? PLAN_METRICS.fresh,
      routeDelayHours,
      setRouteDelayHours,
      planDataset,
      scenario,
      originalRuns,
      scenarioRuns,
      applyScenario,
      resetScenario,
      backendConnected,
      refreshBackendData,
      createBatch,
      updateBatch,
      deleteBatch,
      resetInventory,
    }),
    [
      activeRuns,
      applyScenario,
      backendConnected,
      createBatch,
      deleteBatch,
      metrics,
      mode,
      originalRuns,
      planDataset,
      refreshBackendData,
      resetInventory,
      resetScenario,
      routeDelayHours,
      runBothPlans,
      runPlan,
      scenario,
      scenarioRuns,
      updateBatch,
    ],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within PlanProvider");
  }
  return context;
}
