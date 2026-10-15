import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  FileBarChart,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  SlidersHorizontal,
  Sprout,
  Sun,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";
import { useTheme } from "./ThemeContext";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Operations Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", to: "/inventory", icon: Boxes },
  { label: "Distribution Plan", to: "/distribution", icon: Route },
  { label: "Discounts", to: "/discounts", icon: Tag },
  { label: "Scenario Simulation", to: "/scenarios", icon: SlidersHorizontal },
  { label: "Reports", to: "/reports", icon: FileBarChart },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-surface/90 backdrop-blur-xl",
        !collapsed && "lg:w-64",
      )}
    >
      {/* BRAND & SIDEBAR TOGGLE COMBINED IN ONE SECTION */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border transition-all duration-200",
          collapsed
            ? "flex-col justify-center gap-1 py-2 px-1"
            : "justify-between px-3.5",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoMark className="transition-transform duration-300 hover:scale-110 shrink-0" />
          {!collapsed && (
            <div className="hidden lg:flex flex-col min-w-0">
              <span className="truncate text-base font-bold tracking-tight text-foreground font-heading leading-tight">
                FreshRoute
              </span>
              <span className="truncate text-[10px] font-semibold tracking-wide text-primary leading-tight">
                Perishable Logistics
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "inline-flex items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            collapsed ? "h-6 w-6 mt-0.5" : "h-8 w-8 ml-auto",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-1.5 px-2 py-4",
          !collapsed && "lg:px-3",
        )}
      >
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center justify-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                !collapsed && "lg:justify-start lg:px-3",
                isActive
                  ? "bg-primary/15 text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-0.5",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "hidden truncate",
                    !collapsed && "lg:inline",
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Daytime Farm-Fresh mode" : "Switch to Botanical Dark mode"}
          title={isDark ? "Switch to Daytime Farm-Fresh mode" : "Switch to Botanical Dark mode"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-center text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-secondary",
            !collapsed && "lg:justify-start lg:px-3",
          )}
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <span className={cn("hidden truncate", !collapsed && "lg:inline")}>
                Daytime Fresh
              </span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className={cn("hidden truncate", !collapsed && "lg:inline")}>
                Botanical Dark
              </span>
            </>
          )}
        </button>

        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-2 text-center text-xs font-medium text-emerald-400 shadow-sm",
            !collapsed && "lg:justify-start lg:px-3",
          )}
          title="Demo Dataset: Punjab Produce Network"
        >
          <Sprout className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className={cn("hidden truncate font-medium", !collapsed && "lg:inline")}>
            Punjab Produce Network
          </span>
        </div>
      </div>
    </aside>
  );
}
