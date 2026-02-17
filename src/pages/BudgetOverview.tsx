import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, DollarSign, Calendar, Award, Users, TrendingDown, CheckCircle2 } from "lucide-react";

const budgetCategories = [
  {
    category: "1. Data & Data Pipeline",
    pct: "21.4%",
    items: [
      { name: "Geological data acquisition & licensing", low: 5000, base: 8000, high: 15000, notes: "Well logs, core samples, production data" },
      { name: "Data digitization & OCR processing", low: 3000, base: 5000, high: 8000, notes: "Converting legacy paper logs to digital" },
      { name: "Data cleaning & preprocessing", low: 4000, base: 6000, high: 10000, notes: "Quality assurance, normalization" },
      { name: "Data labeling & annotation", low: 8000, base: 12000, high: 18000, notes: "Expert geologist annotation for CV training" },
      { name: "Data pipeline infrastructure", low: 3000, base: 5000, high: 7000, notes: "ETL pipelines, data storage" },
    ],
    subtotal: { low: 23000, base: 36000, high: 58000 },
    adjusted: null,
  },
  {
    category: "2. AI/ML Model Development",
    pct: "34.4%",
    items: [
      { name: "Computer vision model (core analysis)", low: 12000, base: 18000, high: 25000, notes: "Core sample image recognition" },
      { name: "Well log analysis model", low: 8000, base: 12000, high: 18000, notes: "Automated log interpretation" },
      { name: "Predictive analytics (zone identification)", low: 10000, base: 15000, high: 22000, notes: "Optimal restoration zone prediction" },
      { name: "Model training & optimization", low: 5000, base: 8000, high: 12000, notes: "Hyperparameter tuning, validation" },
      { name: "GPU compute (training)", low: 3000, base: 5000, high: 8000, notes: "Partially offset by NVIDIA Inception credits" },
    ],
    subtotal: { low: 38000, base: 58000, high: 85000 },
    adjusted: null,
  },
  {
    category: "3. Backend & Infrastructure",
    pct: "12.5%",
    items: [
      { name: "API development", low: 5000, base: 8000, high: 12000, notes: "RESTful API, authentication, endpoints" },
      { name: "Database architecture", low: 3000, base: 4000, high: 6000, notes: "PostgreSQL + vector DB for embeddings" },
      { name: "Cloud infrastructure (6 months)", low: 4000, base: 6000, high: 10000, notes: "AWS/GCP — offset by startup credits" },
      { name: "CI/CD & DevOps", low: 2000, base: 3000, high: 5000, notes: "Deployment pipelines, monitoring" },
    ],
    subtotal: { low: 14000, base: 21000, high: 33000 },
    adjusted: { base: 8000, savings: 13000, reason: "API, auth, DB, and cloud already deployed via Lovable Cloud", remaining: "Production scaling, monitoring, CI/CD hardening" },
  },
  {
    category: "4. Frontend / User Interface",
    pct: "11.9%",
    items: [
      { name: "Dashboard UI (web application)", low: 6000, base: 10000, high: 15000, notes: "Interactive visualization of results" },
      { name: "Data upload & management module", low: 2000, base: 3000, high: 5000, notes: "File upload, data preview" },
      { name: "Reporting & export module", low: 2000, base: 3000, high: 4000, notes: "PDF reports, data export" },
      { name: "UX/UI design", low: 2000, base: 4000, high: 6000, notes: "Professional look for investor demos" },
    ],
    subtotal: { low: 12000, base: 20000, high: 30000 },
    adjusted: { base: 4000, savings: 16000, reason: "20+ modules, visualizations, and PDF export already built", remaining: "UX polish, real-user adaptation, responsive fine-tuning" },
  },
  {
    category: "5. Testing & Validation",
    pct: "6.5%",
    items: [
      { name: "Model accuracy testing", low: 3000, base: 4000, high: 6000, notes: "Benchmarking against known wells" },
      { name: "Field validation (pilot wells)", low: 2000, base: 4000, high: 8000, notes: "Real-world testing with Maxxwell SPT" },
      { name: "QA & bug fixing", low: 2000, base: 3000, high: 5000, notes: "End-to-end testing" },
    ],
    subtotal: { low: 7000, base: 11000, high: 19000 },
    adjusted: { base: 7400, savings: 3600, reason: "Existing test infrastructure and QA pipelines", remaining: "Field validation with pilot wells, ML model accuracy benchmarks" },
  },
  {
    category: "6. Project Management & Overhead",
    pct: "13.4%",
    items: [
      { name: "Project management", low: 3000, base: 5000, high: 8000, notes: "Coordination, milestones tracking" },
      { name: "Legal & IP protection", low: 2000, base: 3000, high: 5000, notes: "Patents, NDA, data agreements" },
      { name: "Contingency reserve (10%)", low: 9400, base: 14600, high: 22500, notes: "Buffer for unforeseen expenses" },
    ],
    subtotal: { low: 14400, base: 22600, high: 35500 },
    adjusted: { base: 19600, savings: 3000, reason: "Reduced contingency due to proven architecture", remaining: "Project coordination, IP/patent protection, reduced contingency" },
  },
];

const credits = [
  { program: "NVIDIA Inception + AWS Activate", savings: 100000, status: "Active Member", details: "Up to $100K cloud credits via AWS partner program, DGX Cloud access, preferred pricing", color: "bg-success/20 text-success" },
  { program: "Microsoft for Startups", savings: 25000, status: "To Apply", details: "Azure credits, GitHub Enterprise, technical support", color: "bg-primary/20 text-primary" },
  { program: "DOE SBIR Phase I Grant", savings: 275000, status: "Application Prep", details: "Up to $275K for Phase I R&D", color: "bg-accent/20 text-accent" },
  { program: "Google for Startups Cloud", savings: 50000, status: "To Apply", details: "GCP credits program", color: "bg-primary/20 text-primary" },
  { program: "Open source tools & frameworks", savings: 15000, status: "Available", details: "PyTorch, TensorFlow, Hugging Face, etc.", color: "bg-success/20 text-success" },
];

const timeline = [
  { task: "Data acquisition & processing", months: [true, true, false, false, false, false] },
  { task: "Data labeling & annotation", months: [false, true, true, false, false, false] },
  { task: "CV model development", months: [false, true, true, true, false, false] },
  { task: "Well log analysis model", months: [false, false, true, true, false, false] },
  { task: "Predictive analytics model", months: [false, false, false, true, true, false] },
  { task: "Backend & API development", months: [false, true, true, true, true, false] },
  { task: "Cloud infrastructure setup", months: [true, true, false, false, false, false] },
  { task: "Frontend / Dashboard UI", months: [false, false, true, true, true, false] },
  { task: "Integration & testing", months: [false, false, false, false, true, true] },
  { task: "Field validation (pilot)", months: [false, false, false, false, false, true] },
  { task: "Documentation & demo prep", months: [false, false, false, false, true, true] },
];

const milestones = [
  { month: 2, label: "Data ready" },
  { month: 3, label: "First model trained" },
  { month: 4, label: "Working prototype" },
  { month: 5, label: "MVP complete" },
  { month: 6, label: "Investor demo ready" },
];

const team = [
  { role: "ML Engineer (Senior)", type: "Contract", monthly: 12000, duration: 6, total: 72000, notes: "Core model development" },
  { role: "ML Engineer (Mid)", type: "Contract", monthly: 8000, duration: 5, total: 40000, notes: "Model training & optimization" },
  { role: "Full-Stack Developer", type: "Contract", monthly: 9000, duration: 5, total: 45000, notes: "Backend + Frontend" },
  { role: "Data Engineer", type: "Contract/PT", monthly: 6000, duration: 3, total: 18000, notes: "Data pipeline setup" },
  { role: "UX/UI Designer", type: "Contract/PT", monthly: 4000, duration: 2, total: 8000, notes: "Interface design" },
  { role: "Domain Expert (Geologist)", type: "Consultant", monthly: 5000, duration: 3, total: 15000, notes: "Data validation & labeling QA" },
  { role: "Project Manager", type: "Part-time", monthly: 3000, duration: 6, total: 18000, notes: "Coordination & milestones" },
];

const fmt = (n: number) => "$" + n.toLocaleString();

const originalTotal = 168600;
const adjustedTotal = 133000;
const totalSavings = originalTotal - adjustedTotal;

const BudgetOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">SGOM MVP Budget</h1>
            <p className="text-sm text-muted-foreground">Self-Learning Geological Object Model — Minimum Viable Product</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted"><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground">Original Budget</p>
              </div>
              <p className="text-2xl font-bold line-through opacity-60">{fmt(originalTotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20"><DollarSign className="h-5 w-5 text-primary" /></div>
                <p className="text-sm text-muted-foreground">Adjusted Budget</p>
              </div>
              <p className="text-2xl font-bold text-primary">{fmt(adjustedTotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/20"><TrendingDown className="h-5 w-5 text-success" /></div>
                <p className="text-sm text-muted-foreground">Prototype Savings</p>
              </div>
              <p className="text-2xl font-bold text-success">−{fmt(totalSavings)}</p>
              <p className="text-xs text-muted-foreground mt-1">21% reduction</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted"><Award className="h-5 w-5 text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground">Potential Credits</p>
              </div>
              <p className="text-2xl font-bold">{fmt(565000)}</p>
              <p className="text-xs text-muted-foreground mt-1">Net outlay: ~$0 (credits exceed budget)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="breakdown"><DollarSign className="h-4 w-4 mr-1.5" />Budget</TabsTrigger>
            <TabsTrigger value="timeline"><Calendar className="h-4 w-4 mr-1.5" />Timeline</TabsTrigger>
            <TabsTrigger value="credits"><Award className="h-4 w-4 mr-1.5" />Credits</TabsTrigger>
            <TabsTrigger value="team"><Users className="h-4 w-4 mr-1.5" />Team</TabsTrigger>
          </TabsList>

          {/* BREAKDOWN */}
          <TabsContent value="breakdown" className="space-y-6">
            {budgetCategories.map((cat) => (
              <Card key={cat.category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cat.category}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{cat.pct}</Badge>
                      {cat.adjusted && (
                        <Badge className="bg-success/20 text-success border-success/30">
                          −{fmt(cat.adjusted.savings)} saved
                        </Badge>
                      )}
                    </div>
                  </div>
                  {cat.adjusted && (
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      {cat.adjusted.reason}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Low</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">High</TableHead>
                        <TableHead className="hidden md:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cat.items.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium text-sm">{item.name}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(item.low)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{fmt(item.base)}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(item.high)}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.notes}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell>Subtotal</TableCell>
                        <TableCell className="text-right">{fmt(cat.subtotal.low)}</TableCell>
                        <TableCell className="text-right">
                          {cat.adjusted ? (
                            <span className="flex items-center justify-end gap-2">
                              <span className="line-through opacity-50">{fmt(cat.subtotal.base)}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-primary cursor-help underline decoration-dotted underline-offset-4">{fmt(cat.adjusted.base)}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-semibold text-xs mb-1">Remaining spend:</p>
                                    <p className="text-xs">{cat.adjusted.remaining}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          ) : fmt(cat.subtotal.base)}
                        </TableCell>
                        <TableCell className="text-right">{fmt(cat.subtotal.high)}</TableCell>
                        <TableCell className="hidden md:table-cell" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {/* Grand Total */}
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Grand Total — MVP Budget</p>
                    <div className="flex items-baseline gap-4">
                      <span className="text-3xl font-bold text-primary">{fmt(adjustedTotal)}</span>
                      <span className="text-lg line-through opacity-40">{fmt(originalTotal)}</span>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div><p className="text-muted-foreground">Low</p><p className="font-semibold">{fmt(108400)}</p></div>
                    <div><p className="text-muted-foreground">Base (adjusted)</p><p className="font-semibold text-primary">{fmt(adjustedTotal)}</p></div>
                    <div><p className="text-muted-foreground">High</p><p className="font-semibold">{fmt(260500)}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>6-Month Development Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Phase / Task</TableHead>
                        {[1,2,3,4,5,6].map(m => (
                          <TableHead key={m} className="text-center min-w-[80px]">Month {m}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeline.map((row) => (
                        <TableRow key={row.task}>
                          <TableCell className="font-medium text-sm">{row.task}</TableCell>
                          {row.months.map((active, i) => (
                            <TableCell key={i} className="text-center">
                              {active ? (
                                <div className="h-6 rounded bg-primary/20 border border-primary/40 mx-1" />
                              ) : null}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  {milestones.map((ms) => (
                    <div key={ms.label} className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mb-2 text-lg">★</div>
                      <p className="text-xs text-muted-foreground mb-1">Month {ms.month}</p>
                      <p className="text-sm font-semibold">{ms.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CREDITS */}
          <TabsContent value="credits" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {credits.map((c) => (
                <Card key={c.program}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{c.program}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.details}</p>
                      </div>
                      <Badge className={c.color + " border-0"}>{c.status}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">{fmt(c.savings)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-primary/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Total Potential Savings</p>
                  <p className="text-xl font-bold">{fmt(565000)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Adjusted MVP Budget</p>
                  <p className="text-xl font-bold">{fmt(adjustedTotal)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Conservative savings (30%)</p>
                  <p className="text-xl font-bold text-success">−{fmt(169500)}</p>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">Net Estimated Cash Outlay</p>
                  <p className="text-2xl font-bold text-primary">{fmt(0)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEAM */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Structure & Cost Estimates</CardTitle>
                <CardDescription className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>
                    <strong>Note:</strong> Team costs are already included in the {fmt(adjustedTotal)} adjusted MVP budget above. This breakdown shows the same budget allocated by role rather than by task category. It is not an additional expense.
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead className="text-center">Months</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="hidden md:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((t) => (
                      <TableRow key={t.role}>
                        <TableCell className="font-medium">{t.role}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{t.type}</Badge></TableCell>
                        <TableCell className="text-right">{fmt(t.monthly)}</TableCell>
                        <TableCell className="text-center">{t.duration}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(t.total)}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{t.notes}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={4}>Total Team Cost</TableCell>
                      <TableCell className="text-right">{fmt(216000)}</TableCell>
                      <TableCell className="hidden md:table-cell" />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BudgetOverview;
