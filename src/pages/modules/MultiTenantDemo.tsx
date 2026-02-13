import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Database,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  created_at: string;
}

interface CompanyWithStats extends Company {
  wellCount: number;
  memberCount: number;
}

// Demo simulation data for isolation visualization
const DEMO_COMPANIES = [
  {
    id: "demo-alpha",
    name: "Alpha Petroleum LLC",
    wells: [
      { api: "35-017-00001", name: "Alpha #1", county: "CANADIAN", production: 145, waterCut: 22 },
      { api: "35-017-00002", name: "Alpha #2", county: "CANADIAN", production: 98, waterCut: 35 },
      { api: "35-017-00003", name: "Alpha #3", county: "GRADY", production: 210, waterCut: 12 },
      { api: "35-017-00004", name: "Alpha #4", county: "GRADY", production: 67, waterCut: 48 },
      { api: "35-017-00005", name: "Alpha #5", county: "CADDO", production: 178, waterCut: 18 },
    ],
    color: "hsl(var(--primary))",
  },
  {
    id: "demo-beta",
    name: "Beta Energy Corp",
    wells: [
      { api: "35-025-00001", name: "Beta East #1", county: "GARVIN", production: 120, waterCut: 30 },
      { api: "35-025-00002", name: "Beta East #2", county: "GARVIN", production: 85, waterCut: 42 },
      { api: "35-025-00003", name: "Beta West #1", county: "STEPHENS", production: 195, waterCut: 15 },
    ],
    color: "hsl(var(--chart-2))",
  },
];

const MultiTenantDemo = () => {
  const [activeTab, setActiveTab] = useState("management");
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Isolation demo state
  const [selectedDemoCompany, setSelectedDemoCompany] = useState(0);
  const [showIsolationAnimation, setShowIsolationAnimation] = useState(false);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      // Get user's companies
      const { data: memberships } = await supabase
        .from("user_companies")
        .select("company_id");

      if (!memberships || memberships.length === 0) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      const companyIds = memberships.map((m) => m.company_id);
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .in("id", companyIds);

      if (companyData) {
        const withStats: CompanyWithStats[] = [];
        for (const c of companyData) {
          const { count: wellCount } = await supabase
            .from("wells")
            .select("*", { count: "exact", head: true })
            .eq("company_id", c.id);

          const { count: memberCount } = await supabase
            .from("user_companies")
            .select("*", { count: "exact", head: true })
            .eq("company_id", c.id);

          withStats.push({
            ...c,
            wellCount: wellCount || 0,
            memberCount: memberCount || 0,
          });
        }
        setCompanies(withStats);
        if (!currentCompanyId && withStats.length > 0) {
          setCurrentCompanyId(withStats[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({ name: newCompanyName.trim() })
        .select()
        .single();

      if (companyError) throw companyError;

      const { error: memberError } = await supabase
        .from("user_companies")
        .insert({ user_id: user.id, company_id: company.id });

      if (memberError) throw memberError;

      toast.success(`Company "${company.name}" created`);
      setNewCompanyName("");
      await loadCompanies();
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setIsCreating(false);
    }
  };

  const switchCompany = (id: string) => {
    setCurrentCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      toast.success(`Switched to "${company.name}"`);
    }
  };

  const runIsolationDemo = () => {
    setShowIsolationAnimation(true);
    setTimeout(() => setShowIsolationAnimation(false), 3000);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const demoCompany = DEMO_COMPANIES[selectedDemoCompany];
  const otherDemoCompany = DEMO_COMPANIES[1 - selectedDemoCompany];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Multi-Tenant Architecture
          <Badge className="bg-primary/20 text-primary border-primary/30">DEMO</Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Enterprise data isolation — each operator's data is fully separated at the database level
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Management
          </TabsTrigger>
          <TabsTrigger value="isolation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Data Isolation
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: Company Management ===== */}
        <TabsContent value="management" className="space-y-6 mt-6">
          {/* Create Company */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                Create New Company
              </CardTitle>
              <CardDescription>
                Each company gets isolated data storage with separate well records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter company name..."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createCompany()}
                  className="max-w-sm"
                />
                <Button onClick={createCompany} disabled={isCreating || !newCompanyName.trim()}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Companies List */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Your Companies
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={loadCompanies} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : companies.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No companies found. Create one above to get started.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        currentCompanyId === company.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-border/50 bg-muted/20 hover:border-primary/50"
                      }`}
                      onClick={() => switchCompany(company.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm">{company.name}</h3>
                        {currentCompanyId === company.id && (
                          <Badge className="bg-success/20 text-success text-[10px]">ACTIVE</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Database className="h-3 w-3" />
                          <span>{company.wellCount} wells</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{company.memberCount} members</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                        {company.id.substring(0, 8)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Company Details */}
          {currentCompany && (
            <Card className="glass-card border-success/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Active: {currentCompany.name}
                </CardTitle>
                <CardDescription>
                  All data operations (wells, analysis, reports) are scoped to this company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-2xl font-bold">{currentCompany.wellCount}</p>
                    <p className="text-xs text-muted-foreground">Wells</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 text-center">
                    <p className="text-2xl font-bold">{currentCompany.memberCount}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 text-center">
                    <p className="text-2xl font-bold">RLS</p>
                    <p className="text-xs text-muted-foreground">Security</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/10 text-center">
                    <p className="text-2xl font-bold">✓</p>
                    <p className="text-xs text-muted-foreground">Isolated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB 2: Data Isolation Demo ===== */}
        <TabsContent value="isolation" className="space-y-6 mt-6">
          {/* Concept diagram */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Row-Level Security Isolation
              </CardTitle>
              <CardDescription>
                Each company sees only their own data — enforced at the PostgreSQL level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-muted-foreground">
{`┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                                                             │
│  ┌──────────────┐    RLS Policy    ┌──────────────────────┐ │
│  │  User Login   │───────────────→│  auth.uid() = ?      │ │
│  └──────────────┘                  └──────────┬───────────┘ │
│                                               │             │
│                    ┌──────────────────────────┐│             │
│                    │   user_companies table    ││             │
│                    │   user_id ←→ company_id   ││             │
│                    └──────────┬───────────────┘│             │
│                               │                │             │
│         ┌─────────────────────┴────────────────┘             │
│         │  WHERE company_id IN (user's companies)            │
│         │                                                    │
│    ┌────┴────────────────────────────────────────────┐       │
│    │              wells table                         │       │
│    │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │       │
│    │  │ Alpha's │  │ Beta's  │  │ Gamma's │  ...     │       │
│    │  │ wells   │  │ wells   │  │ wells   │         │       │
│    │  │ ✅ SHOW  │  │ ❌ HIDE │  │ ❌ HIDE │         │       │
│    │  └─────────┘  └─────────┘  └─────────┘         │       │
│    └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Selector */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Operator View Simulation
                </CardTitle>
                <CardDescription>Switch between operators to see data isolation in action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {DEMO_COMPANIES.map((c, i) => (
                    <Button
                      key={c.id}
                      variant={selectedDemoCompany === i ? "default" : "outline"}
                      onClick={() => {
                        setSelectedDemoCompany(i);
                        runIsolationDemo();
                      }}
                      className="flex-1"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {c.name}
                    </Button>
                  ))}
                </div>

                <Separator />

                {/* Visible wells */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-success" />
                    Visible Wells ({demoCompany.wells.length})
                  </p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1.5">
                      {demoCompany.wells.map((w) => (
                        <div
                          key={w.api}
                          className={`p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs transition-all ${
                            showIsolationAnimation ? "animate-pulse" : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-medium">{w.api}</span>
                            <Badge variant="outline" className="text-[10px] h-5">{w.county}</Badge>
                          </div>
                          <div className="flex justify-between mt-1 text-muted-foreground">
                            <span>{w.name}</span>
                            <span>{w.production} bbl/d · {w.waterCut}% WC</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            {/* Blocked data */}
            <Card className="glass-card border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-destructive" />
                  Blocked by RLS
                </CardTitle>
                <CardDescription>
                  Other company's data is invisible — enforced at database level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-destructive" />
                    {otherDemoCompany.name} — {otherDemoCompany.wells.length} wells hidden
                  </p>
                </div>

                <ScrollArea className="h-[200px]">
                  <div className="space-y-1.5">
                    {otherDemoCompany.wells.map((w) => (
                      <div
                        key={w.api}
                        className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs opacity-40 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-destructive/30" />
                        </div>
                        <div className="flex justify-between items-center blur-sm">
                          <span className="font-mono">••••-•••-•••••</span>
                          <Badge variant="outline" className="text-[10px] h-5">•••••</Badge>
                        </div>
                        <div className="flex justify-between mt-1 text-muted-foreground blur-sm">
                          <span>•••••••</span>
                          <span>••• bbl/d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* RLS explanation */}
                <div className="p-3 rounded-lg bg-muted/20 text-xs space-y-2">
                  <p className="font-semibold text-foreground">How it works:</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                      User authenticates → <code className="text-primary text-[10px]">auth.uid()</code> identified
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                      RLS checks <code className="text-primary text-[10px]">user_companies</code> junction table
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                      Only rows matching user's <code className="text-primary text-[10px]">company_id</code> are returned
                    </p>
                    <p className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                      Other companies' data is <strong className="text-destructive">invisible</strong> — not filtered, but truly inaccessible
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SQL Policy Display */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Active RLS Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { table: "wells", ops: "SELECT, INSERT, UPDATE, DELETE", desc: "Full CRUD isolation per company" },
                  { table: "companies", ops: "SELECT, INSERT", desc: "View & create companies via membership" },
                  { table: "user_companies", ops: "SELECT, INSERT", desc: "View & join company memberships" },
                ].map((p) => (
                  <div key={p.table} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                    <p className="font-mono text-primary text-sm font-semibold">{p.table}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.ops}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/10 font-mono text-[11px] text-muted-foreground overflow-x-auto">
                <span className="text-primary">CREATE POLICY</span> "Users can view wells from their companies"<br />
                <span className="text-primary">ON</span> public.wells <span className="text-primary">FOR SELECT</span><br />
                <span className="text-primary">USING</span> (company_id <span className="text-primary">IN</span> (<br />
                &nbsp;&nbsp;<span className="text-primary">SELECT</span> company_id <span className="text-primary">FROM</span> user_companies<br />
                &nbsp;&nbsp;<span className="text-primary">WHERE</span> user_id = <span className="text-success">auth.uid()</span><br />
                ));
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiTenantDemo;
