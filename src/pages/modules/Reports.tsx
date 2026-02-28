import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ArrowLeft,
  Download,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Droplets,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();

  const results = [
    {
      icon: Droplets,
      label: "Production Increase",
      value: "5-10×",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Profit Year 1",
      value: "$1.25M",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: TrendingUp,
      label: "ROI",
      value: "312%",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Clock,
      label: "Payback",
      value: "7-8 mo",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const reports = [
    {
      name: "USA Investment.pdf",
      description: "Investment opportunity overview for US market",
      date: "Updated Jan 2025",
    },
    {
      name: "Business Action Plan.pdf",
      description: "Strategic action plan and milestones",
      date: "Updated Dec 2024",
    },
    {
      name: "AI Smart Well.pdf",
      description: "Complete platform documentation",
      date: "Updated Jan 2025",
    },
    {
      name: "Business Plan Maxxwell Production.pdf",
      description: "Maxxwell Production business strategy",
      date: "Updated Nov 2024",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✅</span>
            <h1 className="text-3xl font-bold">Project Results & Outputs</h1>
          </div>
          <p className="text-muted-foreground">
            Complete analysis results and downloadable reports
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export All Reports
        </Button>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {results.map((result, index) => (
          <Card key={index} className="glass-card">
            <CardContent className="pt-6">
              <div className={`h-12 w-12 rounded-xl ${result.bgColor} flex items-center justify-center mb-4`}>
                <result.icon className={`h-6 w-6 ${result.color}`} />
              </div>
              <p className={`text-3xl font-bold ${result.color}`}>{result.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{result.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Completion Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Analysis Completion Status</CardTitle>
            <CardDescription>All modules processing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Data Collection", status: "complete" },
              { name: "Geological Analysis", status: "complete" },
              { name: "AI Well Selection", status: "complete" },
              { name: "Reservoir Simulation", status: "complete" },
              { name: "Financial Forecast", status: "complete" },
              { name: "SPT Treatment Plan", status: "pending" },
            ].map((module, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      module.status === "complete" ? "text-success" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{module.name}</span>
                </div>
                <Badge
                  className={
                    module.status === "complete"
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {module.status === "complete" ? "Complete" : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Downloadable Reports */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Download detailed documentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Summary */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Key findings and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">Identified Opportunities</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>847 wells analyzed in Anadarko Basin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>127 high-potential SPT candidates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>Average 94% AI confidence score</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-success/5 rounded-xl border border-success/20">
                <h4 className="font-semibold mb-3 text-success">Financial Projections</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>$1.12M total investment required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>312% ROI over 4 years</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>7-8 month payback period</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-accent/5 rounded-xl border border-accent/20">
                <h4 className="font-semibold mb-3 text-accent">Recommendations</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>Prioritize top 20 wells for SPT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>Phase 1: 4 wells + 1 injection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <span>Scale to 100 wells in Year 2</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
