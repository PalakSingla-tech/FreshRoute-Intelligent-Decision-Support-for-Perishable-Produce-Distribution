import { cn } from "@/lib/utils";
import { formatHours } from "@/lib/distribution-planner";
import type { DestinationStats } from "@/lib/distribution-network";

const COLUMNS: { label: string; align?: "right" }[] = [
  { label: "Destination" },
  { label: "Demand, kg", align: "right" },
  { label: "Allocated, kg", align: "right" },
  { label: "Remaining demand, kg", align: "right" },
  { label: "Configured capacity, kg", align: "right" },
  { label: "Capacity used, %", align: "right" },
  { label: "Travel time, hours", align: "right" },
];

const kg = (value: number) => value.toLocaleString("en-IN");

export function DestinationConstraintsTable({
  stats,
  hasPlan,
  routeDelayHours,
  selectedId,
  onSelect,
}: {
  stats: DestinationStats[];
  hasPlan: boolean;
  routeDelayHours: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="bg-card shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
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
          {stats.map((stat, index) => {
            const { destination } = stat;
            const isSelected = selectedId === destination.id;
            const travelHours = destination.travelHours + (hasPlan ? routeDelayHours : 0);
            return (
              <tr
                key={destination.id}
                className={cn(
                  "border-b border-white/[0.04] transition-colors hover:bg-white/[0.06]",
                  isSelected ? "bg-primary/10" : index % 2 === 1 && "bg-white/[0.02]",
                )}
              >
                <td className="whitespace-nowrap px-3 py-2">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(destination.id)}
                    className={cn(
                      "text-left font-medium transition-colors hover:text-primary",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {destination.name}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                  {kg(destination.demandKg)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                  {hasPlan ? kg(stat.allocatedKg) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                  {hasPlan ? kg(stat.remainingDemandKg) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                  {kg(destination.capacityKg)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                  {hasPlan ? `${stat.capacityUsedPct}%` : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {formatHours(travelHours)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
