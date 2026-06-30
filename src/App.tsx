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

import Reports from "./pages/modules/Reports";
import AIAnalyst from "./AIAnalyst";
import CoreAnalysis from "./pages/modules/CoreAnalysis";
import RealtimeDashboard from "./pages/modules/RealtimeDashboard";
import LiveWellCardDemo from "./pages/modules/LiveWellCardDemo";
import WellLiveDashboard from "./pages/modules/WellLiveDashboard";
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
import WellAnalysisPipeline from "./pages/modules/WellAnalysisPipeline";
import DataPipeline from "./pages/modules/DataPipeline";
import DataImport from "./pages/modules/DataImport";
import DataSecurity from "./pages/modules/DataSecurity";
import Automation from "./pages/modules/Automation";
import OklahomaPilot from "./pages/modules/OklahomaPilot";
import AnalysisGuide from "./pages/modules/AnalysisGuide";
import FormationCodesReference from "./pages/modules/FormationCodesReference";
import ProductionHistory from "./pages/modules/ProductionHistory";
import ReservesMapPage from "./pages/modules/ReservesMapPage";
import AnalysisReports from "./pages/modules/AnalysisReports";
import AIEOROptimization from "./pages/modules/AIEOROptimization";
import DroneModule from "./pages/modules/DroneModule";
import FieldTwin from "./pages/modules/FieldTwin";
import DigitalTwin from "./pages/modules/DigitalTwin";
import NvidiaInception from "./pages/NvidiaInception";
import NvidiaShowcase from "./pages/NvidiaShowcase";
import NvidiaCosmos from "./pages/NvidiaCosmos";
import AWSActivate from "./pages/AWSActivate";
import InvestorDeck from "./pages/InvestorDeck";
import TechnicalSpec from "./pages/TechnicalSpec";
import BudgetOverview from "./pages/BudgetOverview";
import CounterProposal from "./pages/CounterProposal";
import MVPScope from "./pages/MVPScope";
import TechnicalResponse from "./pages/TechnicalResponse";
import NvidiaCapitalConnectLetter from "./pages/NvidiaCapitalConnectLetter";
import DiversifiedEnergyProposal from "./pages/DiversifiedEnergyProposal";
import KazakhstanTemplate from "./pages/KazakhstanTemplate";
import KazakhstanProcess from "./pages/KazakhstanProcess";
import CosmosDemo from "./pages/CosmosDemo";
import CosmosSimulatorPage from "./pages/CosmosSimulator";
import CosmosSimulatorEmbed from "./pages/CosmosSimulatorEmbed";
import CosmosRealTest from "./pages/CosmosRealTest";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FluidPhysicsSimulation from "./pages/FluidPhysicsSimulation";
import Innovation from "./pages/Innovation";
import AlbertaPetrel from "./pages/modules/AlbertaPetrel";
import AdminImport from "./pages/modules/AdminImport";
import BayesianDCA from "./pages/modules/BayesianDCA";
import AramcoPilot from "./pages/modules/AramcoPilot";
import OCRWellLog from "./pages/OCRWellLog";
import IngestRestorationDiagnostics from "./pages/modules/IngestRestorationDiagnostics";
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
            
            <Route path="reports" element={<Reports />} />
            <Route path="core-analysis" element={<CoreAnalysis />} />
            <Route path="realtime" element={<RealtimeDashboard />} />
           <Route path="live-well-card" element={<LiveWellCardDemo />} />
            <Route path="well-live-dashboard" element={<WellLiveDashboard />} />
            <Route path="telemetry-architecture" element={<TelemetryArchitecture />} />
            <Route path="eor-optimization" element={<EOROptimization />} />
             <Route path="ml-training" element={<MLTraining />} />
             <Route path="geophysical" element={<GeophysicalExpertise />} />
             <Route path="field-scanning" element={<FieldScanning />} />
             <Route path="data-classification" element={<DataClassification />} />
             <Route path="ocr" element={<OCRWellLog />} />
             <Route path="cumulative-analysis" element={<CumulativeAnalysis />} />
             <Route path="multi-tenant" element={<MultiTenantDemo />} />
             <Route path="saas-business-model" element={<SaaSBusinessModel />} />
             <Route path="architecture" element={<Architecture />} />
             <Route path="well-analysis" element={<WellAnalysisPipeline />} />
             <Route path="data-pipeline" element={<DataPipeline />} />
             <Route path="data-import" element={<DataImport />} />
             <Route path="data-security" element={<DataSecurity />} />
             <Route path="automation" element={<Automation />} />
             <Route path="oklahoma-pilot" element={<OklahomaPilot />} />
             <Route path="analysis-guide" element={<AnalysisGuide />} />
             <Route path="formation-codes" element={<FormationCodesReference />} />
             <Route path="production-history" element={<ProductionHistory />} />
             <Route path="reserves-map" element={<ReservesMapPage />} />
             <Route path="analysis-reports" element={<AnalysisReports />} />
              <Route path="ai-eor-optimization" element={<AIEOROptimization />} />
              <Route path="ai-analyst" element={<AIAnalyst />} />
              <Route path="drone-module" element={<DroneModule />} />
              <Route path="field-twin" element={<FieldTwin />} />
              <Route path="digital-twin" element={<DigitalTwin />} />
              <Route path="digital-twin/:wellSlug" element={<DigitalTwin />} />
              <Route path="bayesian-dca" element={<BayesianDCA />} />
              <Route path="aramco-pilot" element={<AramcoPilot />} />
              <Route path="ingest-diagnostics" element={<IngestRestorationDiagnostics />} />

          </Route>
           <Route path="/nvidia-inception" element={<NvidiaInception />} />
           <Route path="/nvidia-showcase" element={<NvidiaShowcase />} />
           <Route path="/nvidia-cosmos" element={<NvidiaCosmos />} />
           {/* SGOM Physics Simulator aliases (preferred public URLs) */}
           <Route path="/sgom-physics" element={<NvidiaCosmos />} />
           <Route path="/sgom-physics-demo" element={<CosmosDemo />} />
           <Route path="/sgom-physics-simulator" element={<CosmosSimulatorPage />} />
           <Route path="/sgom-physics-test" element={<CosmosRealTest />} />
           <Route path="/aws-activate" element={<AWSActivate />} />
           <Route path="/investor-deck" element={<InvestorDeck />} />
           <Route path="/docs" element={<TechnicalSpec />} />
           <Route path="/budget" element={<BudgetOverview />} />
           <Route path="/counter-proposal" element={<CounterProposal />} />
            <Route path="/mvp-scope" element={<MVPScope />} />
            <Route path="/technical-response" element={<TechnicalResponse />} />
            <Route path="/nvidia-capital-connect" element={<NvidiaCapitalConnectLetter />} />
             <Route path="/diversified-energy-proposal" element={<DiversifiedEnergyProposal />} />
             <Route path="/kazakhstan-template" element={<KazakhstanTemplate />} />
              <Route path="/kazakhstan-process" element={<KazakhstanProcess />} />
               <Route path="/cosmos-demo" element={<CosmosDemo />} />
               <Route path="/cosmos-simulator" element={<CosmosSimulatorPage />} />
               <Route path="/cosmos-simulator-embed" element={<CosmosSimulatorEmbed />} />
               <Route path="/cosmos-real-test" element={<CosmosRealTest />} />
               <Route path="/fluid-simulation" element={<FluidPhysicsSimulation />} />
               <Route path="/innovation" element={<Innovation />} />
               <Route path="/alberta-petrel" element={<AlbertaPetrel />} />
               <Route path="/admin/import" element={<AdminImport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
