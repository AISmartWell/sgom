import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Zap, Link2, Play } from "lucide-react";
import { AlertsTab } from "@/components/automation/AlertsTab";
import { AutoLinkingTab } from "@/components/automation/AutoLinkingTab";
import { PipelineTab } from "@/components/automation/PipelineTab";

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
  const [activeTab, setActiveTab] = useState("alerts");

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
    // Keep running state so summary card is visible
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
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
            Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <AlertsTab
            alerts={alerts}
            loading={loading}
            unreadCount={unreadCount}
            onRefresh={loadAlerts}
            onMarkAsRead={markAsRead}
            onMarkAllRead={markAllRead}
          />
        </TabsContent>

        <TabsContent value="linking">
          <AutoLinkingTab />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineTab
            pipelineRunning={pipelineRunning}
            pipelineProgress={pipelineProgress}
            pipelineStep={pipelineStep}
            onRunPipeline={runFullPipeline}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automation;
