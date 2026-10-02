import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Scissors, AlertTriangle } from "lucide-react";
import { SAMPLE_WELL } from "@/lib/spt-demo-pipeline";
import blueprintLiner from "@/assets/spt-blueprint-liner.jpg";
import blueprintInflow from "@/assets/spt-blueprint-inflow.jpg";
import blueprintBeforeAfter from "@/assets/spt-blueprint-before-after.jpg";

/**
 * SPT Slot Cutting Plan — Brawner 10-15 (demo well).
 * ILLUSTRATIVE ONLY: built from the deterministic demo dataset, no database
 * reads, no live analysis. Never present as a real work order.
 */

interface CutInterval {
  top: number;
  bottom: number;
  slotsPerFt: number;
  slotWidthIn: number;
  slotLengthIn: number;
  phasingDeg: number;
  priority: "Primary" | "Secondary" | "Caution";
  rationale: string;
}

const SPT_LIBRARY_MAX_FT = 5400;

const SPTSlotPlan = () => {
  const w = SAMPLE_WELL;
  const payTop = w.depthFt - w.netPayFt; // 3958 ft

  const intervals: CutInterval[] = useMemo(() => {
    const third = w.netPayFt / 3;
    const t1 = payTop;
    const t2 = payTop + third;
    const t3 = payTop + 2 * third;
    return [
      {
        top: t1,
        bottom: t2,
        slotsPerFt: 60,
        slotWidthIn: 0.02,
        slotLengthIn: 12,
        phasingDeg: 360,
        priority: "Primary",
        rationale:
          "Upper pay — highest expected porosity (φ ≈ 17%) and best oil saturation above the transition zone. Maximum slot density to open bypassed pay.",
      },
      {
        top: t2,
        bottom: t3,
        slotsPerFt: 50,
        slotWidthIn: 0.016,
        slotLengthIn: 12,
        phasingDeg: 360,
        priority: "Secondary",
        rationale:
          "Mid pay — transition zone. Moderate density balances inflow gain against water risk.",
      },
      {
        top: t3,
        bottom: w.depthFt,
        slotsPerFt: 40,
        slotWidthIn: 0.012,
        slotLengthIn: 12,
        phasingDeg: 360,
        priority: "Caution",
        rationale:
          "Lower pay — closest to the oil-water contact (Swirr 28%). Reduced density and narrower slots to limit water coning; monitor water cut after treatment.",
      },
    ];
  }, [payTop, w.depthFt, w.netPayFt]);

  const totalSlots = useMemo(
    () =>
      Math.round(
        intervals.reduce((s, i) => s + (i.bottom - i.top) * i.slotsPerFt, 0),
      ),
    [intervals],
  );

  const screening = [
    { k: "Depth", v: `${w.depthFt.toLocaleString()} ft`, s: `Within SPT case library (up to ≈ ${SPT_LIBRARY_MAX_FT.toLocaleString()} ft)`, r: "pass" },
    { k: "Reservoir pressure", v: `${w.reservoirPressurePsi.toLocaleString()} psi`, s: "Normal gradient — standard SPT equipment rating", r: "pass" },
    { k: "Porosity", v: `${(w.porosity * 100).toFixed(0)}%`, s: "Productive sand (Mississippian Chat)", r: "pass" },
    { k: "Irreducible water sat.", v: `${(w.swirr * 100).toFixed(0)}%`, s: "Acceptable (< 60% cutoff)", r: "pass" },
    { k: "Fluid", v: "Oil", s: "Oil-risk permeability cutoff 1 mD applies", r: "pass" },
    { k: "Net pay", v: `${w.netPayFt} ft`, s: "Sufficient interval for staged slotting", r: "pass" },
  ];
  const rc = (r: string) =>
    r === "pass" ? "text-success" : r === "warn" ? "text-warning" : "text-destructive";

  const pageRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const downloadPdf = async () => {
    if (!pageRef.current) return;
    setPdfBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const bg = getComputedStyle(document.body).backgroundColor;
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 24, footer = 22, usable = H - M - footer;
      const paint = () => { pdf.setFillColor(bg); pdf.rect(0, 0, W, H, "F"); };
      const foot = () => {
        pdf.setFontSize(7);
        pdf.setTextColor(150);
        pdf.text("ILLUSTRATIVE DEMO — AI Smart Well Inc. · Maxxwell Production. Not a work order.", M, H - 10);
      };
      paint(); foot();
      let y = M;
      const blocks = Array.from(pageRef.current.children).filter(
        (el) => !(el as HTMLElement).hasAttribute("data-pdf-skip"),
      ) as HTMLElement[];
      for (const el of blocks) {
        const c = await html2canvas(el, {
          scale: 1.5,
          backgroundColor: bg,
          ignoreElements: (e) => e.hasAttribute("data-pdf-skip"),
        });
        let w2 = W - 2 * M, h = (c.height * w2) / c.width;
        if (h > usable) { w2 *= usable / h; h = usable; }
        if (y + h > M + usable && y > M) { pdf.addPage(); paint(); foot(); y = M; }
        pdf.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", M, y, w2, h);
        y += h + 10;
      }
      pdf.save("SGOM_Brawner_10-15_SPT_Slot_Plan.pdf");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div ref={pageRef} className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-2 text-xs border border-warning/40 text-warning rounded-lg px-3 py-2">
        <span className="font-semibold">ILLUSTRATIVE DEMO PLAN — built from demo data, not a field work order</span>
        <span className="text-muted-foreground">AI Smart Well Inc. · Maxxwell Production</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Stage 6 · SPT</Badge>
            <Badge variant="outline">OIL</Badge>
            <Badge variant="outline" className="text-warning border-warning/40">ILLUSTRATIVE</Badge>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scissors className="h-7 w-7 text-primary" />
            SPT Slot Cutting Plan — {w.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            API {w.api} · {w.formation} · TD {w.depthFt.toLocaleString()} ft · net pay {w.netPayFt} ft
          </p>
        </div>
        <Button data-pdf-skip onClick={downloadPdf} disabled={pdfBusy}>
          {pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download PDF
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border/40 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        This plan is generated from the deterministic Brawner 10-15 demo dataset for presentation purposes.
        Intervals, slot densities and pressures are illustrative defaults — a real plan requires measured
        composite logs, completion records and operator confirmation.
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">SPT applicability screening</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                <th className="py-2 pr-4">Parameter</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2">Assessment</th>
              </tr>
            </thead>
            <tbody>
              {screening.map((row) => (
                <tr key={row.k} className="border-b border-border/20">
                  <td className="py-2 pr-4 font-medium">{row.k}</td>
                  <td className={`py-2 pr-4 ${rc(row.r)}`}>{row.v}</td>
                  <td className="py-2 text-muted-foreground">{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
            Slot cutting intervals
            <Badge variant="outline">Total ≈ {totalSlots.toLocaleString()} slots over {w.netPayFt} ft</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                <th className="py-2 pr-3">Interval (ft)</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Slots/ft</th>
                <th className="py-2 pr-3">Slot width (in)</th>
                <th className="py-2 pr-3">Slot length (in)</th>
                <th className="py-2 pr-3">Phasing</th>
                <th className="py-2">Slots</th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((i) => (
                <tr key={i.top} className="border-b border-border/20">
                  <td className="py-2 pr-3 font-medium">{Math.round(i.top)}–{Math.round(i.bottom)}</td>
                  <td className="py-2 pr-3">
                    <Badge
                      variant="outline"
                      className={
                        i.priority === "Primary"
                          ? "text-success border-success/40"
                          : i.priority === "Secondary"
                            ? "text-primary border-primary/40"
                            : "text-warning border-warning/40"
                      }
                    >
                      {i.priority}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{i.slotsPerFt}</td>
                  <td className="py-2 pr-3">{i.slotWidthIn}</td>
                  <td className="py-2 pr-3">{i.slotLengthIn}</td>
                  <td className="py-2 pr-3">{i.phasingDeg}°</td>
                  <td className="py-2">{Math.round((i.bottom - i.top) * i.slotsPerFt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-3">
            {intervals.map((i) => (
              <div key={i.top} className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                <span className="font-medium text-foreground">{Math.round(i.top)}–{Math.round(i.bottom)} ft ({i.priority}): </span>
                {i.rationale}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Execution notes (illustrative)</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Cutting fluid: treated brine matched to formation salinity; avoid freshwater in water-sensitive Chat intervals.</li>
            <li>Surface pressure stays within standard SPT equipment rating at {w.reservoirPressurePsi.toLocaleString()} psi reservoir pressure.</li>
            <li>Cut bottom-up: start at the Caution interval, finish at the Primary interval.</li>
          </ul>
          <ul className="list-disc pl-5 space-y-1">
            <li>Post-treatment: flowback surveillance, water-cut baseline vs. pre-treatment {(w.history[w.history.length - 1].water / (w.history[w.history.length - 1].water + w.history[w.history.length - 1].oil) * 100).toFixed(0)}%.</li>
            <li>Success metric: sustained oil uplift vs. the Arps decline baseline from Stage 4.</li>
            <li>All values illustrative — confirm with measured logs before field use.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SPTSlotPlan;
