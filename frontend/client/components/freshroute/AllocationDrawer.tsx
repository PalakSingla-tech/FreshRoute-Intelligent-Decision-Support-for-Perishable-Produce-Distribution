import type { ReactNode } from "react";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MIN_SHELF_LIFE_BUFFER_HOURS,
  formatHours,
  formatRate,
  type AllocationRow,
} from "@/lib/distribution-planner";
import { formatInr } from "@/lib/plan-metrics";

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <dl className="mt-3 flex flex-col gap-2">{children}</dl>
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function AllocationDrawer({
  row,
  onClose,
}: {
  row: AllocationRow | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-card text-foreground sm:max-w-lg">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle>
                Why {row.batchId} → {row.destinationName}?
              </SheetTitle>
              <SheetDescription>
                {row.emoji} {row.commodity} · {kg(row.allocatedKg)} allocated ·
                Simulated result
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-4">
              <DrawerSection title="Batch at dispatch">
                <DetailLine
                  label="Batch quantity"
                  value={kg(row.batchQuantityKg)}
                />
                <DetailLine
                  label="Remaining shelf life at dispatch"
                  value={formatHours(row.shelfLifeAtDispatchHours)}
                />
              </DrawerSection>

              <DrawerSection title="Destination">
                <DetailLine
                  label="Demand left before allocation"
                  value={kg(row.demandLeftKg)}
                />
                <DetailLine
                  label="Remaining capacity before allocation"
                  value={kg(row.capacityLeftKg)}
                />
              </DrawerSection>

              <DrawerSection title="Travel and handling">
                <DetailLine
                  label="Travel time (includes route delay)"
                  value={formatHours(row.travelHours)}
                />
                <DetailLine
                  label="Handling time"
                  value={formatHours(row.handlingHours)}
                />
              </DrawerSection>

              <DrawerSection title="Shelf-life feasibility">
                <p className="text-sm text-muted-foreground">
                  Travel time + handling time must fit within remaining shelf
                  life.
                </p>
                <DetailLine
                  label="Calculation"
                  value={`${formatHours(row.travelAndHandlingHours)} ≤ ${formatHours(row.shelfLifeAtDispatchHours)}`}
                />
                <DetailLine
                  label="Shelf life remaining on arrival"
                  value={formatHours(row.arrivalShelfLifeHours)}
                />
                <DetailLine
                  label="Configured minimum buffer"
                  value={formatHours(MIN_SHELF_LIFE_BUFFER_HOURS)}
                />
              </DrawerSection>

              <DrawerSection title="Price and discount">
                <DetailLine
                  label="Market price"
                  value={formatRate(row.marketPricePerKg)}
                />
                <DetailLine
                  label="Discount"
                  value={`${Math.round(row.discountRate * 100)}%`}
                />
                <DetailLine
                  label="Applied selling price"
                  value={formatRate(row.appliedPricePerKg)}
                />
                <DetailLine
                  label="Allocated quantity"
                  value={kg(row.allocatedKg)}
                />
              </DrawerSection>

              <DrawerSection title="Costs and estimated proceeds">
                <DetailLine
                  label="Transport + handling cost"
                  value={formatInr(row.transportCostInr)}
                />
                <DetailLine
                  label="Discount cost (foregone revenue)"
                  value={formatInr(row.discountCostInr)}
                />
                <DetailLine
                  label="Proceeds calculation"
                  value={`${kg(row.allocatedKg)} × ${formatRate(row.appliedPricePerKg)} − ${formatInr(row.transportCostInr)}`}
                />
                <DetailLine
                  label="Estimated net proceeds"
                  value={formatInr(row.netProceedsInr)}
                />
              </DrawerSection>

              <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Decision reason
                </h3>
                <p className="mt-2 text-sm text-foreground">
                  {row.decisionReason}
                </p>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Constraint checks
                </h3>
                <ul className="mt-3 flex flex-col gap-3">
                  {row.checks.map((check) => (
                    <li
                      key={check.label}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {check.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {check.detail}
                        </p>
                      </div>
                      <StatusBadge
                        tone={check.passed ? "success" : "danger"}
                        className="shrink-0 px-2.5 py-0.5 text-[11px]"
                      >
                        {check.passed ? "Pass" : "Fail"}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
