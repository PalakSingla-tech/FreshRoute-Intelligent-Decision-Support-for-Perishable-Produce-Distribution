import { useState } from "react";
import { Link } from "react-router-dom";
import { DiscountDetailsDrawer } from "@/components/freshroute/DiscountDetailsDrawer";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import {
  type DiscountAction,
  type DiscountRecommendation,
} from "@/lib/discount-recommendations";
import { formatHours, formatRate } from "@/lib/distribution-planner";
import { formatInr } from "@/lib/plan-metrics";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "high-risk" | "discount" | "no-feasible";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high-risk", label: "High risk" },
  { key: "discount", label: "Discount recommended" },
  { key: "no-feasible", label: "No feasible destination" },
];

const ACTION_LABEL: Record<DiscountAction, string> = {
  discount: "Discount",
  redirect: "Redirect",
  "no-feasible-sale": "No feasible sale",
};

const ACTION_TONE: Record<DiscountAction, "warning" | "info" | "danger"> = {
  discount: "warning",
  redirect: "info",
  "no-feasible-sale": "danger",
};

const RISK_TONE: Record<DiscountRecommendation["risk"], "success" | "warning" | "danger"> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

const matchesFilter = (rec: DiscountRecommendation, filter: FilterKey) => {
  if (filter === "all") return true;
  if (filter === "high-risk") return rec.risk === "High";
  if (filter === "discount") return rec.action === "discount";
  return rec.action === "no-feasible-sale";
};

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-foreground">{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RecommendationCard({
  rec,
  onDetails,
}: {
  rec: DiscountRecommendation;
  onDetails: () => void;
}) {
  const { batch } = rec;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-foreground">
            {batch.id}
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            <span className="mr-1.5" aria-hidden="true">
              {batch.emoji}
            </span>
            {batch.commodity}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={RISK_TONE[rec.risk]}
            className="px-2.5 py-0.5 text-[11px]"
          >
            {rec.risk} risk
          </StatusBadge>
          <StatusBadge
            tone={ACTION_TONE[rec.action]}
            className="px-2.5 py-0.5 text-[11px]"
          >
            Suggested: {ACTION_LABEL[rec.action]}
          </StatusBadge>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
        <Field label="Unallocated quantity" value={kg(rec.unallocatedKg)} />
        <Field label="Remaining shelf life" value={formatHours(batch.remainingHours)} />
        <Field label="Original price" value={formatRate(batch.pricePerKg)} />
        <Field
          label="Recommended discount"
          value={
            rec.discountRate === null
              ? "None"
              : `${Math.round(rec.discountRate * 100)}%`
          }
        />
        <Field
          label="Discounted price"
          value={
            rec.discountedPricePerKg === null
              ? "—"
              : formatRate(rec.discountedPricePerKg)
          }
        />
        <Field label="Assumed sellable quantity" value={kg(rec.assumedSellableKg)} />
        <Field
          label="Potential discounted revenue"
          value={
            rec.potentialRevenueInr === null
              ? "—"
              : formatInr(rec.potentialRevenueInr)
          }
          hint="Estimate, not counted in plan totals"
        />
      </dl>

      <p className="text-sm text-muted-foreground">{rec.reason}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <Link
          to={`/inventory?batch=${encodeURIComponent(batch.id)}`}
          className="rounded-md px-2 py-1 text-xs font-medium text-info transition-colors hover:bg-info/10"
        >
          View batch on Inventory
        </Link>
        <button
          type="button"
          onClick={onDetails}
          className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          View details
        </button>
      </div>
    </article>
  );
}

export function DiscountRecommendations({
  recommendations,
}: {
  recommendations: DiscountRecommendation[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-muted-foreground">
        This plan allocates all inventory. No unallocated batches need a discount or redirect.
      </div>
    );
  }

  const visible = recommendations.filter((rec) => matchesFilter(rec, filter));
  const openRec =
    recommendations.find((rec) => rec.batch.id === openBatchId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter recommendations"
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
                  {recommendations.filter((rec) => matchesFilter(rec, item.key)).length}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing {visible.length} of {recommendations.length} unallocated batches
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-muted-foreground">
          No batches match this filter.
        </div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {visible.map((rec) => (
            <li key={rec.batch.id}>
              <RecommendationCard
                rec={rec}
                onDetails={() => setOpenBatchId(rec.batch.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <DiscountDetailsDrawer
        rec={openRec}
        onClose={() => setOpenBatchId(null)}
      />
    </div>
  );
}
