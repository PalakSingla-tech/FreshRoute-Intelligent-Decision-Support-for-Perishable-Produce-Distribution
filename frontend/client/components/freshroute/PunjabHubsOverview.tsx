import { Boxes, MapPin, Sparkles, Sprout, Thermometer, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubData {
  id: string;
  name: string;
  district: string;
  specialty: string;
  emoji: string;
  activeStockKg: number;
  coldChainTemp: string;
  primaryMarket: string;
  urgencyLevel: "normal" | "priority" | "critical";
}

const HUBS: HubData[] = [
  {
    id: "abohar",
    name: "Abohar Citrus Packhouse",
    district: "Fazilka District",
    specialty: "Kinnow Mandarin & Oranges",
    emoji: "🍊",
    activeStockKg: 3400,
    coldChainTemp: "4°C Controlled",
    primaryMarket: "Delhi Azadpur & Ludhiana",
    urgencyLevel: "priority",
  },
  {
    id: "malerkotla",
    name: "Malerkotla Vegetable Yard",
    district: "Malerkotla District",
    specialty: "Tomatoes, Peppers & Greens",
    emoji: "🍅",
    activeStockKg: 2850,
    coldChainTemp: "7°C Pre-Cooled",
    primaryMarket: "Ludhiana Mandi & Patiala",
    urgencyLevel: "critical",
  },
  {
    id: "jalandhar",
    name: "Jalandhar Agri Logistics Hub",
    district: "Doaba Belt",
    specialty: "Potatoes, Onions & Roots",
    emoji: "🥔",
    activeStockKg: 4200,
    coldChainTemp: "12°C Ambient Ventilated",
    primaryMarket: "Amritsar Mandi & Bathinda",
    urgencyLevel: "normal",
  },
];

export function PunjabHubsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {HUBS.map((hub) => (
        <div
          key={hub.id}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg backdrop-blur-xl"
        >
          {/* Subtle top indicator bar */}
          <span
            className={cn(
              "absolute inset-x-0 top-0 h-1 transition-opacity",
              hub.urgencyLevel === "critical"
                ? "bg-danger"
                : hub.urgencyLevel === "priority"
                  ? "bg-warning"
                  : "bg-primary",
            )}
            aria-hidden="true"
          />

          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {hub.emoji}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-tight font-heading">
                    {hub.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                    <span>{hub.district}</span>
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  hub.urgencyLevel === "critical"
                    ? "bg-danger/15 text-danger border border-danger/30"
                    : hub.urgencyLevel === "priority"
                      ? "bg-warning/15 text-amber-400 border border-warning/30"
                      : "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                {hub.urgencyLevel === "critical"
                  ? "FEFO Alert"
                  : hub.urgencyLevel === "priority"
                    ? "Active Dispatch"
                    : "Intake Steady"}
              </span>
            </div>

            <p className="mt-3 text-xs font-medium text-foreground/90">
              Produce: <span className="text-muted-foreground">{hub.specialty}</span>
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-2.5 text-xs">
              <div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Boxes className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  Active Stored
                </p>
                <p className="font-mono font-bold text-foreground mt-0.5">
                  {hub.activeStockKg.toLocaleString("en-IN")} kg
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  Storage State
                </p>
                <p className="font-mono font-medium text-emerald-400 mt-0.5 truncate">
                  {hub.coldChainTemp}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Target: {hub.primaryMarket}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
