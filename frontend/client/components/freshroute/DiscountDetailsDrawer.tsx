import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/freshroute/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CLEARANCE_SELL_THROUGH,
  type DiscountAction,
  type DiscountRecommendation,
} from "@/lib/discount-recommendations";
import {
  MIN_SHELF_LIFE_BUFFER_HOURS,
  formatHours,
  formatRate,
} from "@/lib/distribution-planner";
import { formatInr } from "@/lib/plan-metrics";

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

const ACTION_LABEL: Record<DiscountAction, string> = {
  discount: "Discount",
  redirect: "Redirect",
  "no-feasible-sale": "No feasible sale",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

export function DiscountDetailsDrawer({
  rec,
  onClose,
}: {
  rec: DiscountRecommendation | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={rec !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-card text-foreground sm:max-w-lg">
        {rec && (
          <>
            <SheetHeader>
              <SheetTitle>Discount details: {rec.batch.id}</SheetTitle>
              <SheetDescription>
                {rec.batch.emoji} {rec.batch.commodity} ·{" "}
                {kg(rec.unallocatedKg)} unallocated · {rec.risk} risk
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-4">
              <Section title="Suggested action">
                <div>
                  <StatusBadge
                    tone={
                      rec.action === "discount"
                        ? "warning"
                        : rec.action === "redirect"
                          ? "info"
                          : "danger"
                    }
                  >
                    {ACTION_LABEL[rec.action]}
                  </StatusBadge>
                </div>
                <p className="text-sm text-foreground">{rec.reason}</p>
              </Section>

              <Section title="Price and estimate">
                <DetailLine
                  label="Original price"
                  value={formatRate(rec.batch.pricePerKg)}
                />
                <DetailLine
                  label="Recommended discount"
                  value={
                    rec.discountRate === null
                      ? "None"
                      : `${Math.round(rec.discountRate * 100)}%`
                  }
                />
                <DetailLine
                  label="Discounted price"
                  value={
                    rec.discountedPricePerKg === null
                      ? "—"
                      : formatRate(rec.discountedPricePerKg)
                  }
                />
                <DetailLine
                  label={`Assumed sellable (${Math.round(CLEARANCE_SELL_THROUGH * 100)}% sell-through)`}
                  value={kg(rec.assumedSellableKg)}
                />
                <DetailLine
                  label="Potential discounted revenue"
                  value={
                    rec.potentialRevenueInr === null
                      ? "—"
                      : formatInr(rec.potentialRevenueInr)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Potential revenue is an estimate. It is not recovered revenue
                  and is not counted in plan totals.
                </p>
              </Section>

              <Section title="Destination check">
                <p className="text-sm text-muted-foreground">
                  Shelf life on arrival must clear the {MIN_SHELF_LIFE_BUFFER_HOURS} h
                  buffer, and the destination needs spare demand and capacity in
                  this plan.
                </p>
                <ul className="mt-1 flex flex-col gap-3">
                  {rec.destinationChecks.map((check) => {
                    const feasible = check.shelfLifeOk && check.spareKg > 0;
                    return (
                      <li
                        key={check.destination.id}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {check.destination.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatHours(check.arrivalHours)} on arrival ·{" "}
                            {kg(check.spareKg)} spare in this plan
                          </p>
                        </div>
                        <StatusBadge
                          tone={feasible ? "success" : "danger"}
                          className="shrink-0 px-2.5 py-0.5 text-[11px]"
                        >
                          {feasible ? "Feasible" : "Not feasible"}
                        </StatusBadge>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <Link
                to={`/inventory?batch=${encodeURIComponent(rec.batch.id)}`}
                className="rounded-lg border border-info/30 bg-info/10 px-4 py-2.5 text-center text-sm font-medium text-info transition-colors hover:bg-info/15"
              >
                View {rec.batch.id} on Inventory
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
