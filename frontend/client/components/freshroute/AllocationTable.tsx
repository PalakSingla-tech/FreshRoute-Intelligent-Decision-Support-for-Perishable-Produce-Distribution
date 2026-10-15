import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AllocationDrawer } from "@/components/freshroute/AllocationDrawer";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { routeKey } from "@/lib/distribution-network";
import {
  MIN_SHELF_LIFE_BUFFER_HOURS,
  formatHours,
  formatRate,
  type AllocationRow,
  type Destination,
} from "@/lib/distribution-planner";
import type { RiskLevel } from "@/lib/inventory-batches";
import { formatInr } from "@/lib/plan-metrics";
import { cn } from "@/lib/utils";

const PRIORITY_TONE: Record<RiskLevel, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
};

const COLUMNS: { label: string; align?: "right" }[] = [
  { label: "Batch / Commodity" },
  { label: "Destination" },
  { label: "Allocated (kg)", align: "right" },
  { label: "Travel + Handling" },
  { label: "Shelf Life on Arrival" },
  { label: "Applied Price", align: "right" },
  { label: "Transport + Handling", align: "right" },
  { label: "Est. Net Proceeds", align: "right" },
  { label: "Dispatch Priority" },
  { label: "Explanation" },
];

export function AllocationTable({
  rows,
  destination,
  onClearDestination,
  highlightedRouteKey,
  openRowId,
  onOpenRow,
}: {
  rows: AllocationRow[];
  destination: Destination | null;
  onClearDestination: () => void;
  highlightedRouteKey: string | null;
  openRowId: string | null;
  onOpenRow: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const openRow = rows.find((row) => row.id === openRowId) ?? null;

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (destination && row.destinationId !== destination.id) return false;
      if (!term) return true;
      return [row.batchId, row.commodity, row.destinationName].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [destination, query, rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Search allocations</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search batch, commodity, or destination"
            className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {destination && (
            <button
              type="button"
              onClick={onClearDestination}
              className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs font-semibold text-info transition-colors hover:bg-info/20"
            >
              Destination: {destination.name} · Show all
            </button>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {visibleRows.length} of {rows.length} allocations
          </p>
        </div>
      </div>

      <div className="max-h-[480px] overflow-auto rounded-lg border border-white/[0.06]">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No allocations match these filters.
                </td>
              </tr>
            )}
            {visibleRows.map((row, index) => {
              const shelfShort =
                row.arrivalShelfLifeHours < MIN_SHELF_LIFE_BUFFER_HOURS;
              const highlighted =
                highlightedRouteKey === routeKey(row.warehouseId, row.destinationId);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.06]",
                    index % 2 === 1 && "bg-white/[0.02]",
                    highlighted && "bg-primary/10 shadow-[inset_3px_0_0_#22d3ee]",
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <p className="font-mono text-xs font-semibold text-foreground">
                      <span className="mr-2" aria-hidden="true">
                        {row.emoji}
                      </span>
                      {row.batchId}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.commodity}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">
                    {row.destinationName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {row.allocatedKg.toLocaleString("en-IN")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                    {formatHours(row.travelAndHandlingHours)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2 tabular-nums",
                      shelfShort ? "font-semibold text-danger" : "text-foreground",
                    )}
                  >
                    {formatHours(row.arrivalShelfLifeHours)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {formatRate(row.appliedPricePerKg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {formatInr(row.transportCostInr)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                    {formatInr(row.netProceedsInr)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge
                      tone={PRIORITY_TONE[row.priority]}
                      className="px-2.5 py-0.5 text-[11px]"
                    >
                      {row.priority}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenRow(row.id)}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      Why this allocation?
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AllocationDrawer row={openRow} onClose={() => onOpenRow(null)} />
    </div>
  );
}
