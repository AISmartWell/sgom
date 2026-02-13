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
          <Badge className="ml-auto text-xs" variant="outline">v1.0 — February 2026</Badge>
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
                <li>Google Gemini (via Lovable AI) — core analysis, report generation</li>
                <li>Computer Vision — rock classification from images</li>
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
          <h4 className="font-semibold text-foreground mb-2">Table: <code className="text-primary">public.wells</code></h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border/50 rounded">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-2 border-b border-border/50">Field</th>
                  <th className="text-left p-2 border-b border-border/50">Type</th>
                  <th className="text-left p-2 border-b border-border/50">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["id", "UUID (PK)", "Unique identifier"],
                  ["api_number", "TEXT (UNIQUE)", "Well API number"],
                  ["well_name", "TEXT", "Well name"],
                  ["operator", "TEXT", "Operator / company"],
                  ["well_type", "TEXT", "Type (OIL, GAS, INJECTION, etc.)"],
                  ["status", "TEXT", "Status (ACTIVE, PLUGGED, SHUT-IN)"],
                  ["state", "TEXT (NOT NULL)", "State (default OK)"],
                  ["county", "TEXT", "County"],
                  ["latitude", "FLOAT", "Latitude (GPS)"],
                  ["longitude", "FLOAT", "Longitude (GPS)"],
                  ["total_depth", "FLOAT", "Total depth (TD), ft"],
                  ["formation", "TEXT", "Geological formation"],
                  ["production_oil", "FLOAT", "Oil production, bbl"],
                  ["production_gas", "FLOAT", "Gas production, mcf"],
                  ["water_cut", "FLOAT", "Water cut, %"],
                  ["spud_date", "DATE", "Drilling start date"],
                  ["completion_date", "DATE", "Completion date"],
                  ["source", "TEXT", "Data source (OCC)"],
                  ["raw_data", "JSONB", "Raw API data"],
                  ["created_at", "TIMESTAMPTZ", "Record creation date"],
                  ["updated_at", "TIMESTAMPTZ", "Last update date"],
                ].map(([field, type, desc]) => (
                  <tr key={field} className="border-b border-border/30 hover:bg-muted/10">
                    <td className="p-2 font-mono text-primary">{field}</td>
                    <td className="p-2">{type}</td>
                    <td className="p-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. Modules */}
        <Section icon={Layers} title="5. Functional Modules">
          <div className="space-y-4">
            {[
               { icon: "📡", name: "Data Collection & Integration", route: "/dashboard/data-collection",
                 desc: "Collect well data from OCC ArcGIS API (Oklahoma). Display on interactive map (Leaflet). Export to KML for Google Earth. Detailed well viewing. Edge Function: fetch-wells." },
               { icon: "📂", name: "Data Classification", route: "/dashboard/data-classification",
                 desc: "Stage 2 pipeline: Download, parse, and classify well data into structured categories. Processes monthly production history, initial production rates, casing/tubing pressure data, accident reports, and productive interval transitions. Real-time pipeline visualization with quality metrics per category." },
               { icon: "🗺️", name: "Geological Analysis", route: "/dashboard/geological-analysis",
                desc: "3D geological model visualization (Three.js). Seismic sections, well logs, cross-sections. AI-generated geological reports." },
              { icon: "🔬", name: "Core Analysis (Computer Vision)", route: "/dashboard/core-analysis",
                desc: "Core sample image upload. AI analysis via Gemini: lithology determination, porosity, mineral composition. Interactive CV Demo: multi-stage pipeline visualization (preprocessing, edge detection, feature extraction, segmentation, classification) with real core sample images, dynamic overlays, and final analysis report (rock type, porosity %, permeability mD, mineral composition)." },
              { icon: "🎯", name: "Well Selection & Ranking", route: "/dashboard/well-selection",
                desc: "ML-based well ranking by multiple criteria. Filter by county, type, operator. Table with scores and recommendations." },
              { icon: "⚡", name: "Reservoir Simulation", route: "/dashboard/simulation",
                desc: "Reservoir behavior simulation. Production forecasting. Pressure and saturation visualization." },
              { icon: "💰", name: "Financial Calculator", route: "/dashboard/financial",
                desc: "ROI calculation for Maxxwell Production. NPV, IRR calculator. Well treatment cost analysis." },
              { icon: "🔧", name: "SPT Treatment", route: "/dashboard/spt-treatment",
                desc: "Interactive Siphon Pump Treatment technology demo (Patent US8863823). Treatment process visualization. Effectiveness metrics." },
              { icon: "🧪", name: "EOR Optimization", route: "/dashboard/eor-optimization",
                desc: "Enhanced Oil Recovery method optimization. Simulation of chemical and thermal impacts." },
              { icon: "📊", name: "Real-Time Dashboard", route: "/dashboard/realtime",
                desc: "Real-time well monitoring. WebSocket simulation. Critical indicator alerts." },
              { icon: "🧠", name: "ML Training", route: "/dashboard/ml-training",
                desc: "Machine learning model training on well data. Parameter tuning and process visualization." },
              { icon: "📊", name: "Geophysical Expertise", route: "/dashboard/geophysical",
                desc: "AI-powered well log interpretation and formation evaluation. 5-stage analysis pipeline: data loading, curve analysis (GR, Resistivity, Porosity, Sw), zone detection, missed pay identification, and LLM-based report generation. Automatically detects productive zones, missed thin-bed intervals, and water-bearing formations. Generates perforation recommendations and reserve estimates." },
              { icon: "🛰️", name: "Field Scanning", route: "/dashboard/field-scanning",
                desc: "Automated field surveillance with configurable schedule (daily/weekly/monthly). Loads real satellite imagery (ESRI World Imagery) with GIS grid overlay. Scans 24 predefined field squares across Permian and Anadarko basins, detecting all wells via coordinates. Flags low-productive wells (< 10 bbl/day, water cut > 60%) and automatically purges closed/plugged wells from the active database. 5-stage pipeline: Initialize → Scan Fields → Analyze Wells → Flag Low-Prod → Remove Closed." },
              { icon: "📄", name: "Reports", route: "/dashboard/reports",
                desc: "Analysis report generation. Data export." },
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
        <Section icon={Cpu} title="6. Edge Functions (Server Functions)">
          <div className="space-y-3">
            {[
              { name: "fetch-wells", desc: "Fetch well data from OCC ArcGIS REST API. Filter by county/type. Upsert to wells table.", input: "{ county?, wellType?, limit?, offset? }", output: "{ success, fetched, stored, skipped, sample }" },
              { name: "analyze-core", desc: "Analyze core images via AI (Gemini). Determine lithology, porosity, texture.", input: "{ imageBase64 }", output: "{ analysis: { lithology, porosity, ... } }" },
              { name: "rank-wells", desc: "ML-based well ranking. Calculate scores by multiple parameters.", input: "{ wells[], criteria }", output: "{ ranked: [{ id, score, ... }] }" },
              { name: "get-oil-price", desc: "Fetch current oil price for financial calculations.", input: "{}", output: "{ price, currency, date }" },
            ].map((fn) => (
              <div key={fn.name} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground font-mono text-sm">{fn.name}</p>
                <p className="text-xs mt-1">{fn.desc}</p>
                <div className="flex gap-4 mt-2 text-[10px]">
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

        {/* 9. File Structure */}
        <Section icon={FileText} title="9. Key Directories">
          <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono whitespace-pre overflow-x-auto">
{`src/
├── pages/                  # Application pages
│   ├── Index.tsx            # Landing page
│   ├── Auth.tsx             # Authentication
│   ├── Dashboard.tsx        # Main dashboard
│   └── modules/             # Platform modules
│       ├── DataCollection.tsx
│       ├── DataClassification.tsx
│       ├── GeologicalAnalysis.tsx
│       ├── CoreAnalysis.tsx
│       ├── WellSelection.tsx
│       ├── Simulation.tsx
│       ├── Financial.tsx
│       ├── SPTTreatment.tsx
│       ├── EOROptimization.tsx
│       ├── RealtimeDashboard.tsx
│       ├── MLTraining.tsx
│       ├── GeophysicalExpertise.tsx
│       ├── FieldScanning.tsx
│       └── Reports.tsx
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
├── functions/               # Edge Functions
│   ├── fetch-wells/         # OCC data import
│   ├── analyze-core/        # CV core analysis
│   ├── rank-wells/          # ML ranking
│   └── get-oil-price/       # Oil price
└── config.toml              # Configuration`}
          </pre>
        </Section>

        {/* 10. Deployment */}
        <Section icon={Wrench} title="10. Deployment & Running">
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
          AI Smartwell SGOM Platform — Technical Specification v1.0 — February 2026
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpec;