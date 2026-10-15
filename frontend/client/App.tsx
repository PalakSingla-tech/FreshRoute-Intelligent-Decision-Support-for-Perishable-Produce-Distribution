import "./global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/freshroute/ThemeContext";
import { Layout } from "@/components/freshroute/Layout";
import DiscountsPage from "./pages/DiscountsPage";
import DistributionPage from "./pages/DistributionPage";
import Index from "./pages/Index";
import InventoryPage from "./pages/InventoryPage";
import NotFound from "./pages/NotFound";
import ReportsPage from "./pages/ReportsPage";
import ScenariosPage from "./pages/ScenariosPage";

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/distribution" element={<DistributionPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
