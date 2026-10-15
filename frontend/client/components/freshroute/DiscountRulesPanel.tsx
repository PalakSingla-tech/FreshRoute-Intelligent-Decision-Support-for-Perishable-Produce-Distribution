import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "@/components/freshroute/SectionCard";
import {
  CLEARANCE_SELL_THROUGH,
  DISCOUNT_WINDOW_HOURS,
  HIGH_RISK_DISCOUNT_RATE,
  MEDIUM_RISK_DISCOUNT_RATE,
} from "@/lib/discount-recommendations";
import { MIN_SHELF_LIFE_BUFFER_HOURS } from "@/lib/distribution-planner";

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

const THRESHOLDS: { label: string; value: string }[] = [
  {
    label: "High risk: under 8 h remaining",
    value: `${percent(HIGH_RISK_DISCOUNT_RATE)} clearance discount`,
  },
  {
    label: "Medium risk: 8 to 24 h remaining",
    value: `${percent(MEDIUM_RISK_DISCOUNT_RATE)} clearance discount`,
  },
  {
    label: `Under ${MIN_SHELF_LIFE_BUFFER_HOURS} h, or over ${DISCOUNT_WINDOW_HOURS} h remaining`,
    value: "No discount",
  },
];

export function DiscountRulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <SectionCard
      title="Discount rules and assumptions"
      description="Demo thresholds and the demand assumption behind every estimate on this page"
      action={
        <button
          type="button"
          aria-expanded={open}
          aria-controls="discount-rules-body"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          {open ? "Collapse" : "Expand"}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      }
    >
      {open && (
        <div id="discount-rules-body" className="flex flex-col gap-5 text-sm">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Discount thresholds
            </h3>
            <dl className="mt-3 flex flex-col gap-2">
              {THRESHOLDS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-2"
                >
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="text-right font-medium text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assumed demand response
            </h3>
            <p className="mt-2 text-foreground">
              {percent(CLEARANCE_SELL_THROUGH)} of unallocated stock in a discount batch is assumed to
              sell at the discounted price. No demand-response model is
              connected, so this is a planning assumption, not an observed
              result.
            </p>
          </div>

          <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
            <li>A discount does not extend shelf life or make an infeasible delivery feasible.</li>
            <li>
              Potential revenue is not recovered revenue. Plan totals include only allocations
              that already use a discounted price.
            </li>
            <li>
              Redirect means a destination in the selected plan has spare demand and capacity,
              and enough shelf life remains on arrival.
            </li>
            <li>
              Stock with no feasible sale is shown as unsellable. The page does not assume every
              batch can be rescued.
            </li>
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
