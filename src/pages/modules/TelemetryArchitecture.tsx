import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Cpu, Cloud, Shield, MonitorDot, ArrowDown, Wifi } from "lucide-react";

const steps = [
  {
    icon: Radio,
    title: "Restored Well",
    subtitle: "Maxwell Production",
    description: "After restoration, wellhead sensors are installed to monitor pressure, flow rate, and temperature in real time.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  {
    icon: Cpu,
    title: "RTU / Controller",
    subtitle: "Remote Terminal Unit",
    description: "Collects raw sensor data, performs initial processing and buffering. Transmits readings every 1–15 minutes.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    icon: Wifi,
    title: "Data Transport",
    subtitle: "HTTP / MQTT / SCADA",
    description: "IoT gateway sends telemetry to the platform endpoint via secure protocols. Supports multiple communication standards.",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
  },
  {
    icon: Cloud,
    title: "Telemetry Ingestion API",
    subtitle: "Edge Function Endpoint",
    description: "Serverless function validates, normalizes, and stores incoming telemetry data. Auto-scales with traffic volume.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    icon: Shield,
    title: "RLS Policy Engine",
    subtitle: "Data Isolation by company_id",
    description: "Row-Level Security ensures each client only sees their own wells. Based on auth.uid() → user_companies mapping.",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  {
    icon: MonitorDot,
    title: "Real-Time Dashboard",
    subtitle: "Client Portal",
    description: "Live monitoring with automatic alerts: Critical (pressure < 500 psi), Warning (water cut > 70%). Aggregated analytics.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
];

const protocols = [
  { name: "HTTP/REST", desc: "Standard web protocol, easy integration", icon: "🌐" },
  { name: "MQTT", desc: "Lightweight IoT protocol, low bandwidth", icon: "📡" },
  { name: "SCADA Adapter", desc: "Legacy system integration", icon: "🏭" },
];

const sensorTypes = [
  { name: "Pressure", unit: "psi", range: "0 – 10,000", icon: "⏲️" },
  { name: "Flow Rate", unit: "bbl/day", range: "0 – 5,000", icon: "🛢️" },
  { name: "Temperature", unit: "°F", range: "50 – 400", icon: "🌡️" },
  { name: "Water Cut", unit: "%", range: "0 – 100", icon: "💧" },
];

const TelemetryArchitecture = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Telemetry Architecture
        </h1>
        <p className="text-muted-foreground text-lg">
          End-to-end data pipeline from wellhead sensors to the client dashboard
        </p>
      </div>

      {/* Flow diagram */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center">
            <Card className={`glass-card ${step.borderColor} border w-full max-w-2xl mx-auto`}>
              <CardContent className="flex items-start gap-5 p-6">
                <div className={`${step.bgColor} p-3 rounded-xl flex-shrink-0`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge variant="outline" className={`${step.color} border-current text-xs`}>
                      Step {index + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{step.subtitle}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
            {index < steps.length - 1 && (
              <div className="flex flex-col items-center py-2">
                <ArrowDown className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Protocols */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="h-5 w-5 text-violet-400" />
              Supported Protocols
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {protocols.map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sensor types */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Sensor Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sensorTypes.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{s.range}</p>
                  <p className="text-xs text-primary font-mono">{s.unit}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TelemetryArchitecture;
