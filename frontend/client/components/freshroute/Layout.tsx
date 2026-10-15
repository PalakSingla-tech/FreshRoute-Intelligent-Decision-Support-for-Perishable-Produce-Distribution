import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { PlanProvider } from "./PlanContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useTheme } from "./ThemeContext";
import { AgriFieldBackdrop } from "./AgriFieldBackdrop";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();

  return (
    <PlanProvider>
      <div className="min-h-screen bg-canvas text-foreground transition-colors duration-200">
        <AgriFieldBackdrop />
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
        <div
          className={cn(
            "relative ml-16 flex min-h-screen min-w-0 flex-col transition-all duration-300",
            !sidebarCollapsed && "lg:ml-64",
          )}
        >
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 xl:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <Toaster
          theme={theme}
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            },
          }}
        />
      </div>
    </PlanProvider>
  );
}
