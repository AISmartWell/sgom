import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Database, Globe, Cpu, Shield, Layers, BarChart3, MapPin, Beaker, Activity, DollarSign, Wrench, Brain, Eye, Radar } from "lucide-react";
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
            <p className="text-muted-foreground mt-1">AI Smartwell SGOM Platform — Developer Specification</p>
          </div>
          <Badge className="ml-auto text-xs" variant="outline">v3.0 — April 2026</Badge>
        </div>

        <Separator />

        {/* 1. Project Overview */}
        <Section icon={Globe} title="1. Project Overview">
          <p><strong>Name:</strong> AI Smartwell SGOM (Smart Geological & Operations Management)</p>
          <p><strong>Purpose:</strong> SaaS platform for the oil & gas industry. Well analysis, production optimization, geological modeling, and financial planning using artificial intelligence.</p>
          <p><strong>Target Audience:</strong> Oil & gas field operators, service companies, petroleum engineers, geologists, investors.</p>
          <p><strong>Website:</strong> <a href="https://www.aismartwell.com" className="text-primary hover:underline" target="_blank" rel="noreferrer">www.aismartwell.com</a></p>
        </Section>

        {/* 2. Technology Stack */}
        <Section icon={Layers} title="2. Technology Stack">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Frontend</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>React 18 + TypeScript</li>
                <li>Vite (build tool)</li>
                <li>Tailwind CSS + shadcn/ui</li>
                <li>React Router v6</li>
                <li>Recharts (charting)</li>
                <li>React Three Fiber / Three.js (3D visualizations)</li>
                <li>Leaflet + react-leaflet 4.x (maps)</li>
                <li>Framer Motion (animations)</li>
                <li>TanStack Query (request caching)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Backend (Lovable Cloud / Supabase)</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>PostgreSQL — database</li>
                <li>Row Level Security (RLS)</li>
                <li>Supabase Auth — authentication (email)</li>
                <li>Edge Functions (Deno) — server logic</li>
                <li>Supabase Storage — file storage</li>
                <li>Realtime — database change subscriptions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">AI / ML</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Gemini 2.5 Flash (via Lovable AI) — core analysis, seismic interpretation, report generation</li>
                <li>NVIDIA NIM (nemotron-nano-12b-v2-vl) — seismic CV analysis (with Gemini fallback)</li>
                <li>Computer Vision — rock classification, seismic fault/horizon detection</li>
                <li>Well ranking — ML scoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">External APIs</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Oklahoma Corporation Commission (OCC) ArcGIS REST API — well data</li>
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
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────┬────┘ │
│        └──────────────┴──────────────┴────────────┘      │
│                         │ Supabase SDK                   │
├─────────────────────────┼───────────────────────────────┤
│              BACKEND (Lovable Cloud)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │ Edge Funcs   │  │   Storage     │  │
│  │  (wells, etc) │  │ (fetch-wells │  │  (core imgs)  │  │
│  │  + RLS        │  │  analyze-core│  │               │  │
│  │               │  │  rank-wells) │  │               │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │   External APIs     │                     │
│              │  OCC ArcGIS, AI     │                     │
│              └─────────────────────┘                     │
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
              { table: "formation_codes", desc: "Reference: state formation codes (KDOR), basins, counties", cols: 12, rls: "SELECT only (read-only reference)", fk: "—" },
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
        <Section icon={Shield} title="4.1 Multi-Tenant Data Isolation (RBDMS)">
          <h4 className="font-semibold text-foreground mb-2">Architecture Overview</h4>
          <p>The platform implements enterprise-grade multi-tenant data isolation to ensure secure separation between independent operator companies. Each organization's well data, analysis results, and configurations remain completely isolated at the database level.</p>
          
          <h4 className="font-semibold text-foreground mb-2 mt-4">Core Tables</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><code className="text-primary">public.companies</code> — Operator organization records (name, timestamps)</li>
            <li><code className="text-primary">public.user_companies</code> — Junction table mapping users to companies (enforces multi-tenant membership)</li>
            <li><code className="text-primary">public.wells</code> — Well records with mandatory <code className="text-primary">company_id</code> foreign key</li>
          </ul>

          <h4 className="font-semibold text-foreground mb-2">Row-Level Security (RLS) Policies</h4>
          <p className="mb-3">All tables enforce RLS policies using the multi-tenant model <code className="text-primary">(company_id IN (SELECT user_companies.company_id FROM user_companies WHERE user_id = auth.uid()))</code>:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>wells:</strong> SELECT, INSERT, UPDATE, DELETE — users can only access wells belonging to their assigned companies</li>
            <li><strong>companies:</strong> SELECT — users can view only companies they are members of</li>
            <li><strong>user_companies:</strong> SELECT — users can view only their own membership records</li>
          </ul>

          <h4 className="font-semibold text-foreground mb-2">Data Integration</h4>
          <p>Edge Function <code className="text-primary">fetch-wells</code> requires <code className="text-primary">company_id</code> in request body. Well records imported from OCC API are automatically tagged with the requesting company's ID, ensuring upstream data integrity.</p>

          <h4 className="font-semibold text-foreground mb-2">Default Company Initialization</h4>
          <p>On first authentication, users are assigned to a "Default Company" (ID: <code className="text-primary">00000000-0000-0000-0000-000000000001</code>). This allows immediate access to shared evaluation data while maintaining isolation from other operators.</p>
        </Section>

        {/* 5. Modules */}
        <Section icon={Layers} title="5. Functional Modules">
          <div className="space-y-4">
            {[
               { icon: "📡", name: "Data Collection & Integration", route: "/dashboard/data-collection",
                 desc: "Collect well data from OCC ArcGIS API (Oklahoma). Display on interactive map (Leaflet). Export to KML for Google Earth. Detailed well viewing. Edge Function: fetch-wells." },
               { icon: "📂", name: "Data Classification (Stage 2)", route: "/dashboard/data-classification",
                 desc: "Stage 2 pipeline: Download, parse, and classify well data into structured categories. Processes monthly production history, initial production rates, casing/tubing pressure data, accident reports, and productive interval transitions. Real-time pipeline visualization with quality metrics per category." },
               { icon: "🗺️", name: "Geological Analysis", route: "/dashboard/geological-analysis",
                desc: "3D geological model visualization (Three.js). Seismic sections, well logs, cross-sections. AI-generated geological reports." },
              { icon: "🔬", name: "Core Analysis (Computer Vision)", route: "/dashboard/core-analysis",
                desc: "Core sample image upload. AI analysis via Gemini: lithology determination, porosity, mineral composition. Interactive CV Demo: multi-stage pipeline visualization (preprocessing, edge detection, feature extraction, segmentation, classification) with real core sample images, dynamic overlays, and final analysis report (rock type, porosity %, permeability mD, mineral composition)." },
               { icon: "🏢", name: "Multi-Tenant Demo", route: "/multi-tenant",
                 desc: "Interactive demonstration of multi-tenant architecture and data isolation. Includes company management (create, switch companies), member statistics, and visual Row-Level Security (RLS) policies. Shows how `auth.uid()` and `user_companies` mappings enforce strict data separation between organizations." },
               { icon: "🎯", name: "Well Selection & Ranking", route: "/dashboard/well-selection",
                 desc: "ML-based well ranking by multiple criteria. Filter by county, type, operator. Table with scores and recommendations." },
              { icon: "⚡", name: "Reservoir Simulation", route: "/dashboard/simulation",
                desc: "Reservoir behavior simulation. Production forecasting. Pressure and saturation visualization." },
              { icon: "💰", name: "Financial Calculator", route: "/dashboard/financial",
                desc: "ROI calculation for Maxxwell Production. NPV, IRR calculator. Well treatment cost analysis." },
               { icon: "📈", name: "Cumulative Analysis (Stage 3)", route: "/dashboard/cumulative-analysis",
                  desc: "Mathematical-graphical reserve calculation using decline curve analysis (DCA). 5-stage pipeline: Load Data → Calculate Cumulative Volumes → Estimate Initial Reserves (IOIP) → Compute Remaining Reserves → Generate Report. Key formulas: IOIP = A × h × φ × S_o / B_o (volumetric method); N_r = IOIP − N_p (remaining reserves); RF = (N_p / IOIP) × 100 (recovery factor); q(t) = q_0 × e^(−D×t) (exponential decline). Visualizes decline curves, recovery factors (RF) per well, and cumulative production trends over 60-month forecast period." },
               { icon: "🔧", name: "SPT Treatment", route: "/dashboard/spt-treatment",
                  desc: "Interactive Siphon Pump Treatment technology demo (Patent US8863823). Treatment process visualization. Effectiveness metrics." },
               { icon: "🚀", name: "SPT Projection (Stage 4)", route: "/dashboard/spt-projection",
                  desc: "Redevelopment potential analysis and well screening for SPT treatment. Multi-stage filtering pipeline: Water Cut Filter (exclude ≥60%) → Inflow Estimation (25–35 bbl/day target) → Reserve Analysis (>500k bbl threshold) → Timeline Evaluation (≥15yr promising). Visualizations: filtering funnel, inflow projection charts, timeline vs. reserves scatter plot. Outputs list of treatment-ready candidates with estimated SPT inflow and ROI recovery (7–8 months). Key formulas: Projected Inflow = (Current Production × 2.0–2.5) + Treatment Effect (5–10 bbl/day)." },
               { icon: "💵", name: "Economic Analysis (Stage 5)", route: "/dashboard/economic-analysis",
                   desc: "Full economic evaluation of SPT treatment candidates. Interactive scenario modeling with adjustable oil price, treatment cost, and OPEX parameters. Calculates per-well and portfolio-level metrics: ROI (5-year), payback period, annual gross/net profit, full operational period returns. Includes cumulative net profit projection (60-month chart with break-even visualization). Key formula: Net Profit = (Added Production × Oil Price − OPEX/bbl) × 365 × Timeline − Treatment Cost." },
               { icon: "🧪", name: "AI EOR SPT Optimization", route: "/dashboard/eor-optimization",
                  desc: "Intelligent program for optimizing Enhanced Oil Recovery through automated geological analysis and SPT well selection. 7-stage automated workflow with interactive pipeline visualization: Stage 1 (Field Scanning) → Stage 2 (Data Classification) → Stage 3 (Cumulative Analysis) → Stage 4 (SPT Projection) → Stage 5 (Economic Analysis) → Stage 6 (Geophysical Review) → Stage 7 (SPT Parameters). Each stage card links to its dedicated module via 'Open Stage' navigation. Includes prospect wells database with status tracking (promising/analyzing/rejected), cumulative production analysis with SPT-projected curves, and economic model with ROI/payback calculations. Business logic: expected SPT inflow 25–35 bbl/day; wells with 15+ year potential marked promising; excessive water cut wells automatically filtered out. Integrated SPT Parameters tab: static informational reference for Maxxwell Production's slot-perforation technology (Patent US 8,863,823) — cutting speeds, slot dimensions, drainage area formulas, and equipment specifications. No standalone SPT Parameters module." },
              { icon: "📊", name: "Real-Time Dashboard", route: "/dashboard/realtime",
                desc: "Real-time well monitoring. WebSocket simulation. Critical indicator alerts." },
               { icon: "🔗", name: "Telemetry Architecture & IoT Pricing", route: "/dashboard/telemetry-architecture",
                 desc: "End-to-end data pipeline visualization from wellhead sensors to client dashboard. 6-stage flow: Restored Well (Maxwell Production) → Wellhead Sensors (pressure, flow, temperature) → RTU/Controller (data buffering, 1–15 min intervals) → Data Transport (HTTP/REST, MQTT, SCADA Adapter) → Telemetry Ingestion API (Edge Function: validate, normalize, store) → RLS Policy Engine (company_id filtering via auth.uid() → user_companies) → Real-Time Dashboard (live monitoring with critical/warning alerts). Supported sensor parameters: Pressure (0–10,000 psi), Flow Rate (0–5,000 bbl/day), Temperature (50–400 °F), Water Cut (0–100%). IoT gateway auto-scales with traffic volume. Includes IoT Pricing section with three tiers: Starter Kit ($2,500 hardware + $500/mo per well, 1–5 wells), Professional ($2,000 + $350/mo per well, 6–25 wells), Enterprise (custom pricing, 25+ wells). Hardware cost per well: $2,900–$5,400 (sensors, RTU, gateway, installation)." },
              { icon: "🧠", name: "ML Training", route: "/dashboard/ml-training",
                desc: "Machine learning model training on well data. Parameter tuning and process visualization." },
              { icon: "📊", name: "Geophysical Expertise (Stage 6)", route: "/dashboard/geophysical",
                desc: "AI-powered well log interpretation and formation evaluation. 5-stage analysis pipeline: data loading, curve analysis (GR, Resistivity, Porosity, Sw), zone detection, missed pay identification, and LLM-based report generation. Automatically detects productive zones, missed thin-bed intervals, and water-bearing formations. Generates perforation recommendations and reserve estimates." },
               { icon: "🛰️", name: "Field Scanning (Stage 1)", route: "/dashboard/field-scanning",
                 desc: "Automated field surveillance Stage 1 with configurable schedule (daily/weekly/monthly). Loads real satellite imagery (ESRI World Imagery) with GIS grid overlay. Scans 24 predefined field squares across Permian and Anadarko basins, detecting all wells via coordinates. Flags low-productive wells (< 10 bbl/day, water cut > 60%) and automatically purges closed/plugged wells from the active database. 5-stage pipeline: Initialize → Scan Fields → Analyze Wells → Flag Low-Prod → Remove Closed." },
              { icon: "📄", name: "Reports", route: "/dashboard/reports",
                desc: "Analysis report generation. Data export." },
              { icon: "💼", name: "SaaS Business Model", route: "/dashboard/saas-business-model",
                desc: "Hybrid SaaS pricing model presentation: Base Subscription ($2,000–$15,000/mo) + Per-Well Analysis Fee ($120–$350/well). Three tiers: Explorer (up to 10 wells), Professional (up to 50 wells), Enterprise (unlimited). Interactive 3-year revenue projection chart (Recharts) splitting SaaS subscriptions vs per-well usage fees. Conservative scenario: Year 1 ARR $0.6M (5 clients) → Year 2 $2.2M (15 clients) → Year 3 $5.8M (35 clients). ~80% gross margin. Strategic rationale: low entry barrier (2–4 week onboarding), predictable + scalable revenue (70/30 subscription/usage split), aligned incentives (3× avg. tier upgrade in 18 mo), dual revenue streams (SaaS + SPT service)." },
            ].map((mod) => (
              <div key={mod.route} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground">{mod.icon} {mod.name}</p>
                <p className="text-xs mt-1">{mod.desc}</p>
                <code className="text-[10px] text-primary/70">{mod.route}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Edge Functions */}
        <Section icon={Cpu} title="6. Edge Functions (11 total)">
          <div className="space-y-3">
            {[
              { name: "fetch-wells", desc: "Fetch well data from OCC ArcGIS REST API. Filter by county/type. Upsert to wells table.", input: "{ county?, wellType?, limit?, offset? }", output: "{ success, fetched, stored, skipped, sample }" },
              { name: "fetch-nearby-wells", desc: "Find wells near given coordinates using OCC spatial queries.", input: "{ lat, lng, radiusMiles? }", output: "{ wells[] }" },
              { name: "fetch-texas-wells", desc: "Fetch well data from Texas Railroad Commission API.", input: "{ county?, operator? }", output: "{ wells[] }" },
              { name: "analyze-core", desc: "Analyze core images via Gemini AI. Determine lithology, porosity, texture, mineral composition.", input: "{ imageBase64 }", output: "{ analysis: { lithology, porosity, ... } }" },
              { name: "analyze-core-cv", desc: "Advanced core CV analysis with multi-stage pipeline (edge detection, segmentation, classification).", input: "{ imageBase64, rockType? }", output: "{ analysis, model }" },
              { name: "analyze-seismic", desc: "Text-based seismic data interpretation via AI.", input: "{ seismicData, wellContext? }", output: "{ interpretation }" },
              { name: "analyze-seismic-cv", desc: "Computer vision seismic image analysis. NVIDIA NIM (nemotron) with Gemini fallback. Detects faults, horizons, anomalies, fluid contacts.", input: "{ imageBase64, analysisMode, wellContext? }", output: "{ analysis: { faults[], horizons[], anomalies[], ... }, model }" },
              { name: "analyze-well-stage", desc: "Run individual pipeline stage analysis for a well (used in 9-stage EOR pipeline).", input: "{ wellId, stageNumber, wellData }", output: "{ stageResult }" },
              { name: "rank-wells", desc: "ML-based well ranking. Calculate scores by multiple parameters.", input: "{ wells[], criteria }", output: "{ ranked: [{ id, score, ... }] }" },
              { name: "get-oil-price", desc: "Fetch current WTI oil price for financial calculations.", input: "{}", output: "{ price, currency, date }" },
              { name: "spt-chat", desc: "AI chatbot for SPT technology Q&A. Context-aware responses about slot-perforation treatment.", input: "{ message, history[] }", output: "{ response }" },
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
            <li>Auto email confirmation (for testing speed)</li>
            <li>Row Level Security (RLS) on database tables</li>
            <li>Session persistence via localStorage</li>
            <li>Route: <code className="text-primary">/auth</code></li>
          </ul>
        </Section>

        {/* 8. External Integrations */}
        <Section icon={Globe} title="8. External Integrations">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground">Oklahoma Corporation Commission (OCC)</h4>
              <p>ArcGIS REST API — <code className="text-primary text-xs break-all">https://gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query</code></p>
              <p>Data: coordinates, API numbers, operators, statuses, formations, depths, dates.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Google Earth (KML)</h4>
              <p>Export wells to KML format. Oil rig icons with status-based color coding.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">NVIDIA Inception Program</h4>
              <p>Platform is a participant in the NVIDIA Inception program. Page: <code className="text-primary">/nvidia-inception</code></p>
            </div>
          </div>
        </Section>

        {/* 9. Budget Overview */}
        <Section icon={DollarSign} title="9. MVP Budget Overview">
          <p>A detailed budget breakdown for the SGOM MVP is maintained as an interactive page with four tabs: cost breakdown by category, 6-month development timeline, startup credits & grants, and team structure. <strong>Note:</strong> Team costs ($216K at market rates) are already included in the adjusted MVP budget — they represent the same budget allocated by role rather than by task category, not an additional expense.</p>
          
          <h4 className="font-semibold text-foreground mb-2 mt-4">Estimation Methodology</h4>
          <p>Each budget line item is estimated using three market-rate tiers: <strong>Low</strong> (junior specialists, offshore rates, minimal scope), <strong>Base</strong> (realistic market average — used as working budget), and <strong>High</strong> (top-tier specialists, complex requirements, US market rates). This range-based approach demonstrates that the budget is grounded in market data and provides investors with a confidence corridor for cost projections.</p>

          <h4 className="font-semibold text-foreground mb-2 mt-4">Adjusted Budget — External Work Breakdown</h4>
          <p>The adjusted budget ($133K) reflects savings from the functional prototype. The remaining amounts cover <strong>external work</strong> that cannot be performed within the prototype:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs mb-3">
            <li><strong>Backend ($8K):</strong> External DevOps — production deployment, server monitoring, CI/CD pipeline setup</li>
            <li><strong>Frontend ($4K):</strong> External UX designer — user testing, responsive adaptation, visual polish for production</li>
            <li><strong>Testing ($7.4K):</strong> External QA & field work — pilot well validation with Maxxwell SPT, ML model accuracy benchmarks</li>
            <li><strong>Management ($19.6K):</strong> External — project coordination, IP/patent legal work, reduced contingency buffer</li>
          </ul>

          <div className="mt-3 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Adjusted MVP Budget</span>
              <span className="text-primary font-bold text-lg">$133,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Original estimate (Base tier)</span>
              <span className="line-through opacity-60">$168,600</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Prototype savings (Frontend + Backend)</span>
              <span className="text-success">−$35,600 (21%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Potential credits (NVIDIA Inception + AWS, DOE SBIR, etc.)</span>
              <span>$565,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Net estimated cash outlay</span>
              <span className="text-primary font-semibold">~$0 (credits exceed budget)</span>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/budget")} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Open Full Budget Overview
            </Button>
          </div>
        </Section>

        {/* 10. SaaS Business Model */}
        <Section icon={DollarSign} title="10. SaaS Business Model — Hybrid Pricing">
          <h4 className="font-semibold text-foreground mb-2">Monetization Strategy</h4>
          <p>The platform uses a hybrid SaaS pricing model combining a monthly base subscription with a per-well analysis fee. This approach ensures predictable recurring revenue while scaling naturally with client usage.</p>

          <h4 className="font-semibold text-foreground mb-2 mt-4">Pricing Tiers</h4>
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

          <h4 className="font-semibold text-foreground mb-2 mt-4">Key Assumptions</h4>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Avg. 20 wells/client/mo (Yr1) → 40 wells (Yr3)</li>
            <li>Blended per-well rate ~$200</li>
            <li>Annual churn &lt;10%</li>
            <li>Excludes SPT hardware/service revenue stream</li>
          </ul>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/saas-business-model")} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Open SaaS Business Model
            </Button>
          </div>
        </Section>

        {/* 11. File Structure */}
        <Section icon={FileText} title="11. Key Directories">
          <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono whitespace-pre overflow-x-auto">
{`src/
├── pages/                  # Application pages
│   ├── Index.tsx            # Landing page
│   ├── Auth.tsx             # Authentication
│   ├── Dashboard.tsx        # Main dashboard
│   └── modules/             # Platform modules
│       ├── DataCollection.tsx
│       ├── DataClassification.tsx
│       ├── CumulativeAnalysis.tsx
│       ├── GeologicalAnalysis.tsx
│       ├── CoreAnalysis.tsx
│       ├── WellSelection.tsx
│       ├── Simulation.tsx
│       ├── Financial.tsx
│       ├── SPTTreatment.tsx
│       ├── EOROptimization.tsx
│       ├── RealtimeDashboard.tsx
│       ├── TelemetryArchitecture.tsx
│       ├── MLTraining.tsx
│       ├── GeophysicalExpertise.tsx
│       ├── FieldScanning.tsx
│       ├── Reports.tsx
│       └── SaaSBusinessModel.tsx
├── InvestorDeck.tsx         # 19-slide investor presentation
├── BudgetOverview.tsx       # MVP budget interactive page
├── TechnicalSpec.tsx        # This document
├── NvidiaInception.tsx      # NVIDIA Inception page
├── components/              # UI components
│   ├── ui/                  # shadcn/ui
│   ├── layout/              # DashboardLayout, Sidebar
│   ├── data-collection/     # WellMapLeaflet, RealDataPanel
│   ├── geological/          # 3D models, seismic
│   ├── core-analysis/       # CV demo
│   ├── geophysical/         # Well log analysis demo
│   ├── well-selection/      # Filters, table, map
│   ├── simulation/          # Reservoir visualizations
│   ├── financial/           # Calculator
│   └── spt/                 # SPT visualization
├── hooks/                   # Custom hooks
├── integrations/supabase/   # Client and types (auto-generated)
└── assets/                  # Images

supabase/
├── functions/               # Edge Functions (11)
│   ├── fetch-wells/         # OCC data import
│   ├── fetch-nearby-wells/  # Spatial well search
│   ├── fetch-texas-wells/   # Texas RRC import
│   ├── analyze-core/        # AI core analysis
│   ├── analyze-core-cv/     # Core CV pipeline
│   ├── analyze-seismic/     # Seismic text analysis
│   ├── analyze-seismic-cv/  # Seismic CV (NVIDIA NIM + Gemini)
│   ├── analyze-well-stage/  # Pipeline stage analysis
│   ├── rank-wells/          # ML ranking
│   ├── get-oil-price/       # WTI oil price
│   └── spt-chat/            # SPT AI chatbot
└── config.toml              # Configuration`}
          </pre>
        </Section>

        {/* 12. Deployment */}
        <Section icon={Wrench} title="12. Deployment & Running">
          <div className="space-y-2">
            <p><strong>Dev Server:</strong> <code className="text-primary">npm run dev</code> (Vite, port 8080)</p>
            <p><strong>Build:</strong> <code className="text-primary">npm run build</code></p>
            <p><strong>Deploy:</strong> Lovable Cloud — automatic frontend deployment via Publish. Edge Functions deploy automatically.</p>
            <p><strong>Environment Variables (.env):</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code>VITE_SUPABASE_URL</code> — Project URL</li>
              <li><code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — Anon Key</li>
            </ul>
          </div>
        </Section>

        <div className="text-center text-xs text-muted-foreground pb-8">
          AI Smartwell SGOM Platform — Technical Specification v2.0 — March 2026
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpec;