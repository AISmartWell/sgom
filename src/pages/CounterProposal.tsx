import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileText,
  DollarSign,
  Percent,
  Calendar,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CounterProposal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">CONFIDENTIAL</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Counter-Proposal</h1>
          <p className="text-lg text-muted-foreground">
            AI Smart Well — SGOM Platform · Development Agreement
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Context */}
        <Card className="mb-8 border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Original Proposal — Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/60 border">
                <p className="text-sm text-muted-foreground">Cash Fee</p>
                <p className="text-2xl font-bold">$37,500</p>
              </div>
              <div className="p-4 rounded-lg bg-background/60 border">
                <p className="text-sm text-muted-foreground">Equity Requested</p>
                <p className="text-2xl font-bold text-destructive">25%</p>
              </div>
              <div className="p-4 rounded-lg bg-background/60 border">
                <p className="text-sm text-muted-foreground">Implied Total Value</p>
                <p className="text-2xl font-bold text-destructive">~$637,500+</p>
                <p className="text-xs text-muted-foreground">at $2.39M Pre-Seed valuation</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                25% equity dilution is excessive for an 18-week development contract
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                Combined cost (~$637K) is 4.8× the full-market MVP estimate ($133K)
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                No vesting or cliff — immediate ownership without performance guarantees
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Option A */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">RECOMMENDED</Badge>
                <CardTitle className="text-xl">Option A — Higher Cash, Minimal Equity</CardTitle>
                <CardDescription>Reduced dilution with fair market compensation</CardDescription>
              </div>
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Development Fee: $60,000 — $80,000</p>
                    <p className="text-sm text-muted-foreground">
                      Payment schedule: 30% upfront, 40% at Milestone 3, 30% upon delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Equity: 3% — 5%</p>
                    <p className="text-sm text-muted-foreground">
                      Performance-based, contingent upon full MVP delivery and acceptance
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Vesting Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      4-year vesting · 1-year cliff · Monthly vesting thereafter
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Protections</p>
                    <p className="text-sm text-muted-foreground">
                      IP assignment clause · Non-compete (12 months) · NDA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-sm">Vesting Terms — Option A</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 1 (Cliff)</p>
                  <p className="font-bold">0%</p>
                  <p className="text-xs text-muted-foreground">Must complete MVP</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 1 (Post-cliff)</p>
                  <p className="font-bold">25% vested</p>
                  <p className="text-xs text-muted-foreground">~0.75% — 1.25%</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 2</p>
                  <p className="font-bold">50% vested</p>
                  <p className="text-xs text-muted-foreground">~1.5% — 2.5%</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 4</p>
                  <p className="font-bold">100% vested</p>
                  <p className="text-xs text-muted-foreground">3% — 5%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold text-primary">Total implied value:</span>{" "}
                $60K–$80K cash + $71K–$120K equity = <span className="font-bold">$131K–$200K</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fair and aligned with market rates for 18-week MVP development
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Option B */}
        <Card className="mb-8 border-accent/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2 bg-accent/10 text-accent border-accent/20">ALTERNATIVE</Badge>
                <CardTitle className="text-xl">Option B — Lower Cash, Moderate Equity</CardTitle>
                <CardDescription>Budget-friendly with structured equity incentive</CardDescription>
              </div>
              <Scale className="h-8 w-8 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Development Fee: $37,500</p>
                    <p className="text-sm text-muted-foreground">
                      Original cash amount maintained · Same milestone-based payments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Equity: 5% — 8%</p>
                    <p className="text-sm text-muted-foreground">
                      Subject to 4-year vesting with 1-year cliff and milestone triggers
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Vesting Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      4-year vesting · 1-year cliff · Quarterly vesting thereafter
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Acceleration Clause</p>
                    <p className="text-sm text-muted-foreground">
                      50% acceleration on successful fundraise ($2M+) within 12 months
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-sm">Vesting Terms — Option B</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 1 (Cliff)</p>
                  <p className="font-bold">0%</p>
                  <p className="text-xs text-muted-foreground">MVP must pass QA</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 1 (Post-cliff)</p>
                  <p className="font-bold">25% vested</p>
                  <p className="text-xs text-muted-foreground">~1.25% — 2%</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 2</p>
                  <p className="font-bold">50% vested</p>
                  <p className="text-xs text-muted-foreground">~2.5% — 4%</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground text-xs">Year 4</p>
                  <p className="font-bold">100% vested</p>
                  <p className="text-xs text-muted-foreground">5% — 8%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold text-accent">Total implied value:</span>{" "}
                $37.5K cash + $120K–$191K equity = <span className="font-bold">$157K–$229K</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Preserves cash while providing meaningful upside participation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Term</th>
                    <th className="text-center py-3 px-4 font-medium text-destructive">Original</th>
                    <th className="text-center py-3 px-4 font-medium text-primary">Option A</th>
                    <th className="text-center py-3 px-4 font-medium text-accent">Option B</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4">Cash Fee</td>
                    <td className="py-3 px-4 text-center">$37,500</td>
                    <td className="py-3 px-4 text-center font-semibold">$60K–$80K</td>
                    <td className="py-3 px-4 text-center">$37,500</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Equity</td>
                    <td className="py-3 px-4 text-center text-destructive font-bold">25%</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">3–5%</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">5–8%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Vesting</td>
                    <td className="py-3 px-4 text-center text-destructive">None</td>
                    <td className="py-3 px-4 text-center">4yr / 1yr cliff</td>
                    <td className="py-3 px-4 text-center">4yr / 1yr cliff</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Total Value</td>
                    <td className="py-3 px-4 text-center text-destructive">~$637K</td>
                    <td className="py-3 px-4 text-center text-primary">$131K–$200K</td>
                    <td className="py-3 px-4 text-center text-accent">$157K–$229K</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">IP Protection</td>
                    <td className="py-3 px-4 text-center text-destructive">Undefined</td>
                    <td className="py-3 px-4 text-center text-primary">Full assignment</td>
                    <td className="py-3 px-4 text-center text-accent">Full assignment</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Founder Dilution</td>
                    <td className="py-3 px-4 text-center text-destructive font-bold">Critical</td>
                    <td className="py-3 px-4 text-center text-primary font-bold">Minimal</td>
                    <td className="py-3 px-4 text-center text-accent font-bold">Moderate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Conditions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Mandatory Conditions (Both Options)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "IP Assignment", desc: "All code, models, and documentation become sole property of the Company upon creation" },
                { title: "Non-Compete", desc: "12-month non-compete in oil & gas AI/ML platforms upon termination" },
                { title: "Confidentiality (NDA)", desc: "Perpetual NDA covering proprietary technology, SPT methodology, and business data" },
                { title: "Milestone Acceptance", desc: "Each milestone requires written acceptance before payment release" },
                { title: "Code Quality Standards", desc: "TypeScript strict mode, >80% test coverage, CI/CD pipeline operational" },
                { title: "Good Leaver / Bad Leaver", desc: "Unvested equity forfeited on termination for cause; pro-rata vesting on good departure" },
                { title: "Anti-Dilution", desc: "Standard weighted-average anti-dilution protection for vested shares" },
                { title: "Right of First Refusal", desc: "Company retains ROFR on any equity transfer by development team" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            This document is for discussion purposes only and does not constitute a binding agreement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterProposal;
