import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, CircleDashed, FileText, Database, Layers, ClipboardCheck } from "lucide-react";

const WELLS_COUNT = 10;

const slbDataItems = [
  {
    item: "Full wireline log suite in LAS format",
    purpose: "GR, resistivity, density, neutron, SP — the basis for petrophysical interpretation",
    required: true,
  },
  {
    item: "Production history (monthly oil / gas / water)",
    purpose: "Decline-curve analysis, cumulative recovery, remaining potential",
    required: true,
  },
  {
    item: "Completion & perforation records",
    purpose: "Existing intervals vs. identified bypassed pay",
    required: true,
  },
  {
    item: "Casing / liner program",
    purpose: "SPT tool access, slotting feasibility, depth constraints",
    required: true,
  },
  {
    item: "Reservoir pressure & temperature (BHP / BHT)",
    purpose: "Depletion estimate, SPT operating envelope",
    required: false,
  },
  {
    item: "Fluid properties (gas composition, H₂S / CO₂, water salinity)",
    purpose: "Fluid-dependent risk thresholds, Rw for Archie water saturation",
    required: false,
  },
  {
    item: "Well schematics & intervention history",
    purpose: "Mechanical condition, prior workovers, wellbore access",
    required: false,
  },
];

const analysisStages = [
  {
    stage: "Stage 2",
    name: "Data ingestion & classification",
    detail: "LAS import with interval selection, document parsing, data-quality flags (units, gaps, anomalies)",
  },
  {
    stage: "Stage 8",
    name: "Petrophysical interpretation",
    detail: "Porosity, Archie water saturation, Timur permeability, net-pay cutoffs per interval",
  },
  {
    stage: "Stage 4",
    name: "Cumulative production analysis",
    detail: "Arps decline curves, IOIP estimate, remaining reserves vs. economic limit",
  },
  {
    stage: "Stage 6",
    name: "SPT screening & ranking",
    detail: "Candidate intervals ranked by the same interpretWellLog logic used platform-wide; fluid-dependent risk cutoffs (gas 0.1 mD, oil 1 mD)",
  },
  {
    stage: "Stage 9",
    name: "EOR / restoration recommendation",
    detail: "SPT-first recommendation with restoration potential per well",
  },
  {
    stage: "Review",
    name: "Geophysicist verification",
    detail: "Every preliminary verdict reviewed by a qualified geophysicist; corrections tracked in the audit log",
  },
];

const deliverables = [
  "Per-well verdict report (PDF): SPT candidate / conditional / not recommended, with factors and risks",
  "Ranked portfolio table across all 10 wells — priority order for restoration spending",
  "SPT slot plan draft for each candidate well (intervals, slot density, phasing)",
  "Full audit trail: every data input and verdict decision logged",
];

const SLBPilotPlan = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">SLB 10-Well Pilot Plan</h1>
          <Badge variant="outline" className="border-primary/50 text-primary">Proposal</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilot analysis of {WELLS_COUNT} SLB wells on the SGOM platform — data requirements and analysis stages.
          AI Smart Well Inc. · Maxxwell Production.
        </p>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Pilot objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            SGOM analyzes {WELLS_COUNT} wells selected by SLB to identify bypassed pay and rank the
            portfolio for SPT (Slot Perforation Technology, US 8,863,823) restoration. Each well
            receives a verified verdict; the portfolio receives a single priority ranking.
          </p>
          <p>
            The pilot runs on the existing SGOM pipeline — no custom development is required.
            Wells are processed in batches as data arrives; SLB receives per-well reports and a
            consolidated ranking at the end.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Data required from SLB (per well)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data item</TableHead>
                <TableHead>Used for</TableHead>
                <TableHead className="w-28">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slbDataItems.map((d) => (
                <TableRow key={d.item}>
                  <TableCell className="font-medium text-foreground">{d.item}</TableCell>
                  <TableCell className="text-muted-foreground">{d.purpose}</TableCell>
                  <TableCell>
                    {d.required ? (
                      <Badge className="bg-primary/20 text-primary">Required</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">If available</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Missing optional items do not block the analysis — the verdict is marked "conditional"
            and the missing inputs are listed explicitly in the report.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Analysis stages (per well)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisStages.map((s) => (
              <div key={s.stage} className="flex gap-4 rounded-lg border border-border/50 bg-background/40 p-4">
                <Badge variant="outline" className="h-fit shrink-0 border-primary/50 text-primary">
                  {s.stage}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Deliverables to SLB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Pilot status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Wells received</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                0 / {WELLS_COUNT}
                <CircleDashed className="h-4 w-4 text-muted-foreground" />
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Verdicts issued</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                0
                <CircleDashed className="h-4 w-4 text-muted-foreground" />
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Geophysicist-reviewed</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                0
                <CircleDashed className="h-4 w-4 text-muted-foreground" />
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Counters update as SLB wells are loaded and processed. The SLB Alfa well review
            (deep gas, slotted liner) serves as the reference case for the report format.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SLBPilotPlan;
