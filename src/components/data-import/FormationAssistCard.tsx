import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  ScanText,
  FileSpreadsheet,
  MapPin,
  BookOpen,
  Upload,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/**
 * Guides the user through the fastest ways to obtain a reliable
 * formation assignment for a well, so downstream SGOM analysis
 * (Timur, IOIP, SPT scoring, Eaton) uses formation-specific priors
 * instead of generic fallbacks.
 */
export const FormationAssistCard = () => {
  const navigate = useNavigate();

  const steps = [
    {
      num: 1,
      icon: MapPin,
      title: "Provide state + county + API",
      desc: "SGOM auto-fills formation from the regional registry (formation_codes) using the 10-digit API prefix.",
      cta: { label: "Open registry", to: "/dashboard/formation-codes" },
      badge: "Fastest",
    },
    {
      num: 2,
      icon: ScanText,
      title: "OCR a paper well log",
      desc: "Upload a scanned SP / Res / GR log — Gemini Vision extracts header, formation tops and depth ranges.",
      cta: { label: "Open OCR", to: "/dashboard/ocr" },
      badge: "Best for legacy wells",
    },
    {
      num: 3,
      icon: Upload,
      title: "Upload a LAS file",
      desc: "Standard mnemonics (GR, RHOB, NPHI, RES) let SGOM classify lithology and match a formation from FORMATION_DB.",
      cta: { label: "Open Geophysical", to: "/dashboard/geophysical" },
      badge: "Highest fidelity",
    },
    {
      num: 4,
      icon: FileSpreadsheet,
      title: "Bulk CSV with a Formation column",
      desc: "Include operator-declared formation names — SGOM normalises them against the formation database.",
      cta: { label: "Download template", to: "/templates/sample-wells-template.csv", external: true },
      badge: "Batch",
    },
  ];

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Improve formation detection
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Boosts SGOM accuracy
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              A known formation lets SGOM apply real porosity / permeability / Sw priors
              instead of the SYNTHETIC fallback. Pick the fastest path below.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/formation-codes")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Formation reference
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="rounded-lg border border-border/50 bg-card/40 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                    {s.num}
                  </div>
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{s.title}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase tracking-wide">
                    {s.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="self-start"
                  onClick={() => {
                    if ("external" in s.cta && s.cta.external) {
                      window.open(s.cta.to, "_blank");
                    } else {
                      navigate(s.cta.to);
                    }
                  }}
                >
                  {s.cta.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
          Not sure? Enter API + county below and SGOM will suggest a formation from the
          regional registry as soon as the well is saved.
        </div>
      </CardContent>
    </Card>
  );
};
