import { Fragment, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, type AppRole } from "@/hooks/useUserRole";
import {
  ArrowRight,
  Check,
  Lock,
  Upload,
  Cpu,
  FileBarChart,
  ShieldCheck,
  HardHat,
  Mountain,
  Gauge,
} from "lucide-react";

const DEMO_ROLES: AppRole[] = ["admin", "engineer", "geologist", "production"];

const ROLE_ICON: Record<string, typeof HardHat> = {
  admin: ShieldCheck,
  engineer: HardHat,
  geologist: Mountain,
  production: Gauge,
};

interface Capability {
  label: string;
  roles: AppRole[];
}

const CAPABILITIES: Capability[] = [
  { label: "Upload logs, cores, production history (OCR / import)", roles: ["admin", "engineer"] },
  { label: "Edit well records and document vault", roles: ["admin", "engineer"] },
  { label: "Run automation and registry scanning", roles: ["admin", "engineer"] },
  { label: "Open geophysical expertise and agent verdicts", roles: ["admin", "engineer", "geologist", "production"] },
  { label: "Review petrophysics, core and formation conclusions", roles: ["admin", "engineer", "geologist"] },
  { label: "Review production forecasts, gas reserves, economics", roles: ["admin", "engineer", "production"] },
  { label: "Open SPT work orders and reports", roles: ["admin", "engineer", "production"] },
  { label: "Assign roles to team members", roles: ["admin"] },
];

const STAGES = [
  {
    key: "input",
    title: "1 · DATA INPUT",
    icon: Upload,
    owner: "Engineer",
    items: ["Paper log OCR", "LAS / CSV import", "Core photos", "Production history"],
  },
  {
    key: "engine",
    title: "2 · PHYSICS + AI",
    icon: Cpu,
    owner: "Platform",
    items: ["Petrophysical Solver", "Material balance / P-Z", "AI agents", "Calibration loop"],
  },
  {
    key: "output",
    title: "3 · CONCLUSIONS",
    icon: FileBarChart,
    owner: "Geologist · Production",
    items: ["Agent verdicts", "Reserves & forecasts", "SPT candidates", "Work orders"],
  },
];

const RoleFlowDemo = () => {
  const [demoRole, setDemoRole] = useState<AppRole>("engineer");
  const canEdit = demoRole === "admin" || demoRole === "engineer";

  return (
    <div className="space-y-6">
      {/* Block diagram */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">How access flows through the platform</CardTitle>
          <CardDescription>
            Data enters once, the engine processes it, conclusions are published to reviewers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
            {STAGES.map((stage, i) => (
              <Fragment key={stage.key}>
                <div
                  className="rounded-sm border border-border/60 bg-background/40 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <stage.icon className="h-4 w-4 text-primary" />
                    <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      {stage.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {stage.owner}
                  </Badge>
                  <ul className="space-y-1">
                    {stage.items.map((it) => (
                      <li key={it} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="mt-[6px] h-1 w-1 rounded-full bg-primary/70 shrink-0" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-primary/60" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="mt-4 rounded-sm border border-dashed border-border/60 px-4 py-3 text-xs text-muted-foreground font-mono">
            WRITE ACCESS → stage 1 only (Administrator, Engineer) · READ ACCESS → stage 3
            (Geologist, Production engineer) · COMPANY SCOPE applies to every role
          </div>
        </CardContent>
      </Card>

      {/* Interactive demo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Live demo: pick a role</CardTitle>
          <CardDescription>
            Simulates what a team member sees. This preview does not change your own role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {DEMO_ROLES.map((r) => {
              const Icon = ROLE_ICON[r];
              const active = demoRole === r;
              return (
                <Button
                  key={r}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setDemoRole(r)}
                  data-readonly-allow
                  className="text-xs"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {ROLE_LABELS[r]}
                </Button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-sm border border-border/60 p-4 space-y-2">
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                PERMISSIONS
              </p>
              {CAPABILITIES.map((c) => {
                const allowed = c.roles.includes(demoRole);
                return (
                  <div key={c.label} className="flex items-start gap-2 text-xs">
                    {allowed ? (
                      <Check className="h-3.5 w-3.5 text-primary mt-[1px] shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/60 mt-[1px] shrink-0" />
                    )}
                    <span className={allowed ? "" : "text-muted-foreground/60 line-through"}>
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-sm border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  DATA ENTRY SCREEN PREVIEW
                </p>
                <Badge
                  variant="outline"
                  className={
                    canEdit
                      ? "text-[10px] font-mono border-primary/40 text-primary"
                      : "text-[10px] font-mono"
                  }
                >
                  {canEdit ? "EDITABLE" : "READ-ONLY"}
                </Badge>
              </div>

              <div className={canEdit ? "space-y-3" : "space-y-3 opacity-55 pointer-events-none"}>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-muted-foreground">API NUMBER</label>
                  <Input defaultValue="15-051-20137" className="h-9 text-xs" readOnly={!canEdit} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-muted-foreground">
                    POROSITY, %
                  </label>
                  <Input defaultValue="14.2" className="h-9 text-xs" readOnly={!canEdit} />
                </div>
                <Button size="sm" className="w-full text-xs" disabled={!canEdit}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Save well data
                </Button>
              </div>

              {!canEdit && (
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 mt-[1px] shrink-0" />
                  {ROLE_LABELS[demoRole]} sees the same screens, but inputs and save actions are
                  locked. Conclusions, forecasts and reports stay fully available.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleFlowDemo;
