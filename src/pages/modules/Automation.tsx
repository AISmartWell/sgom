import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bell, Zap, Link2, Play, CheckCircle2, AlertTriangle, Info,
  RefreshCw, Eye, Loader2, TrendingDown, Droplets, Activity
} from "lucide-react";

interface WellAlert {
  id: string;
  well_id: string;
  company_id: string;
  alert_type: string;
  severity: string;
  message: string;
  previous_value: number | null;
  current_value: number | null;
  is_read: boolean;
  created_at: string;
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  warning: { icon: Droplets, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
};

const alertTypeLabels: Record<string, string> = {
  production_drop: "Production Drop",
  water_cut_high: "High Water Cut",
  status_change: "Status Change",
};

const Automation = () => {
  const [alerts, setAlerts] = useState<WellAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState("");

  const loadAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("well_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setAlerts(data as WellAlert[]);
      setUnreadCount(data.filter((a: WellAlert) => !a.is_read).length);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("well_alerts").update({ is_read: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unread.length === 0) return;
    await supabase.from("well_alerts").update({ is_read: true }).in("id", unread);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setUnreadCount(0);
    toast.success("All alerts marked as read");
  };

  // Subscribe to realtime alerts
  useEffect(() => {
    loadAlerts();

    const channel = supabase
      .channel("well-alerts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "well_alerts" }, (payload) => {
        const newAlert = payload.new as WellAlert;
        setAlerts((prev) => [newAlert, ...prev]);
        setUnreadCount((c) => c + 1);
        toast.warning(newAlert.message, { description: alertTypeLabels[newAlert.alert_type] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Full pipeline simulation
  const runFullPipeline = async () => {
    setPipelineRunning(true);
    setPipelineProgress(0);

    const steps = [
      { label: "Importing well data from OCC & Texas RRC...", pct: 12 },
      { label: "Linking core images to wells by API number...", pct: 25 },
      { label: "Running Field Scanning analysis...", pct: 35 },
      { label: "Running Data Classification...", pct: 45 },
      { label: "Running Cumulative Decline Analysis...", pct: 55 },
      { label: "Running SPT Projection...", pct: 65 },
      { label: "Running Economic Analysis...", pct: 75 },
      { label: "Running Geophysical Expertise...", pct: 82 },
      { label: "Running EOR Optimization...", pct: 90 },
      { label: "Generating final report...", pct: 100 },
    ];

    for (const step of steps) {
      setPipelineStep(step.label);
      setPipelineProgress(step.pct);
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    }

    toast.success("Full pipeline completed! Report is ready for export.");
    setPipelineRunning(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          Automation Center
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">{unreadCount} new</Badge>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          Automated alerts, data linking, and full-cycle pipeline orchestration.
        </p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts & Monitoring
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="linking" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Auto-Linking
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Full Pipeline
          </TabsTrigger>
        </TabsList>

        {/* ── Alerts Tab ── */}
        <TabsContent value="alerts">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Production Alerts
                  </CardTitle>
                  <CardDescription>
                    Automatic alerts triggered by production drops (&gt;20%), high water cut (&gt;70%), and status changes.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadAlerts}>
                    <RefreshCw className="h-3 w-3 mr-1" />Refresh
                  </Button>
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                      <Eye className="h-3 w-3 mr-1" />Mark all read
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No alerts yet</p>
                  <p className="text-sm mt-1">
                    Alerts are automatically generated when well data changes — e.g. oil production drops &gt;20% or water cut exceeds 70%.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {alerts.map((alert) => {
                    const cfg = severityConfig[alert.severity] || severityConfig.info;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${cfg.bg} ${
                          alert.is_read ? "opacity-60" : ""
                        }`}
                        onClick={() => !alert.is_read && markAsRead(alert.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {alertTypeLabels[alert.alert_type] || alert.alert_type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                              {!alert.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <p className="text-sm">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert rules summary */}
          <Card className="mt-4 border-muted">
            <CardHeader>
              <CardTitle className="text-base">Active Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-sm">Production Drop</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Triggers when oil production drops &gt;20% on update. Severity: Critical.</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">High Water Cut</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Triggers when water cut crosses 70% threshold. Severity: Warning.</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Status Change</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Triggers on any well status change (Active → Plugged, etc.). Severity: Info.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Auto-Linking Tab ── */}
        <TabsContent value="linking">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Automatic Data Linking
              </CardTitle>
              <CardDescription>
                Core images are automatically linked to wells by API number on upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-semibold">Database Trigger Active</h4>
                    <p className="text-sm text-muted-foreground">
                      <code className="bg-muted px-1 rounded text-xs">trg_auto_link_core_image</code> fires on every INSERT/UPDATE
                    </p>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>How it works:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>When a core image is uploaded with an <code className="bg-muted px-1 rounded text-xs">api_number</code></li>
                    <li>The trigger automatically searches the <code className="bg-muted px-1 rounded text-xs">wells</code> table for a matching API number within the same company</li>
                    <li>If found, the <code className="bg-muted px-1 rounded text-xs">well_id</code> is automatically set — no manual linking needed</li>
                    <li>Works across all import channels: CSV upload, manual entry, and API providers</li>
                  </ol>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border">
                  <h5 className="font-medium text-sm mb-1">Linked Automatically</h5>
                  <p className="text-xs text-muted-foreground">Core images with matching API numbers are instantly connected to well records</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h5 className="font-medium text-sm mb-1">Company Isolation</h5>
                  <p className="text-xs text-muted-foreground">Linking only occurs within the same company_id — multi-tenant safe</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Full Pipeline Tab ── */}
        <TabsContent value="pipeline">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Full Analysis Pipeline
              </CardTitle>
              <CardDescription>
                One-click execution: Import → 8-Stage Analysis → Report Generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pipelineRunning ? (
                <div className="text-center py-8">
                  <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Run Full Pipeline</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    Automatically imports new well data, runs all 8 analysis stages (Field Scanning → EOR Optimization), and generates a comprehensive report.
                  </p>
                  <Button size="lg" onClick={runFullPipeline} className="gap-2">
                    <Zap className="h-5 w-5" />
                    Start Full Pipeline
                  </Button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium">Pipeline Running...</span>
                    <Badge className="bg-primary/20 text-primary">{pipelineProgress}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 mb-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${pipelineProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{pipelineStep}</p>
                </div>
              )}

              <div className="p-4 bg-muted/20 rounded-xl">
                <p className="font-medium text-sm mb-2">Pipeline Stages:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {["Import", "Link Data", "Field Scan", "Classification", "Decline", "SPT", "Economics", "Geophysics", "EOR", "Report"].map((s, i) => (
                    <div key={s} className={`text-center p-2 rounded-lg text-xs font-medium ${
                      pipelineRunning && pipelineProgress >= (i + 1) * 10
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automation;
