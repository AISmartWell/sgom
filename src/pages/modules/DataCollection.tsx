import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataCollectionDemo } from "@/components/data-collection/DataCollectionDemo";
import { FieldScanDemo } from "@/components/data-collection/FieldScanDemo";
import { RealDataPanel } from "@/components/data-collection/RealDataPanel";
import WellMapLeaflet from "@/components/data-collection/WellMapLeaflet";
import {
  Database,
  Map,
  Radio,
  FileText,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RefreshCw,
} from "lucide-react";

const dataSources = [
  {
    name: "Interactive Well Maps",
    status: "connected",
    icon: Map,
    lastSync: "2 min ago",
    records: "15,847",
  },
  {
    name: "State Databases (Oklahoma)",
    status: "connected",
    icon: Database,
    lastSync: "5 min ago",
    records: "8,234",
  },
  {
    name: "State Databases (Texas)",
    status: "connected",
    icon: Database,
    lastSync: "5 min ago",
    records: "7,613",
  },
  {
    name: "Seismic Data Feeds",
    status: "loading",
    icon: Radio,
    lastSync: "Loading...",
    records: "—",
  },
  {
    name: "Well Log Archives",
    status: "loading",
    icon: FileText,
    lastSync: "Loading...",
    records: "—",
  },
  {
    name: "Production History",
    status: "ready",
    icon: BarChart3,
    lastSync: "Ready",
    records: "45,230",
  },
];

const dataTypes = [
  { name: "Monthly production (Oil/Gas/Water)", checked: true },
  { name: "Initial production rates", checked: true },
  { name: "Casing & tubing pressure", checked: true },
  { name: "Accidents, tests, transitions", checked: true },
  { name: "Completion data", checked: true },
  { name: "Well coordinates & depth", checked: true },
];

const logEntries = [
  { time: "09:14:22", message: "Connecting to Oklahoma well database..." },
  { time: "09:14:23", message: "Connection established" },
  { time: "09:14:25", message: "Scanning pre-set squares for wells..." },
  { time: "09:14:28", message: "Found 847 wells in Anadarko Basin" },
  { time: "09:14:30", message: "Fetching production history..." },
  { time: "09:14:35", message: "Processing well log data..." },
];

const DataCollection = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📡</span>
            <h1 className="text-3xl font-bold">Data Collection & Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Collect and integrate data from multiple sources
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Start Data Collection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Sources */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Data Sources Connected</CardTitle>
              <CardDescription>Status of all data feed connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <source.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last sync: {source.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{source.records} records</span>
                      <Badge
                        className={
                          source.status === "connected"
                            ? "bg-success/20 text-success border-success/30"
                            : source.status === "loading"
                            ? "bg-warning/20 text-warning border-warning/30"
                            : "bg-primary/20 text-primary border-primary/30"
                        }
                      >
                        {source.status === "connected" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {source.status === "loading" && <Clock className="mr-1 h-3 w-3 animate-spin" />}
                        {source.status === "ready" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {source.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Data Feed */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Live Data Feed</CardTitle>
              <CardDescription>Real-time activity log</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background/50 rounded-lg p-4 font-mono text-sm space-y-2 max-h-64 overflow-auto">
                {logEntries.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-muted-foreground">[{entry.time}]</span>
                    <span className="text-success">{entry.message}</span>
                  </div>
                ))}
                <div className="flex gap-3">
                  <span className="text-muted-foreground">[09:14:40]</span>
                  <span className="text-primary animate-pulse">Waiting for next scan...</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Data from Oklahoma OCC */}
          {/* Well Map */}
          <WellMapLeaflet />

          <RealDataPanel />

          {/* Field Scan Demo */}
          <FieldScanDemo />

          {/* Interactive Demo */}
          <DataCollectionDemo />
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          {/* Data Types */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Data Types Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataTypes.map((type, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm">{type.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technologies */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Technologies Involved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Machine Learning",
                  "Neural Networks",
                  "Deep Learning",
                  "Big Data",
                  "Cloud Computing",
                  "IoT Sensors",
                  "Geostatistics",
                ].map((tech, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Collection Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span>📅</span>
                <span className="text-muted-foreground">Schedule:</span>
                <span className="font-medium">Weekly auto-scan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>🗺️</span>
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">Oklahoma, Anadarko Basin</span>
              </div>
              <Progress value={68} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                68% of weekly scan complete
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;
