import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Globe,
  Shield,
  Users,
  Layers,
  CheckCircle2,
  Circle,
  Droplets,
  Building2,
  Brain,
  FileText,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ─── Pipeline Steps ─── */
const PIPELINE_STEPS = [
  {
    id: 1,
    title: "User Registration",
    description: "User creates an account and verifies email. A company entity is automatically generated and linked via user_companies.",
    icon: Users,
    color: "hsl(var(--primary))",
    detail: "POST → auth.signup → trigger → companies + user_companies",
  },
  {
    id: 2,
    title: "Data Source Selection",
    description: "User selects a state and basin (Oklahoma OCC, Texas RRC — Permian, Eagle Ford, Barnett) in the Data Collection module.",
    icon: Globe,
    color: "hsl(var(--success))",
    detail: "ArcGIS REST API → query spatial layers → GeoJSON response",
  },
  {
    id: 3,
    title: "Well Import via Edge Function",
    description: "Backend function fetches wells from ArcGIS, normalises fields, attaches company_id, and inserts into the wells table.",
    icon: Database,
    color: "hsl(var(--warning))",
    detail: "Edge Function → parse → INSERT INTO wells (company_id, …)",
  },
  {
    id: 4,
    title: "RLS Data Isolation",
    description: "Row-Level Security policies ensure each user can only read/write wells belonging to their company. No data leaks.",
    icon: Shield,
    color: "hsl(var(--destructive))",
    detail: "SELECT … WHERE company_id IN (SELECT … FROM user_companies WHERE user_id = auth.uid())",
  },
  {
    id: 5,
    title: "Modules Access",
    description: "Imported wells are instantly available across all platform modules: Pipeline Analysis, Simulation, Financial, EOR, etc.",
    icon: Layers,
    color: "hsl(var(--primary))",
    detail: "React Query → supabase.from('wells').select() → filtered by RLS",
  },
  {
    id: 6,
    title: "AI Analysis & Reports",
    description: "Each well can be run through the 8-stage AI pipeline (Gemini) for SPT candidacy scoring and EOR recommendations.",
    icon: Brain,
    color: "hsl(var(--success))",
    detail: "Edge Function → Gemini API → structured tool_call → stage results",
  },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

const DataPipeline = () => {
  const navigate = useNavigate();
  const [wellStats, setWellStats] = useState<{
    total: number;
    byState: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
    bySource: { name: string; value: number }[];
    recentWells: any[];
  }>({
    total: 0,
    byState: [],
    byStatus: [],
    bySource: [],
    recentWells: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch all wells (RLS filters automatically)
      const { data: wells } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, state, county, status, source, formation, production_oil, water_cut, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!wells) {
        setLoading(false);
        return;
      }

      // Aggregate by state
      const stateMap = new Map<string, number>();
      const statusMap = new Map<string, number>();
      const sourceMap = new Map<string, number>();

      wells.forEach((w) => {
        stateMap.set(w.state, (stateMap.get(w.state) || 0) + 1);
        const st = w.status || "Unknown";
        statusMap.set(st, (statusMap.get(st) || 0) + 1);
        const src = w.source || "Manual";
        sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
      });

      setWellStats({
        total: wells.length,
        byState: [...stateMap.entries()].map(([name, value]) => ({ name, value })),
        byStatus: [...statusMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
        bySource: [...sourceMap.entries()].map(([name, value]) => ({ name, value })),
        recentWells: wells.slice(0, 15),
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Data Pipeline</h1>
        </div>
        <p className="text-muted-foreground">
          How well data flows from public sources into the platform — registration, import, isolation, and analysis
        </p>
      </div>

      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow">Workflow Diagram</TabsTrigger>
          <TabsTrigger value="data">Data Overview</TabsTrigger>
          <TabsTrigger value="charts">Analytics</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: Workflow Diagram ═══════ */}
        <TabsContent value="workflow" className="space-y-6">
          {/* Visual pipeline */}
          <div className="space-y-0">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-[27px] top-[72px] w-0.5 h-8 bg-border z-0" />
                )}
                <Card className="relative z-10 transition-all hover:shadow-lg hover:border-primary/30">
                  <CardContent className="py-5 px-6">
                    <div className="flex items-start gap-5">
                      {/* Step icon */}
                      <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${step.color}20` }}
                      >
                        <step.icon className="h-7 w-7" style={{ color: step.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-mono">
                            Step {step.id}
                          </Badge>
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs font-mono text-muted-foreground">
                          <Activity className="h-3 w-3 flex-shrink-0" />
                          {step.detail}
                        </div>
                      </div>

                      {/* Arrow to next */}
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className="hidden sm:flex items-center self-center">
                          <ArrowRight className="h-5 w-5 text-muted-foreground/40 rotate-90" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {idx < PIPELINE_STEPS.length - 1 && <div className="h-3" />}
              </div>
            ))}
          </div>

          {/* Architecture summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-5 px-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Architecture
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Authentication</p>
                  <p className="font-medium">Email + Password</p>
                  <p className="text-xs text-muted-foreground mt-1">Email verification required</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Authorization</p>
                  <p className="font-medium">Row-Level Security (RLS)</p>
                  <p className="text-xs text-muted-foreground mt-1">Per-company data isolation</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Multi-Tenancy</p>
                  <p className="font-medium">Company → User mapping</p>
                  <p className="text-xs text-muted-foreground mt-1">user_companies junction table</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data sources table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Supported Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Basins / Regions</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Oklahoma Corporation Commission</TableCell>
                    <TableCell>Oklahoma</TableCell>
                    <TableCell className="font-mono text-xs">ArcGIS REST</TableCell>
                    <TableCell>Anadarko, Arkoma, Cherokee</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Texas Railroad Commission</TableCell>
                    <TableCell>Texas</TableCell>
                    <TableCell className="font-mono text-xs">ArcGIS REST</TableCell>
                    <TableCell>Permian, Eagle Ford, Barnett</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">New Mexico OCD</TableCell>
                    <TableCell>New Mexico</TableCell>
                    <TableCell className="font-mono text-xs">ArcGIS REST</TableCell>
                    <TableCell>Delaware Basin</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-muted-foreground">Planned</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 2: Data Overview (Table) ═══════ */}
        <TabsContent value="data" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-xs text-muted-foreground">Total Wells</p>
                <p className="text-3xl font-bold text-primary">{loading ? "…" : wellStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-xs text-muted-foreground">States</p>
                <p className="text-3xl font-bold text-primary">{loading ? "…" : wellStats.byState.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-xs text-muted-foreground">Data Sources</p>
                <p className="text-3xl font-bold text-primary">{loading ? "…" : wellStats.bySource.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-xs text-muted-foreground">Status Types</p>
                <p className="text-3xl font-bold text-primary">{loading ? "…" : wellStats.byStatus.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent wells table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recently Imported Wells</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : wellStats.recentWells.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Database className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No wells imported yet</p>
                  <Button size="sm" onClick={() => navigate("/dashboard/data-collection")}>
                    Go to Data Collection
                  </Button>
                </div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Well Name</TableHead>
                        <TableHead>API</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>County</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Oil (bbl/d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wellStats.recentWells.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.well_name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{w.api_number || "—"}</TableCell>
                          <TableCell>{w.operator || "—"}</TableCell>
                          <TableCell>{w.state}</TableCell>
                          <TableCell>{w.county || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {w.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{w.source || "Manual"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {w.production_oil?.toFixed(1) ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 3: Analytics (Charts) ═══════ */}
        <TabsContent value="charts" className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading analytics…</p>
          ) : wellStats.total === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Database className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Import wells first to see analytics</p>
              <Button onClick={() => navigate("/dashboard/data-collection")}>
                Go to Data Collection
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Wells by State */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Wells by State</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={wellStats.byState}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Wells" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wells by Status (Pie) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Wells by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={wellStats.byStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {wellStats.byStatus.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wells by Source */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Wells by Data Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={wellStats.bySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={60} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Wells" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Database schema card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Database Schema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { table: "wells", cols: 22, desc: "Well records with production data", rls: true },
                    { table: "companies", cols: 4, desc: "Tenant organizations", rls: true },
                    { table: "user_companies", cols: 4, desc: "User ↔ Company mapping", rls: true },
                    { table: "core_analyses", cols: 7, desc: "CV analysis results", rls: true },
                  ].map((t) => (
                    <div key={t.table} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="font-mono text-sm font-medium">{t.table}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{t.cols} cols</span>
                        {t.rls && (
                          <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                            <Shield className="mr-1 h-3 w-3" />
                            RLS
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataPipeline;
