import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Database, Globe, Cpu, Shield, Layers, BarChart3, MapPin, Beaker, Activity, DollarSign, Wrench, Brain, Eye, Radar, Atom } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <Card className="glass-card border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
      {children}
    </CardContent>
  </Card>
);

const TechnicalSpec = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Technical Specification
            </h1>
            <p className="text-muted-foreground mt-1">AI Smart Well Platform — Developer Specification</p>
          </div>
          <Badge className="ml-auto text-xs" variant="outline">v4.0 — April 2026</Badge>
        </div>

        <Separator />

        {/* 1. Project Overview */}
        <Section icon={Globe} title="1. Project Overview">
          <p><strong>Name:</strong> AI Smart Well (AI Smart Well Inc. — USA)</p>
          <p><strong>Purpose:</strong> Multi-tenant SaaS platform for AI-powered oil & gas analytics. 9-stage well analysis pipeline, production optimization, geological modeling, financial planning, and Enhanced Oil Recovery (EOR) using patented SPT (Slot Perforation Technology, US Patent 8,863,823).</p>
          <p><strong>Target Audience:</strong> Oil & gas field operators, service companies, petroleum engineers, geologists, investors.</p>
          <p><strong>Website:</strong> <a href="https://www.aismartwell.com" className="text-primary hover:underline" target="_blank" rel="noreferrer">www.aismartwell.com</a></p>
          <p><strong>Core Pipeline:</strong> Stage 1 (Field Scanning) → Stage 2 (Data Classification) → Stage 3 (Core Analysis) → Stage 4 (Cumulative Analysis) → Stage 5 (Seismic Interpretation) → Stage 6 (SPT Projection) → Stage 7 (Economic Analysis) → Stage 8 (Geophysical Expertise) → Stage 9 (EOR Optimization)</p>
        </Section>

        {/* 2. Technology Stack */}
        <Section icon={Layers} title="2. Technology Stack">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Frontend</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>React 18 + TypeScript</li>
                <li>Vite 5 (build tool)</li>
                <li>Tailwind CSS v3 + shadcn/ui</li>
                <li>React Router v6</li>
                <li>Recharts (charting — requires explicit minHeight)</li>
                <li>React Three Fiber / Three.js (3D visualizations)</li>
                <li>Leaflet + react-leaflet 4.x (maps)</li>
                <li>Framer Motion (animations)</li>
                <li>TanStack Query (request caching)</li>
                <li>Remotion (programmatic video generation)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Backend (Lovable Cloud)</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>PostgreSQL — database (no PostGIS; numeric lat/long)</li>
                <li>Row Level Security (RLS) — multi-tenant isolation via company_id</li>
                <li>Supabase Auth — email authentication (sign-up disabled)</li>
                <li>Edge Functions (Deno) — server logic (12 functions)</li>
                <li>Supabase Storage — file storage (core-images, seismic-images)</li>
                <li>Realtime — database change subscriptions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">AI / ML</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Gemini 2.5 Flash (via Lovable AI) — core analysis, seismic interpretation, report generation</li>
                <li>NVIDIA NIM (nemotron-nano-12b-v2-vl) — seismic CV analysis (with Gemini fallback)</li>
                <li>NVIDIA Cosmos — Predict (video forecasting), Transfer (domain adaptation), Reason (physics reasoning)</li>
                <li>Computer Vision — rock classification, seismic fault/horizon detection</li>
                <li>Quantum-Inspired Monte Carlo (QAE) — economic risk assessment</li>
                <li>ML well ranking — multi-criteria scoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">External APIs</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Oklahoma Corporation Commission (OCC) ArcGIS REST API — well data</li>
                <li>Texas Railroad Commission (RRC) — well data</li>
                <li>ESRI World Imagery — satellite tiles for field scanning</li>
                <li>Google Earth (KML export)</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 3. System Architecture */}
        <Section icon={Cpu} title="3. System Architecture">
          <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre">
{`┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard │  │ Modules  │  │ 3D Views │  │  Maps   │ │
│  │          │  │ (9-stage)│  │ (Three)  │  │(Leaflet)│ │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────┬────┘ │
│        └──────────────┴──────────────┴────────────┘      │
│                         │ Supabase SDK                   │
├─────────────────────────┼───────────────────────────────┤
│              BACKEND (Lovable Cloud)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │ Edge Funcs   │  │   Storage     │  │
│  │  14 tables    │  │ (12 funcs)   │  │  (core imgs   │  │
│  │  + RLS        │  │  AI/ML proxy │  │   seismic)    │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                         │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │            External AI & Data APIs                  │ │
│  │  Gemini 2.5 · NVIDIA NIM · OCC ArcGIS · TX RRC    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘`}
          </pre>
        </Section>

        {/* 4. Database */}
        <Section icon={Database} title="4. Database Structure">
          <h4 className="font-semibold text-foreground mb-3">All Tables (14 total)</h4>
          <div className="space-y-4">
            {[
              { table: "wells", desc: "Core well records — API number, operator, coordinates, depth, formation, production, status", cols: 22, rls: "CRUD by company_id", fk: "companies" },
              { table: "companies", desc: "Operator organizations", cols: 4, rls: "SELECT/UPDATE/DELETE by membership, INSERT by authenticated", fk: "—" },
              { table: "user_companies", desc: "Multi-tenant junction: maps users ↔ companies", cols: 4, rls: "CRUD by user_id = auth.uid()", fk: "companies" },
              { table: "user_roles", desc: "Role-based access control (admin, investor). Security definer function has_role() for RLS policies", cols: 4, rls: "SELECT by authenticated", fk: "auth.users" },
              { table: "production_history", desc: "Monthly production data: oil (bbl), gas (mcf), water (bbl), days on", cols: 8, rls: "CRUD by company_id", fk: "companies, wells" },
              { table: "well_logs", desc: "Digitized well logs: GR, resistivity, porosity, Sw, SP, density, neutron_porosity. Supports PDF-digitized and LAS-imported data", cols: 12, rls: "SELECT/INSERT/DELETE by company_id", fk: "companies, wells" },
              { table: "well_perforations", desc: "Perforation records: depth intervals, hole diameter, shots/ft, phasing, status, date. Used in Net Pay visualization and missed pay detection", cols: 12, rls: "CRUD by company_id", fk: "companies, wells" },
              { table: "well_analyses", desc: "9-stage pipeline results (JSONB stage_results), batch tracking", cols: 8, rls: "SELECT/INSERT by company_id, DELETE by user_id", fk: "companies, wells" },
              { table: "well_alerts", desc: "Auto-generated alerts: production drops, water cut thresholds, status changes", cols: 10, rls: "CRUD by company_id", fk: "companies, wells" },
              { table: "core_images", desc: "Uploaded core sample images with depth, formation, rock_type metadata", cols: 14, rls: "CRUD by company_id/user_id", fk: "companies, wells" },
              { table: "core_analyses", desc: "AI analysis results from core image CV (lithology, porosity, minerals)", cols: 8, rls: "CRUD by company_id/user_id", fk: "companies" },
              { table: "seismic_images", desc: "Uploaded 2D/3D seismic section images with type, formation metadata", cols: 11, rls: "CRUD by company_id/user_id", fk: "companies, wells" },
              { table: "seismic_analyses", desc: "CV interpretation results: faults, horizons, anomalies, fluid contacts (JSONB)", cols: 9, rls: "SELECT/INSERT by company_id, DELETE by user_id", fk: "companies, seismic_images, wells" },
              { table: "formation_codes", desc: "Reference: state formation codes (KDOR/KID), basins, counties", cols: 12, rls: "SELECT only (read-only reference)", fk: "—" },
            ].map((t) => (
              <div key={t.table} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-primary font-mono text-sm font-semibold">public.{t.table}</code>
                  <Badge variant="outline" className="text-[10px]">{t.cols} cols</Badge>
                  <Badge variant="secondary" className="text-[10px]">RLS ✓</Badge>
                </div>
                <p className="text-xs mt-1">{t.desc}</p>
                <div className="flex gap-4 mt-1.5 text-[10px] text-muted-foreground">
                  <span><strong>RLS:</strong> {t.rls}</span>
                  <span><strong>FK →</strong> {t.fk}</span>
                </div>
              </div>
            ))}
          </div>

          <h4 className="font-semibold text-foreground mb-2 mt-6">Database Functions & Triggers</h4>
          <div className="space-y-2">
            {[
              { name: "has_role(_user_id, _role)", desc: "SECURITY DEFINER: checks if user has a given role (admin/investor). Used in RLS policies to prevent recursive checks." },
              { name: "update_updated_at_column()", desc: "Auto-update updated_at on row modification" },
              { name: "check_well_production_alerts()", desc: "SECURITY DEFINER trigger: generates alerts on production drops >20%, water cut >70%, status changes" },
              { name: "auto_link_core_image_to_well()", desc: "SECURITY DEFINER trigger: auto-links core images to wells by API number on insert" },
            ].map((fn) => (
              <div key={fn.name} className="p-2 rounded bg-muted/20 border border-border/30">
                <code className="text-xs text-primary font-mono">{fn.name}</code>
                <p className="text-[11px] mt-0.5">{fn.desc}</p>
              </div>
            ))}
          </div>

          <h4 className="font-semibold text-foreground mb-2 mt-6">Enums</h4>
          <div className="p-2 rounded bg-muted/20 border border-border/30">
            <code className="text-xs text-primary font-mono">app_role</code>
            <span className="text-[11px] ml-2">= 'admin' | 'investor'</span>
          </div>

          <h4 className="font-semibold text-foreground mb-2 mt-6">Storage Buckets</h4>
          <div className="flex gap-3 flex-wrap">
            {[
              { name: "core-images", desc: "Core sample photos (public)", public: true },
              { name: "seismic-images", desc: "2D/3D seismic sections (public)", public: true },
            ].map((b) => (
              <div key={b.name} className="p-2 rounded bg-muted/20 border border-border/30 flex-1 min-w-[200px]">
                <code className="text-xs text-primary font-mono">{b.name}</code>
                <Badge variant="outline" className="text-[10px] ml-2">{b.public ? "public" : "private"}</Badge>
                <p className="text-[11px] mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 4.1 Multi-Tenant Architecture */}
        <Section icon={Shield} title="4.1 Multi-Tenant Data Isolation">
          <h4 className="font-semibold text-foreground mb-2">Architecture Overview</h4>
          <p>Enterprise-grade multi-tenant data isolation. Each organization's well data, analysis results, and configurations are completely isolated at the database level via RLS policies using <code className="text-primary">company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())</code>.</p>
          
          <h4 className="font-semibold text-foreground mb-2 mt-4">RBAC System</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>admin</strong> — full platform access (default role for unknown users)</li>
            <li><strong>investor</strong> — restricted access to Dashboard, Well Screening Pilot, Investor Deck, Budget, MVP Scope, and Documentation only</li>
          </ul>

          <h4 className="font-semibold text-foreground mb-2 mt-4">Default Company Initialization</h4>
          <p>On first authentication, users are assigned to a "Default Company" (ID: <code className="text-primary">00000000-0000-0000-0000-000000000001</code>). Sign-up is disabled — login only.</p>
        </Section>

        {/* 5. Modules */}
        <Section icon={Layers} title="5. Functional Modules (30+)">
          <div className="space-y-4">
            {[
               { icon: "🛰️", name: "Field Scanning (Stage 1)", route: "/dashboard/field-scanning",
                 desc: "Automated field surveillance with configurable schedule (daily/weekly/monthly). Loads ESRI World Imagery with GIS grid overlay. Scans 24 predefined field squares across Permian and Anadarko basins. Flags low-productive wells (<10 bbl/day, water cut >60%) and purges closed/plugged wells. 5-stage pipeline: Initialize → Scan Fields → Analyze Wells → Flag Low-Prod → Remove Closed." },
               { icon: "📂", name: "Data Classification (Stage 2)", route: "/dashboard/data-classification",
                 desc: "Download, parse, and classify well data into structured categories. Processes monthly production history, initial production rates, casing/tubing pressure data, accident reports, and productive interval transitions. Real-time pipeline visualization with quality metrics per category. AI auto-fill rules for missing data." },
               { icon: "🔬", name: "Core Analysis (Stage 3)", route: "/dashboard/core-analysis",
                 desc: "Core sample image upload. AI analysis via Gemini: lithology determination, porosity, texture, mineral composition. Interactive CV Demo: multi-stage pipeline (preprocessing, edge detection, feature extraction, segmentation, classification) with real core sample images. Validation Panel: compares AI results against formation-specific bounds (log k scale, regex parsing). Three CV modes: Segmentation, Fractures, Mineralogy." },
               { icon: "📈", name: "Cumulative Analysis (Stage 4)", route: "/dashboard/cumulative-analysis",
                 desc: "Mathematical-graphical reserve calculation using DCA. IOIP = A × h × φ × S_o / B_o (volumetric method). N_r = IOIP − N_p (remaining reserves). RF = (N_p / IOIP) × 100. q(t) = q_0 × e^(−D×t) (exponential decline). Economic Limit Panel: calculates abandonment rate where revenue equals OPEX. 60-month forecast visualization." },
               { icon: "🌐", name: "Seismic Interpretation (Stage 5)", route: "/dashboard/geological-analysis",
                 desc: "3D geological model (Three.js). Seismic sections with CV analysis (NVIDIA NIM + Gemini fallback): fault detection, horizon mapping, anomaly identification, fluid contacts. Well logs, cross-sections, AI-generated geological reports. Bypassed Reserves Panel for missed pay detection." },
               { icon: "🚀", name: "SPT Projection (Stage 6)", route: "/dashboard/spt-projection",
                 desc: "Redevelopment potential analysis and well screening for SPT treatment. Multi-stage filtering: Water Cut Filter (exclude ≥60%) → Inflow Estimation (25–35 bbl/day) → Reserve Analysis (>500k bbl) → Timeline (≥15yr). MCDA ranking with inverted Water Cut & GOR. Projected Inflow = (Current × 2.0–2.5) + Treatment Effect (5–10 bbl/day). ROI recovery 7–8 months." },
               { icon: "💵", name: "Economic Analysis (Stage 7)", route: "/dashboard/economic-analysis",
                 desc: "Full economic evaluation with interactive scenario modeling. Per-well and portfolio metrics: ROI (5-year), payback period, annual gross/net profit. Monte Carlo simulation (classical + Quantum-Inspired QAE). Tornado Chart sensitivity analysis. Cumulative net profit projection (60-month). Net Profit = (Added Production × Oil Price − OPEX/bbl) × 365 × Timeline − Treatment Cost." },
               { icon: "⚛️", name: "Quantum Monte Carlo (QAE)", route: "/dashboard/economic-analysis",
                 desc: "Quantum Amplitude Estimation for risk assessment within Economic Analysis module. Simulates quadratic speedup O(1/N) vs classical O(1/√N). Interactive controls: Qubits (2⁸–2¹⁴ states), Oil Price volatility, CAPEX volatility. ROI distribution histogram with tail-end risk amplification. Convergence rate comparison chart. 3-step algorithm: State Preparation → Grover Amplification → Measurement." },
               { icon: "📊", name: "Geophysical Expertise (Stage 8)", route: "/dashboard/geophysical",
                 desc: "9-step well log interpretation (Schlumberger methodology). Lithology (GR: Linear vs Larionov Vshale), Fluid ID (Resistivity ≥10 Ω·m = HC), DEN-NPHI Crossover, Porosity (8% cutoff), Archie Equation (a=1, m=2, n=2, Rw=0.04), Ko Ko Rules (4-curve deflection), Net Pay & Missed Pay (φ_eff>8%, Sw<60%, Vsh<40%). Supports LAS 2.0 import and PDF log digitization." },
               { icon: "🧠", name: "EOR Optimization (Stage 9)", route: "/dashboard/eor-optimization",
                 desc: "Final aggregator combining data from 8 prior stages. 7-stage automated workflow with interactive pipeline. Prospect wells database with status tracking. Business logic: SPT inflow 25–35 bbl/day, 15+ year potential = promising. Includes SPT Parameters tab: Maxxwell Production technology specs (Patent US 8,863,823), cutting speeds, slot dimensions, drainage area formulas." },
               { icon: "🤖", name: "AI Analyst", route: "/dashboard/ai-analyst",
                 desc: "AI-powered analytical assistant for natural language queries about well data, geological interpretation, and SPT recommendations. Powered by Claude via secure Edge Function proxy (spt-chat). Context-aware responses with MCDA scoring integration." },
               { icon: "🛢️", name: "Well Screening Pilot", route: "/dashboard/oklahoma-pilot",
                 desc: "Multi-state well screening pilot (TX, OK, KS, NM, CO, ND, WY). Filters by production rate, water cut, formation. Interactive map with analyzed wells table. Full 9-stage pipeline visualization per well. Timur equation constraints for permeability estimation." },
               { icon: "🎯", name: "AI Well Selection & Ranking", route: "/dashboard/well-selection",
                 desc: "ML-based well ranking by multiple criteria. Filter by county, type, operator. MCDA scoring with inverted Water Cut & GOR metrics." },
               { icon: "📡", name: "Data Collection & Integration", route: "/dashboard/data-collection",
                 desc: "Collect well data from OCC ArcGIS API (Oklahoma). Interactive Leaflet map. Export to KML for Google Earth. Detailed well viewing with nearby wells search (bounding box logic). Edge Function: fetch-wells, fetch-nearby-wells." },
               { icon: "📥", name: "Data Import", route: "/dashboard/data-import",
                 desc: "CSV upload for wells and production history. Manual well entry. API integration panel. Imported wells table with validation. Local-first lookup strategy for well registry." },
               { icon: "🗺️", name: "Reserves Map", route: "/dashboard/reserves-map",
                 desc: "Interactive Leaflet map showing remaining IOIP distribution across wells. Color-coded markers by reserve volume. Remaining reserves formula integration from Cumulative Analysis." },
               { icon: "📊", name: "Production History", route: "/dashboard/production-history",
                 desc: "Monthly production data visualization: oil (bbl), gas (mcf), water (bbl). CSV upload support. Decline curve overlay. Production history chart with multi-well comparison." },
               { icon: "🔍", name: "Formation Codes Reference", route: "/dashboard/formation-codes",
                 desc: "Searchable database of state formation codes (KDOR/KID — 10-digit Kansas Identification Number). Filter by state, basin, county. Read-only reference table." },
               { icon: "🔧", name: "SPT Treatment", route: "/dashboard/spt-treatment",
                 desc: "Interactive Siphon Pump Treatment technology demo (Patent US 8,863,823). Treatment process visualization. Effectiveness metrics. 5–10× inflow increase specifications." },
               { icon: "📋", name: "Analysis Reports", route: "/dashboard/analysis-reports",
                 desc: "Comprehensive analysis report generation aggregating results from all pipeline stages. Data export capabilities." },
               { icon: "📖", name: "Analysis Guide", route: "/dashboard/analysis-guide",
                 desc: "Step-by-step guide for the 9-stage analysis pipeline. Educational resource for platform users." },
               { icon: "⚡", name: "Reservoir Simulation", route: "/dashboard/simulation",
                 desc: "Reservoir behavior simulation. Production forecasting with pressure and saturation visualization. Longitudinal cross-section view." },
               { icon: "💰", name: "Financial Calculator", route: "/dashboard/financial",
                 desc: "ROI calculation for Maxxwell Production. NPV, IRR calculator. Well treatment cost analysis." },
               { icon: "📡", name: "Real-Time Monitor", route: "/dashboard/realtime",
                 desc: "Real-time well monitoring with WebSocket simulation. Critical indicator alerts (production drops >20%, water cut >70%)." },
               { icon: "🔗", name: "Telemetry Architecture & IoT Pricing", route: "/dashboard/telemetry-architecture",
                 desc: "End-to-end data pipeline from wellhead sensors to dashboard. 6-stage flow. IoT Pricing: Starter ($2,500 + $500/mo), Professional ($2,000 + $350/mo), Enterprise (custom). Hardware: $2,900–$5,400/well." },
               { icon: "🎓", name: "ML Training", route: "/dashboard/ml-training",
                 desc: "Machine learning model training on well data. Parameter tuning and process visualization." },
               { icon: "🏢", name: "Multi-Tenant Demo", route: "/dashboard/multi-tenant",
                 desc: "Interactive demonstration of multi-tenant architecture and data isolation. Company management, member stats, visual RLS policies." },
               { icon: "🔒", name: "Data Security", route: "/dashboard/data-security",
                 desc: "Data security architecture overview. Encryption, RLS policies, audit trails, and compliance visualization." },
               { icon: "⚡", name: "Automation Center", route: "/dashboard/automation",
                 desc: "Well monitoring automation with alert triggers. Production drop detection, water cut thresholds, status change tracking. Auto-linking and pipeline management." },
               { icon: "🔄", name: "Data Pipeline", route: "/dashboard/data-pipeline",
                 desc: "Data pipeline architecture visualization. ETL workflow from data ingestion to analysis output." },
               { icon: "🏗️", name: "Architecture", route: "/dashboard/architecture",
                 desc: "Platform architecture overview with system components, data flow, and integration diagrams." },
               { icon: "💼", name: "SaaS Business Model", route: "/dashboard/saas-business-model",
                 desc: "Hybrid SaaS pricing: Explorer ($2,000/mo + $350/well, ≤10 wells), Professional ($6,000/mo + $200/well, ≤50), Enterprise ($15,000/mo + $120/well, unlimited). 3-year projection: Y1 $0.6M → Y2 $2.2M → Y3 $5.8M ARR. ~80% gross margin." },
               { icon: "🌊", name: "Fluid Physics Simulation", route: "/fluid-simulation",
                 desc: "Interactive Canvas-based fluid dynamics simulation. Visualizes fluid behavior in reservoir conditions with physics engine (gravity, viscosity, particle interactions). Real-time parameter controls." },
               { icon: "🌐", name: "NVIDIA Cosmos Demo", route: "/cosmos-demo",
                 desc: "Three NVIDIA Cosmos modules: Predict (video forecasting for production trends), Transfer (domain adaptation from satellite to subsurface), Reason (physics-informed reasoning for reservoir behavior). Interactive demos with visualization." },
               { icon: "🚀", name: "AI EOR SPT Optimization", route: "/dashboard/ai-eor-optimization",
                 desc: "Unified AI-driven EOR optimization combining all pipeline stages with automated SPT well selection. Prospect database with real-time scoring." },
            ].map((mod) => (
              <div key={mod.name} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground">{mod.icon} {mod.name}</p>
                <p className="text-xs mt-1">{mod.desc}</p>
                <code className="text-[10px] text-primary/70">{mod.route}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Edge Functions */}
        <Section icon={Cpu} title="6. Edge Functions (12 total)">
          <div className="space-y-3">
            {[
              { name: "fetch-wells", desc: "Fetch well data from OCC ArcGIS REST API. Filter by county/type. Upsert to wells table.", input: "{ county?, wellType?, limit?, offset? }", output: "{ success, fetched, stored, skipped, sample }" },
              { name: "fetch-nearby-wells", desc: "Find wells near given coordinates using OCC spatial queries (bounding box).", input: "{ lat, lng, radiusMiles? }", output: "{ wells[] }" },
              { name: "fetch-texas-wells", desc: "Fetch well data from Texas Railroad Commission API.", input: "{ county?, operator? }", output: "{ wells[] }" },
              { name: "analyze-core", desc: "Analyze core images via Gemini AI. Determine lithology, porosity, texture, mineral composition.", input: "{ imageBase64 }", output: "{ analysis: { lithology, porosity, ... } }" },
              { name: "analyze-core-cv", desc: "Advanced core CV analysis with multi-stage pipeline (edge detection, segmentation, classification).", input: "{ imageBase64, rockType? }", output: "{ analysis, model }" },
              { name: "analyze-seismic", desc: "Text-based seismic data interpretation via AI.", input: "{ seismicData, wellContext? }", output: "{ interpretation }" },
              { name: "analyze-seismic-cv", desc: "Computer vision seismic image analysis. NVIDIA NIM (nemotron) with Gemini fallback. Detects faults, horizons, anomalies, fluid contacts.", input: "{ imageBase64, analysisMode, wellContext? }", output: "{ analysis, model }" },
              { name: "analyze-well-stage", desc: "Run individual pipeline stage analysis for a well (9-stage EOR pipeline). Retry logic: 3× with exponential backoff.", input: "{ wellId, stageNumber, wellData }", output: "{ stageResult }" },
              { name: "rank-wells", desc: "ML-based well ranking. Calculate scores by multiple parameters.", input: "{ wells[], criteria }", output: "{ ranked: [{ id, score, ... }] }" },
              { name: "get-oil-price", desc: "Fetch current WTI oil price for financial calculations.", input: "{}", output: "{ price, currency, date }" },
              { name: "lookup-well-by-api", desc: "Look up well data by API number from OCC ArcGIS. Used for well import and validation.", input: "{ apiNumber }", output: "{ well }" },
              { name: "spt-chat", desc: "AI chatbot proxy for SPT technology Q&A. Routes to Claude with MCDA context. Context-aware responses.", input: "{ message, history[] }", output: "{ response }" },
            ].map((fn) => (
              <div key={fn.name} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground font-mono text-sm">{fn.name}</p>
                <p className="text-xs mt-1">{fn.desc}</p>
                <div className="flex gap-4 mt-2 text-[10px] flex-wrap">
                  <span><strong>Input:</strong> <code>{fn.input}</code></span>
                  <span><strong>Output:</strong> <code>{fn.output}</code></span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Authentication */}
        <Section icon={Shield} title="7. Authentication & Security">
          <ul className="list-disc pl-5 space-y-1">
            <li>Email/password authentication via Supabase Auth</li>
            <li><strong>Sign-up disabled</strong> — login only for authorized users</li>
            <li>Unknown users default to <code className="text-primary">admin</code> role</li>
            <li>Investor role (<code className="text-primary">demo@aismartwell.com</code>) — restricted module access</li>
            <li>Row Level Security (RLS) on all 14 database tables</li>
            <li>Security Definer functions to prevent recursive RLS checks</li>
            <li>Session persistence via localStorage</li>
            <li>Password reset flow: <code className="text-primary">/forgot-password</code> → <code className="text-primary">/reset-password</code></li>
          </ul>
        </Section>

        {/* 8. External Integrations */}
        <Section icon={Globe} title="8. External Integrations">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground">Oklahoma Corporation Commission (OCC)</h4>
              <p>ArcGIS REST API — <code className="text-primary text-xs break-all">gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query</code></p>
              <p>Data: coordinates, API numbers, operators, statuses, formations, depths, dates.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Texas Railroad Commission (RRC)</h4>
              <p>Well data for Texas operations.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">NVIDIA Inception Program</h4>
              <p>Platform is a participant in the NVIDIA Inception program. Dedicated pages: <code className="text-primary">/nvidia-inception</code>, <code className="text-primary">/nvidia-showcase</code>, <code className="text-primary">/nvidia-cosmos</code></p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Google Earth (KML)</h4>
              <p>Export wells to KML format with status-based color coding.</p>
            </div>
          </div>
        </Section>

        {/* 9. Data Strategy */}
        <Section icon={Database} title="9. Data Strategy">
          <h4 className="font-semibold text-foreground mb-2">Data Fallback Hierarchy</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>REAL DATA</strong> — actual well measurements from API/LAS imports</li>
            <li><strong>FORMATION-BASED</strong> — estimates from formation database bounds</li>
            <li><strong>SYNTHETIC</strong> — 500-point seeded random walk (deterministic via stableHash, never Math.random)</li>
          </ol>
          <p className="mt-2">Data transparency badges (REAL DATA / SYNTHETIC) displayed throughout pipeline modules.</p>

          <h4 className="font-semibold text-foreground mb-2 mt-4">Measurement System</h4>
          <p>Imperial units throughout: depth in feet (ft), resistivity in Ohm·m.</p>
        </Section>

        {/* 10. Budget Overview */}
        <Section icon={DollarSign} title="10. MVP Budget Overview">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Adjusted MVP Budget</span>
              <span className="text-primary font-bold text-lg">$133,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Original estimate (Base tier)</span>
              <span className="line-through opacity-60">$168,600</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Prototype savings</span>
              <span className="text-green-400">−$35,600 (21%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Potential credits (NVIDIA Inception + AWS, DOE SBIR)</span>
              <span>$565,000</span>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/budget")} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Open Full Budget Overview
            </Button>
          </div>
        </Section>

        {/* 11. SaaS Business Model */}
        <Section icon={DollarSign} title="11. SaaS Business Model — Hybrid Pricing">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border/50 rounded">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-2 border-b border-border/50">Tier</th>
                  <th className="text-left p-2 border-b border-border/50">Base / mo</th>
                  <th className="text-left p-2 border-b border-border/50">Per Well</th>
                  <th className="text-left p-2 border-b border-border/50">Well Limit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Explorer", "$2,000", "$350", "Up to 10 wells/mo"],
                  ["Professional", "$6,000", "$200", "Up to 50 wells/mo"],
                  ["Enterprise", "$15,000", "$120", "Unlimited"],
                ].map(([tier, base, per, limit]) => (
                  <tr key={tier} className="border-b border-border/30 hover:bg-muted/10">
                    <td className="p-2 font-semibold text-foreground">{tier}</td>
                    <td className="p-2 text-primary font-mono">{base}</td>
                    <td className="p-2 font-mono">{per}</td>
                    <td className="p-2">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold text-foreground mb-2 mt-4">Revenue Projections (Conservative)</h4>
          <div className="mt-2 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-2">
            {[
              ["Year 1", "$0.6M ARR", "5 clients"],
              ["Year 2", "$2.2M ARR", "15 clients"],
              ["Year 3", "$5.8M ARR", "35 clients"],
            ].map(([year, arr, clients]) => (
              <div key={year} className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">{year}</span>
                <span className="text-primary font-bold">{arr}</span>
                <span className="text-muted-foreground">{clients}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
              <span className="text-foreground font-medium">Gross Margin</span>
              <span className="text-primary font-bold">~80%</span>
              <span className="text-muted-foreground">SaaS industry standard</span>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/saas-business-model")} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Open SaaS Business Model
            </Button>
          </div>
        </Section>

        {/* 12. Standalone Pages */}
        <Section icon={FileText} title="12. Standalone Pages">
          <div className="space-y-2">
            {[
              { route: "/investor-deck", desc: "19-slide investor presentation" },
              { route: "/budget", desc: "MVP budget interactive breakdown" },
              { route: "/mvp-scope", desc: "MVP scope and roadmap" },
              { route: "/counter-proposal", desc: "Counter proposal document" },
              { route: "/technical-response", desc: "Technical response document" },
              { route: "/nvidia-inception", desc: "NVIDIA Inception program page" },
              { route: "/nvidia-showcase", desc: "NVIDIA technology showcase" },
              { route: "/nvidia-cosmos", desc: "NVIDIA Cosmos integration overview" },
              { route: "/nvidia-capital-connect", desc: "NVIDIA Capital Connect letter" },
              { route: "/aws-activate", desc: "AWS Activate program page" },
              { route: "/cosmos-demo", desc: "NVIDIA Cosmos interactive demos" },
              { route: "/fluid-simulation", desc: "Fluid physics simulation" },
              { route: "/diversified-energy-proposal", desc: "Diversified Energy proposal" },
              { route: "/kazakhstan-template", desc: "Kazakhstan project template" },
              { route: "/kazakhstan-process", desc: "Kazakhstan process documentation" },
            ].map((p) => (
              <div key={p.route} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border/30">
                <code className="text-xs text-primary font-mono min-w-[220px]">{p.route}</code>
                <span className="text-xs">{p.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 13. Deployment */}
        <Section icon={Wrench} title="13. Deployment & Running">
          <div className="space-y-2">
            <p><strong>Dev Server:</strong> <code className="text-primary">npm run dev</code> (Vite, port 8080)</p>
            <p><strong>Build:</strong> <code className="text-primary">npm run build</code></p>
            <p><strong>Deploy:</strong> Lovable Cloud — automatic frontend deployment via Publish. Edge Functions deploy automatically.</p>
            <p><strong>Video Generation:</strong> Remotion (separate <code className="text-primary">/remotion</code> directory) for programmatic video rendering.</p>
            <p><strong>Environment Variables (.env):</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code>VITE_SUPABASE_URL</code> — Project URL</li>
              <li><code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — Anon Key</li>
              <li><code>VITE_SUPABASE_PROJECT_ID</code> — Project ID</li>
            </ul>
          </div>
        </Section>

        <div className="text-center text-xs text-muted-foreground pb-8">
          AI Smart Well Platform — Technical Specification v4.0 — April 2026
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpec;
