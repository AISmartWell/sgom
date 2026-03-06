import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { lookupFormation, formatPermeability } from "@/lib/formation-db";

interface DeviationReportProps {
  analysisText: string;
}

function parseValues(text: string) {
  let porosity: number | null = null;
  const phiPatterns = [
    /porosity[^%\d]*?(\d+(?:\.\d+)?)\s*%/i,
    /visual porosity[^%\d]*?(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:porosity|φ)/i,
  ];
  for (const p of phiPatterns) {
    const m = text.match(p);
    if (m) { porosity = parseFloat(m[1]); break; }
  }

  let permeability: number | null = null;
  const kPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*mD/i,
    /(\d+(?:\.\d+)?)\s*mD/i,
    /(\d+(?:\.\d+)?)\s*µD/i,
  ];
  for (const p of kPatterns) {
    const m = text.match(p);
    if (m) {
      permeability = m[2] ? (parseFloat(m[1]) + parseFloat(m[2])) / 2 : parseFloat(m[1]);
      if (p.source.includes("µD")) permeability /= 1000;
      break;
    }
  }

  let rockType: string | null = null;
  const rtMatch = text.match(/(?:rock type|primary rock type)[:\s]*\**([^*\n,]+)/i);
  if (rtMatch) rockType = rtMatch[1].trim();

  return { porosity, permeability, rockType };
}

export const DeviationReport = ({ analysisText }: DeviationReportProps) => {
  const { porosity, permeability, rockType } = parseValues(analysisText);
  const ref = rockType ? lookupFormation(rockType) : null;

  if (!ref || (porosity === null && permeability === null)) return null;

  const getStatus = (val: number, min: number, max: number) => {
    if (val >= min && val <= max) return "in-range";
    const tol = (max - min) * 0.15;
    if (val >= min - tol && val <= max + tol) return "near";
    return "out";
  };

  const phiStatus = porosity !== null ? getStatus(porosity, ref.phiMin, ref.phiMax) : null;

  let kStatus: string | null = null;
  if (permeability !== null) {
    const logVal = Math.log10(Math.max(permeability, 1e-7));
    const logMin = Math.log10(Math.max(ref.kMin, 1e-7));
    const logMax = Math.log10(Math.max(ref.kMax, 1e-7));
    kStatus = getStatus(logVal, logMin, logMax);
  }

  const icon = (s: string | null) => {
    if (s === "in-range") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (s === "near") return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    if (s === "out") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return null;
  };

  const label = (s: string | null) => {
    if (s === "in-range") return "In Range";
    if (s === "near") return "Near";
    if (s === "out") return "Deviation";
    return "";
  };

  const borderClass = phiStatus === "out" || kStatus === "out"
    ? "border-destructive/30 bg-destructive/5"
    : phiStatus === "near" || kStatus === "near"
      ? "border-warning/30 bg-warning/5"
      : "border-success/30 bg-success/5";

  return (
    <Card className={`border ${borderClass} mt-4`}>
      <CardContent className="pt-3 pb-3 px-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">Validation</Badge>
          <span className="text-xs text-muted-foreground">{ref.lithology}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {porosity !== null && (
            <div className="flex items-center gap-1.5">
              {icon(phiStatus)}
              <span className="font-medium">φ {porosity.toFixed(1)}%</span>
              <span className="text-muted-foreground">/ {ref.phiMin}–{ref.phiMax}%</span>
              <span className="text-[10px] text-muted-foreground">({label(phiStatus)})</span>
            </div>
          )}
          {permeability !== null && (
            <div className="flex items-center gap-1.5">
              {icon(kStatus)}
              <span className="font-medium">k {formatPermeability(permeability)}</span>
              <span className="text-muted-foreground">/ {formatPermeability(ref.kMin)}–{formatPermeability(ref.kMax)}</span>
              <span className="text-[10px] text-muted-foreground">({label(kStatus)})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
