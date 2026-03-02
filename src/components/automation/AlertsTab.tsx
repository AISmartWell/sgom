import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell, RefreshCw, Eye, Loader2, AlertTriangle, Droplets, Activity,
  TrendingDown, Info, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from "recharts";

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

const PIE_COLORS = ["hsl(var(--destructive))", "hsl(45 93% 47%)", "hsl(var(--primary))"];

const DEMO_ALERTS: WellAlert[] = [
  { id: "d1", well_id: "w1", company_id: "c1", alert_type: "production_drop", severity: "critical", message: "Oil production dropped 34% (1,200 → 792 bbl/day) — Well #A-117", previous_value: 1200, current_value: 792, is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "d2", well_id: "w2", company_id: "c1", alert_type: "water_cut_high", severity: "warning", message: "Water cut exceeded 70% threshold (74.2%) — Well #B-204", previous_value: 65, current_value: 74.2, is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "d3", well_id: "w3", company_id: "c1", alert_type: "status_change", severity: "info", message: "Well status changed: Active → Shut-in — Well #C-089", previous_value: null, current_value: null, is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "d4", well_id: "w4", company_id: "c1", alert_type: "production_drop", severity: "critical", message: "Oil production dropped 28% (890 → 641 bbl/day) — Well #D-312", previous_value: 890, current_value: 641, is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: "d5", well_id: "w5", company_id: "c1", alert_type: "water_cut_high", severity: "warning", message: "Water cut exceeded 70% threshold (71.8%) — Well #E-055", previous_value: 68, current_value: 71.8, is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "d6", well_id: "w1", company_id: "c1", alert_type: "status_change", severity: "info", message: "Well status changed: Drilling → Active — Well #A-117", previous_value: null, current_value: null, is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: "d7", well_id: "w6", company_id: "c1", alert_type: "production_drop", severity: "critical", message: "Oil production dropped 41% (1,540 → 909 bbl/day) — Well #F-198", previous_value: 1540, current_value: 909, is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
];

interface AlertsTabProps {
  alerts: WellAlert[];
  loading: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function AlertsTab({ alerts, loading, unreadCount, onRefresh, onMarkAsRead, onMarkAllRead }: AlertsTabProps) {
  const isDemo = alerts.length === 0;
  const displayAlerts = isDemo ? DEMO_ALERTS : alerts;

  const stats = useMemo(() => {
    const critical = displayAlerts.filter(a => a.severity === "critical").length;
    const warning = displayAlerts.filter(a => a.severity === "warning").length;
    const info = displayAlerts.filter(a => a.severity === "info").length;
    return { total: displayAlerts.length, critical, warning, info };
  }, [displayAlerts]);

  const pieData = useMemo(() => {
    const byType: Record<string, number> = {};
    displayAlerts.forEach(a => {
      const label = alertTypeLabels[a.alert_type] || a.alert_type;
      byType[label] = (byType[label] || 0) + 1;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [displayAlerts]);

  const barData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    displayAlerts.forEach(a => {
      const d = new Date(a.created_at);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }, [displayAlerts]);

  const statCards = [
    { label: "Total Alerts", value: stats.total, icon: Bell, colorClass: "text-foreground" },
    { label: "Critical", value: stats.critical, icon: AlertTriangle, colorClass: "text-destructive" },
    { label: "Warnings", value: stats.warning, icon: Droplets, colorClass: "text-yellow-500" },
    { label: "Info", value: stats.info, icon: Info, colorClass: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="border-muted">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${s.colorClass}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo banner */}
      {isDemo && !loading && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Demo visualization — real alerts will appear when well data changes.
        </div>
      )}

      {/* Charts row */}
      {displayAlerts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Alerts by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4} stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Alerts This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert list */}
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
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" />Refresh
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={onMarkAllRead}>
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
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {displayAlerts.map(alert => {
                const cfg = severityConfig[alert.severity] || severityConfig.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${cfg.bg} ${alert.is_read ? "opacity-60" : ""}`}
                    onClick={() => !alert.is_read && onMarkAsRead(alert.id)}
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
                          {!alert.is_read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
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

      {/* Alert rules */}
      <Card className="border-muted">
        <CardHeader><CardTitle className="text-base">Active Alert Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Production Drop</span>
              </div>
              <p className="text-xs text-muted-foreground">Triggers when oil production drops &gt;20%. Severity: Critical.</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-sm">High Water Cut</span>
              </div>
              <p className="text-xs text-muted-foreground">Triggers when water cut crosses 70%. Severity: Warning.</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Status Change</span>
              </div>
              <p className="text-xs text-muted-foreground">Triggers on any well status change. Severity: Info.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
