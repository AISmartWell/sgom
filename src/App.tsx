import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import DataCollection from "./pages/modules/DataCollection";
import GeologicalAnalysis from "./pages/modules/GeologicalAnalysis";
import WellSelection from "./pages/modules/WellSelection";
import Simulation from "./pages/modules/Simulation";
import Financial from "./pages/modules/Financial";
import SPTTreatment from "./pages/modules/SPTTreatment";
import Reports from "./pages/modules/Reports";
import CoreAnalysis from "./pages/modules/CoreAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="data-collection" element={<DataCollection />} />
            <Route path="geological-analysis" element={<GeologicalAnalysis />} />
            <Route path="well-selection" element={<WellSelection />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="financial" element={<Financial />} />
            <Route path="spt-treatment" element={<SPTTreatment />} />
            <Route path="reports" element={<Reports />} />
            <Route path="core-analysis" element={<CoreAnalysis />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
