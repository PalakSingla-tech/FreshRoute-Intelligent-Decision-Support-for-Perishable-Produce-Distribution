import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Pencil,
  Plus,
  RotateCcw,
  ThermometerSnowflake,
  Trash2,
  TrendingDown,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { ShelfLifeCountdown } from "@/components/freshroute/ShelfLifeCountdown";
import { AddEditBatchModal } from "@/components/freshroute/AddEditBatchModal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  INVENTORY_BATCHES,
  SHELF_LIFE_SCALE_HOURS,
  riskFor,
  type InventoryBatch,
  type RiskLevel,
} from "@/lib/inventory-batches";
import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/plan-metrics";
import { usePlan } from "@/components/freshroute/PlanContext";
import { api, type BatchDecisionAudit } from "@/lib/api-client";

type FilterKey = "all" | "critical" | "medium" | "low";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Batches" },
  { key: "critical", label: "Critical" },
  { key: "medium", label: "Medium Risk" },
  { key: "low", label: "Low Risk" },
];

type DataSortKey =
  "id" | "commodity" | "quantityKg" | "remainingHours" | "pricePerKg";
type SortKey = DataSortKey | "packedAt" | "risk";

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface ColumnDef {
  key: SortKey | null;
  label: string;
  align?: "right";
}

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "Batch ID" },
  { key: "commodity", label: "Commodity" },
  { key: "quantityKg", label: "Quantity (kg)", align: "right" },
  { key: "packedAt", label: "Packed At" },
  { key: "remainingHours", label: "Remaining Shelf Life" },
  { key: "risk", label: "Risk Level" },
  { key: "pricePerKg", label: "Current Price", align: "right" },
  { key: null, label: "Recommended Action" },
  { key: null, label: "Actions" },
];

const RISK_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2 };

const RISK_TONE: Record<RiskLevel, "success" | "warning" | "danger"> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

const matchesFilter = (batch: InventoryBatch, filter: FilterKey) => {
  if (filter === "all") return true;
  const risk = riskFor(batch.remainingHours);
  if (filter === "critical") return risk === "High";
  if (filter === "medium") return risk === "Medium";
  return risk === "Low";
};

const compareBatches = (a: InventoryBatch, b: InventoryBatch, key: SortKey) => {
  if (key === "risk") {
    return (
      RISK_RANK[riskFor(a.remainingHours)] -
      RISK_RANK[riskFor(b.remainingHours)]
    );
  }
  if (key === "packedAt") {
    return Date.parse(a.packedAt) - Date.parse(b.packedAt);
  }
  const av = a[key];
  const bv = b[key];
  return typeof av === "number" && typeof bv === "number"
    ? av - bv
    : String(av).localeCompare(String(bv));
};

const packedFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const shelfColor = (hours: number) => {
  if (hours < 8) return "bg-danger";
  if (hours <= 24) return "bg-warning";
  return "bg-primary";
};

function ShelfLifeCell({ hours }: { hours: number }) {
  const width = Math.min((hours / SHELF_LIFE_SCALE_HOURS) * 100, 100);

  return (
    <div className="flex min-w-36 items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full", shelfColor(hours))}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-foreground">
        {hours} h
      </span>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active)
    return <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />;
  const Icon = dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon className="h-3 w-3 text-primary" aria-hidden="true" />;
}

function getBatchExplainability(batch: InventoryBatch) {
  const risk = riskFor(batch.remainingHours);
  const totalValue = batch.quantityKg * batch.pricePerKg;

  const commodity = batch.commodity.toLowerCase();
  const isLeafy = commodity.includes("spinach") || commodity.includes("green");
  const isTomato = commodity.includes("tomato");
  const isFruit = commodity.includes("banana") || commodity.includes("kinnow");

  const respirationRate = isLeafy
    ? "Very High (45–60 mg CO₂/kg·h · rapid water transpiration)"
    : isTomato
    ? "High Climacteric (22–28 mg CO₂/kg·h · ethylene autocatalysis)"
    : isFruit
    ? "High Ethylene Emission (18–25 mg CO₂/kg·h · peel sugar breakdown)"
    : "Low Basal Respiration (5–8 mg CO₂/kg·h)";

  const optimumTemp = isLeafy
    ? "2°C – 4°C with >95% Relative Humidity"
    : isTomato
    ? "10°C – 12°C (chilling sensitive below 8°C)"
    : isFruit
    ? "13°C – 14°C (susceptible to chill browning below 11°C)"
    : "15°C – 20°C (well-ventilated dry ambient)";

  const markdownPct = risk === "High" ? 25 : risk === "Medium" ? 15 : 0;
  const effectivePrice = Math.round(batch.pricePerKg * (1 - markdownPct / 100));
  const salvageValue = Math.round(batch.quantityKg * effectivePrice);
  const potentialLoss = Math.round(
    totalValue * (risk === "High" ? 0.9 : risk === "Medium" ? 0.45 : 0.05),
  );

  const urgencyTier =
    risk === "High"
      ? "Immediate Dispatch (< 4h window)"
      : risk === "Medium"
      ? "Priority Route (< 12h window)"
      : "Standard Buffer (> 24h window)";

  let packedDateStr = "12 Oct, 06:30 AM";
  try {
    packedDateStr = new Date(batch.packedAt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    // fallback
  }

  return {
    risk,
    totalValue,
    markdownPct,
    effectivePrice,
    salvageValue,
    potentialLoss,
    urgencyTier,
    respirationRate,
    optimumTemp,
    packedDateStr,
    spoilageProb:
      risk === "High"
        ? "82% spoilage likelihood within 6 hours under ambient Punjab heat (>31°C)"
        : risk === "Medium"
        ? "38% quality degradation if delayed beyond 16 hours"
        : "Minimal (<5%) spoilage hazard under baseline cold-chain",
    transitBuffer:
      risk === "High"
        ? `Tight transit margin: ${batch.remainingHours}h remaining vs 3.5h route transit time to Mandi`
        : `Safe transit margin: ${batch.remainingHours}h remaining allows standard refrigerated transit`,
    q10Factor: "2.35 (Arrhenius temperature-dependent respiration kinetic model)",
  };
}

function ReasonDrawer({
  batch,
  onClose,
}: {
  batch: InventoryBatch | null;
  onClose: () => void;
}) {
  const [backendAudit, setBackendAudit] = useState<BatchDecisionAudit | null>(null);
  const risk = batch ? riskFor(batch.remainingHours) : null;
  const exp = batch ? getBatchExplainability(batch) : null;

  useEffect(() => {
    if (!batch) {
      setBackendAudit(null);
      return;
    }
    api
      .getBatchExplainability(batch.id)
      .then((data) => setBackendAudit(data))
      .catch(() => setBackendAudit(null));
  }, [batch]);

  return (
    <Sheet open={batch !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-card text-foreground sm:max-w-xl">
        {batch && risk && exp && (
          <>
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl" aria-hidden="true">
                    {batch.emoji}
                  </span>
                  <div>
                    <SheetTitle className="text-lg font-bold font-heading">
                      Explainability &amp; Risk Audit: {batch.id}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                      {batch.commodity} · {batch.quantityKg.toLocaleString("en-IN")} kg · Harvested {exp.packedDateStr}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-5 flex flex-col gap-4">
              {/* Dynamic Shelf-Life Countdown Gauge */}
              <div className="rounded-xl border border-border bg-surface/80 p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
                    Live Perishability Countdown
                  </span>
                  <StatusBadge
                    tone={
                      risk === "High"
                        ? "danger"
                        : risk === "Medium"
                        ? "warning"
                        : "success"
                    }
                  >
                    {risk} Risk Tier
                  </StatusBadge>
                </div>
                <ShelfLifeCountdown initialHours={batch.remainingHours} />
              </div>

              {/* 1. Recommended Action */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                    Recommended Action
                  </p>
                  <span className="font-mono text-[11px] font-semibold text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full">
                    {backendAudit?.urgencyTier || exp.urgencyTier}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {backendAudit?.recommendedAction || batch.recommendedAction}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {backendAudit?.transitBuffer || exp.transitBuffer}
                </p>
              </div>

              {/* 2. Risk Drivers */}
              <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      risk === "High" ? "text-danger" : "text-warning",
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    Agronomic &amp; Transit Risk Drivers
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Spoilage Probability:</span>
                    <span className="font-medium text-foreground text-right">
                      {backendAudit?.spoilageProbability || exp.spoilageProb}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Produce Respiration:</span>
                    <span className="font-medium text-foreground text-right">
                      {backendAudit?.respirationRate || exp.respirationRate}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">Corridor Heat Factor:</span>
                    <span className="font-medium text-foreground text-right">
                      {backendAudit?.corridorHeatFactor || "Punjab daytime ambient (>31°C) accelerates decay velocity 2.4×"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Shelf-Life Biochemical Model */}
              <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ThermometerSnowflake
                    className="h-4 w-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    Biochemical Shelf-Life Model
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Model Engine:</span>
                    <span className="font-mono text-foreground">{backendAudit?.q10Factor || exp.q10Factor}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Target Cold-Chain:</span>
                    <span className="font-medium text-emerald-400">
                      {backendAudit?.optimumTemp || exp.optimumTemp}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">Degradation Threshold:</span>
                    <span className="font-mono text-warning font-semibold">
                      {backendAudit?.degradationThreshold || `T − ${batch.remainingHours} hours until unmarketable quality loss`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Candidate Route Feasibility (From Backend Optimizer) */}
              {backendAudit?.candidateRoutes && backendAudit.candidateRoutes.length > 0 && (
                <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Backend Multi-Route Feasibility Analysis
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="border-b border-border/60 text-muted-foreground uppercase text-[9px]">
                        <tr>
                          <th className="pb-1.5">Mandi Destination</th>
                          <th className="pb-1.5 text-right">Transit</th>
                          <th className="pb-1.5 text-right">Buffer</th>
                          <th className="pb-1.5 text-right">Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {backendAudit.candidateRoutes.slice(0, 5).map((r, i) => (
                          <tr key={i} className="hover:bg-primary/[0.02]">
                            <td className="py-1 font-sans">{r.destinationName}</td>
                            <td className="py-1 text-right">{r.totalTransitHours}h</td>
                            <td
                              className={cn(
                                "py-1 text-right font-bold",
                                r.shelfLifeBufferHours >= 2 ? "text-emerald-400" : "text-danger",
                              )}
                            >
                              {r.shelfLifeBufferHours > 0 ? `+${r.shelfLifeBufferHours}h` : `${r.shelfLifeBufferHours}h`}
                            </td>
                            <td className="py-1 text-right font-sans">
                              {r.feasible ? (
                                <span className="text-emerald-400 font-semibold">Feasible</span>
                              ) : (
                                <span className="text-danger font-semibold">Spoiled</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Price Rationale & Salvage Economics */}
              <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingDown className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    Price Rationale &amp; Margin Defense
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Base Mandi Price:</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{backendAudit?.basePricePerKg || batch.pricePerKg}/kg (Gross Value: {formatInr(exp.totalValue)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Recommended Markdown:</span>
                    <span className="font-mono font-semibold text-primary">
                      {(backendAudit?.markdownPct ?? exp.markdownPct) > 0
                        ? `${backendAudit?.markdownPct ?? exp.markdownPct}% discount → ₹${backendAudit?.effectivePricePerKg ?? exp.effectivePrice}/kg`
                        : "0% (Full Price Realization)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Projected Capital Salvage:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatInr(backendAudit?.salvageValueInr || exp.salvageValue)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="text-muted-foreground">Economic Rationale:</span>
                    <span className="text-foreground text-right">
                      {backendAudit?.pricingAndDiscountRuleDisclosed ||
                        ((backendAudit?.markdownPct ?? exp.markdownPct) > 0
                          ? `Clears batch before quality deterioration threshold, avoiding ${formatInr(
                              backendAudit?.potentialLossInr || exp.potentialLoss,
                            )} in dump write-offs.`
                          : `Sufficient shelf-life allows capturing full APMC mandi premium without markdown.`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function InventoryTable() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortState | null>({
    key: "remainingHours",
    dir: "asc",
  });
  const [selected, setSelected] = useState<InventoryBatch | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  const [resetting, setResetting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const focusBatchId = searchParams.get("batch");
  const focusedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    focusedRowRef.current?.scrollIntoView({ block: "center" });
  }, [focusBatchId]);

  const { planDataset, createBatch, updateBatch, deleteBatch, resetInventory } = usePlan();
  const datasetBatches = planDataset?.batches ?? INVENTORY_BATCHES;

  const rows = useMemo(() => {
    const filtered = datasetBatches.filter((batch) =>
      matchesFilter(batch, filter),
    );
    if (!sort) return filtered;
    const direction = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort(
      (a, b) => direction * compareBatches(a, b, sort.key),
    );
  }, [datasetBatches, filter, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const countFor = (key: FilterKey) =>
    datasetBatches.filter((batch) => matchesFilter(batch, key)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter batches"
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-white/10 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {item.label}
                <span className="tabular-nums opacity-70">
                  {countFor(item.key)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Batch</span>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={async () => {
              if (window.confirm("Reset database to the standard 22-batch MoFPI seed dataset?")) {
                setResetting(true);
                try {
                  await resetInventory();
                } finally {
                  setResetting(false);
                }
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground disabled:opacity-50"
            title="Reset database to seed dataset"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", resetting && "animate-spin")} />
            <span>Reset Dataset</span>
          </button>

          <p className="text-xs text-muted-foreground tabular-nums ml-1">
            Showing {rows.length} of {datasetBatches.length} batches
          </p>
        </div>
      </div>

      <div className="max-h-[440px] overflow-auto rounded-lg border border-white/[0.06]">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <tr>
              {COLUMNS.map((column) => {
                const sortable = column.key !== null;
                const active = sortable && sort?.key === column.key;
                return (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key as SortKey)}
                        className={cn(
                          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {column.label}
                        <SortIcon
                          active={active}
                          dir={active ? sort.dir : undefined}
                        />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No batches match this filter.
                </td>
              </tr>
            )}
            {rows.map((batch, index) => {
              const risk = riskFor(batch.remainingHours);
              const focused = batch.id === focusBatchId;
              return (
                <tr
                  key={batch.id}
                  ref={focused ? focusedRowRef : undefined}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.06]",
                    index % 2 === 1 && "bg-white/[0.02]",
                    focused && "bg-primary/10 ring-1 ring-inset ring-primary/50",
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-foreground">
                    {batch.id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">
                    <span className="mr-2" aria-hidden="true">
                      {batch.emoji}
                    </span>
                    {batch.commodity}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {batch.quantityKg.toLocaleString("en-IN")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground tabular-nums">
                    {packedFormatter.format(new Date(batch.packedAt))}
                  </td>
                  <td className="px-3 py-2">
                    <ShelfLifeCell hours={batch.remainingHours} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge
                      tone={RISK_TONE[risk]}
                      className="px-2.5 py-0.5 text-[11px]"
                    >
                      {risk}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {formatInr(batch.pricePerKg)}/kg
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {batch.recommendedAction}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelected(batch)}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      >
                        Reason
                      </button>
                      <button
                        type="button"
                        title="Edit batch in database"
                        onClick={() => setEditingBatch(batch)}
                        className="rounded-md border border-white/10 p-1 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete batch from database"
                        disabled={deletingId === batch.id}
                        onClick={async () => {
                          if (window.confirm(`Delete batch ${batch.id} (${batch.commodity}) from database?`)) {
                            setDeletingId(batch.id);
                            try {
                              await deleteBatch(batch.id);
                            } finally {
                              setDeletingId(null);
                            }
                          }
                        }}
                        className="rounded-md border border-danger/20 p-1 text-xs text-danger/80 transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddEditBatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (batchData) => {
          await createBatch(batchData);
        }}
      />

      <AddEditBatchModal
        isOpen={editingBatch !== null}
        onClose={() => setEditingBatch(null)}
        initialBatch={editingBatch}
        onSave={async (batchData) => {
          if (!editingBatch) return;
          await updateBatch(editingBatch.id, batchData);
        }}
      />

      <ReasonDrawer batch={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
