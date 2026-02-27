import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Cloud,
  Server,
  Database,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Globe,
  Cpu,
  BarChart3,
  FileText,
  ExternalLink,
  Copy,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AWSActivate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const awsServices = [
    {
      service: "Amazon SageMaker",
      amount: "$35,000",
      usage: "ML model training & deployment",
      detail: "Train custom computer vision models for core sample analysis. Fine-tune geological classification models on SageMaker Studio with GPU instances (ml.p3.8xlarge).",
      icon: Brain,
      color: "text-[#FF9900]",
      bg: "bg-[#FF9900]/10",
      priority: "critical",
    },
    {
      service: "Amazon EC2 (GPU)",
      amount: "$20,000",
      usage: "Inference & real-time processing",
      detail: "p3/g4dn instances for production AI inference. Run simultaneous analysis of multiple wells with auto-scaling based on demand.",
      icon: Cpu,
      color: "text-primary",
      bg: "bg-primary/10",
      priority: "critical",
    },
    {
      service: "Amazon RDS / Aurora",
      amount: "$12,000",
      usage: "Production database (multi-tenant)",
      detail: "PostgreSQL-compatible Aurora for multi-tenant well data storage. Separate schemas per client company with row-level security.",
      icon: Database,
      color: "text-accent",
      bg: "bg-accent/10",
      priority: "high",
    },
    {
      service: "Amazon S3",
      amount: "$8,000",
      usage: "Core sample images & seismic data",
      detail: "Store TB-scale geological imagery, seismic datasets, well logs, and PDF reports. S3 Intelligent-Tiering for cost optimization.",
      icon: Cloud,
      color: "text-success",
      bg: "bg-success/10",
      priority: "high",
    },
    {
      service: "AWS Lambda & API Gateway",
      amount: "$6,000",
      usage: "Serverless AI microservices",
      detail: "Event-driven architecture for IoT telemetry processing. Lambda functions triggered by sensor data with sub-100ms response time.",
      icon: Zap,
      color: "text-warning",
      bg: "bg-warning/10",
      priority: "high",
    },
    {
      service: "Amazon IoT Core",
      amount: "$7,000",
      usage: "Well sensor telemetry platform",
      detail: "MQTT-based telemetry from downhole sensors. Real-time pressure, temperature, and flow rate streaming from 50+ wells simultaneously.",
      icon: Globe,
      color: "text-[#FF9900]",
      bg: "bg-[#FF9900]/10",
      priority: "medium",
    },
    {
      service: "Amazon CloudFront & Shield",
      amount: "$5,000",
      usage: "CDN + DDoS protection",
      detail: "Global CDN for platform delivery to clients in US, Canada, Kazakhstan. AWS Shield Standard for enterprise-grade security.",
      icon: Shield,
      color: "text-destructive",
      bg: "bg-destructive/10",
      priority: "medium",
    },
    {
      service: "Amazon Bedrock",
      amount: "$7,000",
      usage: "Foundation AI models (fallback)",
      detail: "Access to Claude and Titan models via Bedrock as secondary AI layer. Geological report generation and anomaly explanations.",
      icon: Layers,
      color: "text-primary",
      bg: "bg-primary/10",
      priority: "medium",
    },
  ];

  const applicationText = {
     companyDescription: `AI Smart Well is an AI-powered Enhanced Oil Recovery (EOR) optimization platform leveraging Slot Perforation Technology (SPT). We automate geological analysis and well selection using computer vision and machine learning, reducing field engineer decision time from weeks to minutes.

We are an official member of the NVIDIA Inception Program and DOE SBIR Phase I grant applicant ($275,000). Our founding team has 15+ years in oil & gas operations combined with deep AI/ML expertise.`,

    problemStatement: `The U.S. has 2.9 million plugged or low-producing oil wells. SPT (Slot Perforation Technology) can reactivate 30–70% of abandoned wells at 1/10th the cost of drilling new ones — but identifying the right candidates requires geological expertise that takes weeks of manual analysis per field.

Currently, 80% of EOR decisions are made without AI assistance, leading to suboptimal well selection and leaving $3.2B/year in recoverable oil value untapped in the U.S. alone.`,

    solution: `AI Smart Well's platform ingests well logs, core sample imagery, production history, and seismic data to automatically:
1. Score and rank wells by SPT treatment potential (AI Well Ranking Engine)
2. Analyze core sample photography via computer vision (Core Analysis Module)
3. Calculate optimal SPT parameters per geological formation (SPT Parameters Engine)
4. Forecast 25-year production curves and ROI with 87% accuracy (Economic Analysis)
5. Stream real-time IoT telemetry from downhole sensors (Telemetry Architecture)

MVP is live at https://sgom.lovable.app with all 5 modules operational.`,

    awsUsePlan: `Requested AWS Activate credits ($100,000) will be allocated over 18 months:

Phase 1 — MVP to Production (Months 1-6): $40,000
• SageMaker: Train initial computer vision models on 5,000 labeled core sample images
• EC2 GPU: Deploy inference endpoints for real-time analysis (p3.2xlarge)
• RDS Aurora: Multi-tenant database for first 10 paying clients
• S3: Archive geological datasets from Maxxwell Production pilot (Texas, 4 wells)

Phase 2 — Field Validation (Months 7-12): $35,000
• SageMaker: Fine-tune models on production feedback, expand to seismic interpretation
• IoT Core: Connect 50+ sensors from partner wells in Texas and Kazakhstan
• Lambda: Scale telemetry processing to handle real-time streaming
• CloudFront: Global delivery for clients in multiple regions

Phase 3 — Scale (Months 13-18): $25,000
• Multi-region deployment (us-east-1, eu-west-1, ap-southeast-1)
• SageMaker Pipelines: Automated model retraining on new field data
• Amazon Bedrock: Geological report generation at scale`,

    traction: `• MVP Live: sgom.lovable.app — all 19 modules operational
• NVIDIA Inception: Official program member (accepted Q1 2026)
• DOE SBIR Phase I: Application in progress ($275,000 grant)
• Pilot Partner: Maxxwell Production Data (Texas, USA) — 4 wells
• Technology: $565,000 in non-dilutive cloud credits secured (NVIDIA, Google, Microsoft)
• Fundraising: Pre-Seed/Seed round $2.39M (NVIDIA Capital Connect pipeline)`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Platform
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#FF9900]/20 flex items-center justify-center">
                <span className="text-2xl">☁️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">AWS Activate Application</h1>
                <p className="text-muted-foreground">$100,000 Cloud Credits Request — AI Smart Well MVP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-[#FF9900] text-black font-bold text-sm px-3 py-1">
                $100K Requested
              </Badge>
              <Button
                size="sm"
                onClick={() => window.open("https://aws.amazon.com/startups/startup-programs/", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Apply on AWS
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive Summary */}
        <Card className="border-[#FF9900]/30 bg-gradient-to-r from-[#FF9900]/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-[#FF9900]" />
              Program: AWS Activate Portfolio ($100K Tier)
            </CardTitle>
            <CardDescription>
              AWS Activate for VC-backed startups with NVIDIA Inception affiliation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-[#FF9900]/10">
                <div className="text-3xl font-bold text-[#FF9900]">$100K</div>
                <div className="text-sm text-muted-foreground">AWS Credits</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-3xl font-bold text-primary">18 mo</div>
                <div className="text-sm text-muted-foreground">Usage Period</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10">
                <div className="text-3xl font-bold text-success">5</div>
                <div className="text-sm text-muted-foreground">AWS Services</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/10">
                <div className="text-3xl font-bold text-accent">$0</div>
                <div className="text-sm text-muted-foreground">Cash Outlay</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Allocation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "AI / ML (SageMaker + EC2)", amount: "$55,000", pct: 55, color: "bg-[#FF9900]" },
            { label: "Data & Storage (RDS + S3)", amount: "$20,000", pct: 20, color: "bg-primary" },
            { label: "IoT + Serverless + CDN", amount: "$25,000", pct: 25, color: "bg-success" },
          ].map((item) => (
            <Card key={item.label} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-bold">{item.amount}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
                <div className="text-right text-xs text-muted-foreground mt-1">{item.pct}%</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="services">AWS Services</TabsTrigger>
            <TabsTrigger value="application">Application Text</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* AWS Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {awsServices.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.service} className="hover:border-[#FF9900]/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{item.service}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={item.priority === "critical" ? "default" : item.priority === "high" ? "secondary" : "outline"}
                                className={`text-xs ${item.priority === "critical" ? "bg-destructive" : ""}`}
                              >
                                {item.priority}
                              </Badge>
                              <span className="font-bold text-[#FF9900]">{item.amount}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.usage}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Total */}
            <Card className="border-[#FF9900]/50 bg-[#FF9900]/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-[#FF9900]" />
                    <div>
                      <div className="font-semibold text-lg">Total AWS Credits Requested</div>
                      <div className="text-sm text-muted-foreground">18-month consumption plan across 8 services</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[#FF9900]">$100,000</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application Text Tab */}
          <TabsContent value="application" className="space-y-4">
            {[
              { label: "Company Description", key: "companyDescription", text: applicationText.companyDescription },
              { label: "Problem Statement", key: "problemStatement", text: applicationText.problemStatement },
              { label: "Our Solution", key: "solution", text: applicationText.solution },
              { label: "AWS Credits Usage Plan", key: "awsUsePlan", text: applicationText.awsUsePlan },
              { label: "Traction & Validation", key: "traction", text: applicationText.traction },
            ].map((section) => (
              <Card key={section.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#FF9900]" />
                      {section.label}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyText(section.text, section.label)}
                      className="h-7 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {copied === section.label ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans bg-muted/30 rounded-lg p-4">
                    {section.text}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Eligibility Tab */}
          <TabsContent value="eligibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AWS Activate Portfolio — Eligibility Checklist</CardTitle>
                <CardDescription>Requirements for $100K credit tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { item: "VC/Accelerator backed or referred", status: true, note: "NVIDIA Inception Program member (can refer)" },
                  { item: "Early-stage startup (Series B or earlier)", status: true, note: "Pre-Seed stage, raising $2.39M" },
                  { item: "Working product / MVP", status: true, note: "Live MVP at sgom.lovable.app — 19 modules" },
                  { item: "Not previously received AWS Activate $100K tier", status: true, note: "First AWS Activate application" },
                  { item: "Less than $10M in funding raised", status: true, note: "No funding raised yet (pre-seed)" },
                  { item: "Valid business entity (LLC/Corp)", status: true, note: "AI Smart Development Corporation — USA" },
                  { item: "AWS account in good standing", status: true, note: "Create new or use existing account" },
                ].map((check, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${check.status ? "text-success" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{check.item}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{check.note}</div>
                    </div>
                    <Badge variant={check.status ? "default" : "outline"} className={`text-xs ${check.status ? "bg-success" : ""}`}>
                      {check.status ? "✓ Met" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#FF9900]" />
                  Application Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-[#FF9900]/30 bg-[#FF9900]/5">
                  <h4 className="font-semibold mb-2">Referral Path (Recommended)</h4>
                  <p className="text-sm text-muted-foreground">
                    NVIDIA Inception Program members can be referred directly to AWS Activate Portfolio tier. 
                    Contact your NVIDIA Inception representative to request a referral code — this gives immediate 
                    access to the $100K tier without needing VC backing.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">Direct Application Path</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply at <span className="font-mono text-primary">aws.amazon.com/startups</span> under 
                    "AWS Activate Portfolio". Select "Accelerator/Incubator" as organization type and list 
                    NVIDIA Inception as supporting program. Processing time: 1–5 business days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>18-Month AWS Consumption Plan</CardTitle>
                <CardDescription>Phased credit usage aligned with product milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    phase: "Phase 1",
                    period: "Months 1–6",
                    budget: "$40,000",
                    pct: 40,
                    title: "MVP → Production",
                    color: "bg-[#FF9900]",
                    textColor: "text-[#FF9900]",
                    milestones: [
                      "Train first CV model on 5,000 core images (SageMaker)",
                      "Deploy GPU inference for real-time well scoring (EC2 p3)",
                      "Launch multi-tenant RDS for first 10 clients",
                      "S3 data lake: 4-well pilot with Maxxwell Production",
                    ],
                  },
                  {
                    phase: "Phase 2",
                    period: "Months 7–12",
                    budget: "$35,000",
                    pct: 35,
                    title: "Field Validation",
                    color: "bg-primary",
                    textColor: "text-primary",
                    milestones: [
                      "IoT Core: Connect 50+ downhole sensors",
                      "Fine-tune seismic interpretation model",
                      "Lambda: Real-time telemetry processing at scale",
                      "Expand to Kazakhstan pilot field",
                    ],
                  },
                  {
                    phase: "Phase 3",
                    period: "Months 13–18",
                    budget: "$25,000",
                    pct: 25,
                    title: "Scale",
                    color: "bg-success",
                    textColor: "text-success",
                    milestones: [
                      "Multi-region deployment (us-east-1, eu-west-1)",
                      "SageMaker Pipelines: Auto-retraining on new data",
                      "Amazon Bedrock: AI report generation at scale",
                      "Target: 10+ paying enterprise clients",
                    ],
                  },
                ].map((phase) => (
                  <div key={phase.phase} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${phase.color} text-white`}>{phase.phase}</Badge>
                        <span className="font-semibold">{phase.title}</span>
                        <span className="text-sm text-muted-foreground">{phase.period}</span>
                      </div>
                      <span className={`font-bold ${phase.textColor}`}>{phase.budget}</span>
                    </div>
                    <Progress value={phase.pct} className="h-2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      {phase.milestones.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success flex-shrink-0" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-lg bg-[#FF9900]/10 border border-[#FF9900]/30 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Expected Outcome by Month 18</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        10+ enterprise clients • $1M ARR pipeline • 3 international fields
                      </div>
                    </div>
                    <BarChart3 className="h-8 w-8 text-[#FF9900]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-[#FF9900]/10 via-primary/5 to-accent/10 border-[#FF9900]/30">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="text-4xl">☁️</div>
              <h2 className="text-2xl font-bold">Ready to Apply for AWS Activate</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Use the Application Text tab to copy ready-made answers for the AWS Activate form. 
                Apply via NVIDIA Inception referral for the fastest path to the $100K portfolio tier.
              </p>
              <div className="flex justify-center gap-4 pt-4 flex-wrap">
                <Button
                  size="lg"
                  className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-bold"
                  onClick={() => window.open("https://aws.amazon.com/startups/startup-programs/", "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply on AWS Activate
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/nvidia-inception")}
                >
                  <Server className="mr-2 h-4 w-4" />
                  NVIDIA Inception (for referral)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AWSActivate;
