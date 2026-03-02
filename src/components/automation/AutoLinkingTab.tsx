import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, Upload, Database, Search, CheckCircle2, XCircle, Image } from "lucide-react";

const DEMO_STATS = { linked: 847, unlinked: 23, total: 870 };

const flowSteps = [
  { icon: Upload, label: "Core Image Upload", desc: "Image with API number uploaded" },
  { icon: Database, label: "Trigger Fires", desc: "trg_auto_link_core_image" },
  { icon: Search, label: "Wells Table Match", desc: "Search by API number + company_id" },
  { icon: Link2, label: "Auto-Link", desc: "well_id set automatically" },
];

export function AutoLinkingTab() {
  const pct = Math.round((DEMO_STATS.linked / DEMO_STATS.total) * 100);

  return (
    <div className="space-y-4">
      {/* Trigger status */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Automatic Data Linking
          </CardTitle>
          <CardDescription>Core images are automatically linked to wells by API number on upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active trigger indicator */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Database Trigger Active</h4>
              <p className="text-xs text-muted-foreground">
                <code className="bg-muted px-1 rounded text-[10px]">trg_auto_link_core_image</code> — fires on INSERT/UPDATE
              </p>
            </div>
            <Badge className="ml-auto bg-green-500/15 text-green-600 border-green-500/30">Active</Badge>
          </div>

          {/* Animated flowchart */}
          <div className="relative">
            <p className="font-medium text-sm mb-4">Linking Process Flow</p>
            <div className="flex flex-col sm:flex-row items-stretch gap-0">
              {flowSteps.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div
                    className="flex-1 p-4 rounded-xl border border-primary/20 bg-card text-center animate-fade-in"
                    style={{ animationDelay: `${i * 150}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-semibold">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div className="hidden sm:flex items-center px-1">
                      <div className="w-6 h-0.5 bg-primary/40 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-primary/40" />
                        <div className="absolute inset-0 bg-primary/60 animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="border-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{DEMO_STATS.linked}</p>
                  <p className="text-xs text-muted-foreground">Linked</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold">{DEMO_STATS.unlinked}</p>
                  <p className="text-xs text-muted-foreground">Unlinked</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{pct}%</p>
                  <p className="text-xs text-muted-foreground">Match Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info cards */}
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
    </div>
  );
}
