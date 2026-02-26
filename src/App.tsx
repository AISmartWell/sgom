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
import SPTProjection from "./pages/modules/SPTProjection";
import EconomicAnalysis from "./pages/modules/EconomicAnalysis";
import SPTParameters from "./pages/modules/SPTParameters";
import Reports from "./pages/modules/Reports";
import CoreAnalysis from "./pages/modules/CoreAnalysis";
import RealtimeDashboard from "./pages/modules/RealtimeDashboard";
import EOROptimization from "./pages/modules/EOROptimization";
  import MLTraining from "./pages/modules/MLTraining";
import GeophysicalExpertise from "./pages/modules/GeophysicalExpertise";
import FieldScanning from "./pages/modules/FieldScanning";
import DataClassification from "./pages/modules/DataClassification";
import CumulativeAnalysis from "./pages/modules/CumulativeAnalysis";
import MultiTenantDemo from "./pages/modules/MultiTenantDemo";
import TelemetryArchitecture from "./pages/modules/TelemetryArchitecture";
import SaaSBusinessModel from "./pages/modules/SaaSBusinessModel";
import Architecture from "./pages/modules/Architecture";
import NvidiaInception from "./pages/NvidiaInception";
import AWSActivate from "./pages/AWSActivate";
import InvestorDeck from "./pages/InvestorDeck";
import TechnicalSpec from "./pages/TechnicalSpec";
import BudgetOverview from "./pages/BudgetOverview";
import CounterProposal from "./pages/CounterProposal";
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
            <Route path="spt-projection" element={<SPTProjection />} />
            <Route path="economic-analysis" element={<EconomicAnalysis />} />
            <Route path="spt-parameters" element={<SPTParameters />} />
            <Route path="reports" element={<Reports />} />
            <Route path="core-analysis" element={<CoreAnalysis />} />
            <Route path="realtime" element={<RealtimeDashboard />} />
            <Route path="telemetry-architecture" element={<TelemetryArchitecture />} />
            <Route path="eor-optimization" element={<EOROptimization />} />
             <Route path="ml-training" element={<MLTraining />} />
             <Route path="geophysical" element={<GeophysicalExpertise />} />
             <Route path="field-scanning" element={<FieldScanning />} />
             <Route path="data-classification" element={<DataClassification />} />
             <Route path="cumulative-analysis" element={<CumulativeAnalysis />} />
             <Route path="multi-tenant" element={<MultiTenantDemo />} />
             <Route path="saas-business-model" element={<SaaSBusinessModel />} />
             <Route path="architecture" element={<Architecture />} />
          </Route>
           <Route path="/nvidia-inception" element={<NvidiaInception />} />
           <Route path="/aws-activate" element={<AWSActivate />} />
           <Route path="/investor-deck" element={<InvestorDeck />} />
           <Route path="/docs" element={<TechnicalSpec />} />
           <Route path="/budget" element={<BudgetOverview />} />
           <Route path="/counter-proposal" element={<CounterProposal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
