import { StatusBadge } from "@/components/freshroute/StatusBadge";
import { DISPATCH_LANES, type DispatchLane } from "@/lib/dispatch-plan";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<
  DispatchLane["status"],
  "success" | "info" | "neutral"
> = {
  Loading: "info",
  Scheduled: "neutral",
  "In transit": "success",
};

const COLUMNS = [
  { label: "Lane", align: "left" },
  { label: "Batch", align: "left" },
  { label: "Route", align: "left" },
  { label: "Quantity (kg)", align: "right" },
  { label: "Vehicle", align: "left" },
  { label: "Departure", align: "left" },
  { label: "Status", align: "left" },
] as const;

interface DispatchTableProps {
  limit?: number;
}

export function DispatchTable({ limit }: DispatchTableProps) {
  const lanes = limit ? DISPATCH_LANES.slice(0, limit) : DISPATCH_LANES;

  return (
    <div className="overflow-auto rounded-lg border border-white/[0.06]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
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
          {lanes.map((lane, index) => (
            <tr
              key={lane.id}
              className={cn(
                "border-b border-white/[0.04] transition-colors hover:bg-white/[0.06]",
                index % 2 === 1 && "bg-white/[0.02]",
              )}
            >
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-foreground">
                {lane.id}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                <span className="mr-2" aria-hidden="true">
                  {lane.emoji}
                </span>
                {lane.batchId}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{lane.route}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
                {lane.quantityKg.toLocaleString("en-IN")}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                {lane.vehicle}
              </td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                {lane.departure}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <StatusBadge
                  tone={STATUS_TONE[lane.status]}
                  className="px-2.5 py-0.5 text-[11px]"
                >
                  {lane.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
