import { useState } from "react";
import { ChevronDown, ChevronUp, Sun, ThermometerSnowflake, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClimateNode {
  id: string;
  location: string;
  produce: string;
  ambientTemp: string;
  coldChainStatus: string;
  reeferActive: boolean;
  statusTone: "success" | "warning";
}

const CLIMATE_NODES: ClimateNode[] = [
  {
    id: "abohar",
    location: "Abohar Hub",
    produce: "Kinnow / Citrus",
    ambientTemp: "29°C",
    coldChainStatus: "Cold Storage 84% full",
    reeferActive: true,
    statusTone: "success",
  },
  {
    id: "malerkotla",
    location: "Malerkotla Cluster",
    produce: "Vegetables / Tomatoes",
    ambientTemp: "31°C",
    coldChainStatus: "Fast dispatch queue",
    reeferActive: true,
    statusTone: "warning",
  },
  {
    id: "gt-road",
    location: "GT Road (NH-44)",
    produce: "Transit Corridor",
    ambientTemp: "34°C (Peak Heat)",
    coldChainStatus: "Reefer Temp: 4.2°C Locked",
    reeferActive: true,
    statusTone: "success",
  },
  {
    id: "ludhiana",
    location: "Ludhiana Mandi",
    produce: "Wholesale Terminal",
    ambientTemp: "32°C",
    coldChainStatus: "Unloading bay ready",
    reeferActive: false,
    statusTone: "success",
  },
];

export function AgriClimateTicker({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/70 p-2.5 backdrop-blur-md text-xs shadow-sm transition-all",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-warning animate-[spin_20s_linear_infinite]" aria-hidden="true" />
          <span className="font-bold text-foreground font-heading">Punjab Agri-Climate &amp; Reefer Cold-Chain</span>
          <span className="hidden sm:inline rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
            Live Field Telemetry
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-expanded={!collapsed}
          title={collapsed ? "Expand Agri-Climate Telemetry" : "Collapse Agri-Climate Telemetry"}
        >
          <span>{collapsed ? "Show Telemetry" : "Minimize"}</span>
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/60 overflow-x-auto">
          {CLIMATE_NODES.map((node) => (
            <div
              key={node.id}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-surface/80 px-2.5 py-1 text-xs shrink-0 transition-all hover:border-primary/40 hover:shadow-xs"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  node.statusTone === "success" ? "bg-emerald-400" : "bg-amber-400",
                  "animate-pulse",
                )}
                aria-hidden="true"
              />
              <span className="font-semibold text-foreground">{node.location}</span>
              <span className="text-muted-foreground">({node.produce})</span>
              <span className="font-mono font-medium text-warning">{node.ambientTemp}</span>
              <span className="text-muted-foreground">·</span>
              {node.reeferActive ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <ThermometerSnowflake className="h-3 w-3" aria-hidden="true" />
                  {node.coldChainStatus}
                </span>
              ) : (
                <span className="text-muted-foreground text-[11px]">{node.coldChainStatus}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
