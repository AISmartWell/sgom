import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sigma,
  ArrowRightLeft,
  Target,
} from "lucide-react";

interface SlideContent {
  icon: typeof BookOpen;
  title: string;
  kicker: string;
  body: string;
  bullets?: string[];
  formula?: string;
}

interface StageDeck {
  accent: string; // tailwind text color class
  slides: SlideContent[];
}

const DECKS: Record<string, StageDeck> = {
  field_scan: {
    accent: "text-cyan-400",
    slides: [
      {
        icon: BookOpen,
        title: "Regional Field Scanning",
        kicker: "Method",
        body: "Identifies brownfield assets matching SPT candidacy criteria across Kansas/Oklahoma registries. Uses bounding-box geospatial queries against the wells registry (no PostGIS — composite lat/long indexes).",
        bullets: [
          "Targets mature fields (≥10 yrs production)",
          "Filters by water cut, GOR, formation type",
          "Bounding box ±0.5° around seed well",
        ],
      },
      {
        icon: Sigma,
        title: "Screening Criteria",
        kicker: "Parameters",
        body: "Each well is scored against SPT-suitability filters before passing to Stage 2.",
        bullets: [
          "Water Cut: 40–95%",
          "Oil rate: ≥ 1 bbl/d (above economic limit)",
          "Depth: 1,500–8,000 ft (SPT operational window)",
          "Status: active or idle, not P&A",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: Lat/long, county, formation, registry record",
          "IN: Nearby wells (radius search)",
          "OUT: Candidate flag + neighborhood context",
          "OUT: Field-level KPI baseline → Stage 2",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Reduces the manual screening of hundreds of wells to seconds. Operators see only assets worth analyzing further — saving engineering hours on dry leads.",
        bullets: [
          "10× faster portfolio triage",
          "Standardized go/no-go criteria",
          "Eliminates analyst selection bias",
        ],
      },
    ],
  },
  classification: {
    accent: "text-violet-400",
    slides: [
      {
        icon: BookOpen,
        title: "AI Data Classification",
        kicker: "Method",
        body: "Gemini 2.5 Flash classifies the well into a play type (conventional/tight/heavy), auto-fills missing metadata, and validates formation codes against the Kansas KID 10-digit registry.",
      },
      {
        icon: Sigma,
        title: "Classification Schema",
        kicker: "Categories",
        body: "",
        bullets: [
          "Reservoir type: sandstone, carbonate, shale",
          "Drive mechanism: solution gas, water, gas cap",
          "Maturity: primary / secondary / tertiary stage",
          "Confidence score 0–100% per field",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: Raw registry record + formation name",
          "IN: KID code, county, completion year",
          "OUT: Normalized FORMATION_DB entry",
          "OUT: Missing-field auto-fill suggestions",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Public registries are ~30% incomplete. Auto-classification + auto-fill turns messy data into a structured input for downstream physics — without analyst rework.",
        bullets: [
          "~30% missing-field recovery",
          "Consistent taxonomy across operators",
          "Audit trail of confidence per field",
        ],
      },
    ],
  },
  core_analysis: {
    accent: "text-amber-400",
    slides: [
      {
        icon: BookOpen,
        title: "Core Image CV",
        kicker: "Method",
        body: "Three computer-vision modes run on core sample photos: Segmentation (grain/pore), Fracture detection, and Mineralogy mapping. Output feeds the text-based core interpretation pipeline.",
      },
      {
        icon: Sigma,
        title: "Petrophysical Outputs",
        kicker: "Parameters",
        body: "",
        bullets: [
          "Porosity φ from grain segmentation",
          "Log-scale permeability k (mD)",
          "Fracture density (1/ft)",
          "Mineral fractions: Sand / Silt / Shale",
        ],
        formula: "φ = pore_pixels / total_pixels",
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: Core photos (JPEG/PNG)",
          "IN: Optional LAS-derived φ for calibration",
          "OUT: φ, log k, mineralogy → Stage 4 & 8",
          "OUT: Fracture flags → Stage 5",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Replaces ~$15K of lab core analysis per well with on-screen CV in minutes. Especially useful when only legacy photos exist and no fresh core is available.",
      },
    ],
  },
  cumulative: {
    accent: "text-rose-400",
    slides: [
      {
        icon: BookOpen,
        title: "Decline Curve Analysis",
        kicker: "Method",
        body: "Fits Arps hyperbolic decline (b=0.5) to historical production, projects EUR, and flags wells approaching the economic limit. IOIP back-calculated for reserves audit.",
      },
      {
        icon: Sigma,
        title: "Formulas",
        kicker: "Math",
        body: "Arps hyperbolic decline is the industry-standard reserves estimator.",
        formula: "q(t) = qi / (1 + b·Di·t)^(1/b),  b=0.5",
        bullets: [
          "EUR = ∫ q(t) dt to economic limit",
          "IOIP = 7758·A·h·φ·(1-Sw)/Boi (bbl)",
          "Econ limit ~ 1 bbl/d (default)",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: Monthly production history",
          "IN: φ, h, area from Stages 3/8",
          "OUT: Remaining IOIP for reserves map",
          "OUT: EUR + decline params → Stage 7",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Standardizes reserves estimates across the portfolio. Engineers stop debating spreadsheet curve-fits — every well gets the same Arps fit with documented assumptions.",
      },
    ],
  },
  seismic_reinterpretation: {
    accent: "text-emerald-400",
    slides: [
      {
        icon: BookOpen,
        title: "Seismic Re-interpretation",
        kicker: "Method",
        body: "CV on legacy seismic sections detects bypassed pay, structural traps, and fracture corridors. Targets wells in fields with old 2D shoots that were never reprocessed.",
      },
      {
        icon: Sigma,
        title: "Features Extracted",
        kicker: "Parameters",
        body: "",
        bullets: [
          "Amplitude anomalies (bright/dim spots)",
          "Fault throw and orientation",
          "Channel geometry (paleo-rivers)",
          "Bypassed-pay probability score 0–1",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: SEG-Y or rasterized seismic line",
          "IN: Well log tie + formation tops",
          "OUT: Re-perforation depth candidates",
          "OUT: Fracture corridor map → Stage 6",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "A single re-interpreted bypassed-pay zone can add 50–200K bbl recoverable per well — at near-zero acquisition cost since the seismic already exists in tape archives.",
      },
    ],
  },
  spt_projection: {
    accent: "text-orange-400",
    slides: [
      {
        icon: BookOpen,
        title: "Slot Perforation Technology",
        kicker: "Method · US 8,863,823",
        body: "Patented SPT (Slot Perforation Technology) replaces conventional bullet perforations with engineered slots — increasing inflow area 3–5× and reducing skin damage.",
      },
      {
        icon: Sigma,
        title: "SPT Operational Window",
        kicker: "Specifications",
        body: "",
        bullets: [
          "Inflow uplift: 30–80% over conventional",
          "Depth window: 1,500–8,000 ft TVD",
          "Job duration: 6–12 hrs per well",
          "MCDA ranking via Water Cut + GOR (inverted)",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: Petrophysics (φ, k, h) from Stage 8",
          "IN: Decline + EUR from Stage 4",
          "OUT: SPT MCDA score + recommended interval",
          "OUT: Expected uplift % → Stage 7 economics",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "SPT is prioritized as the default EOR method when in-window. Lower CAPEX than infill drilling, faster payback than waterflood expansion, and patent-protected differentiation.",
      },
    ],
  },
  economic: {
    accent: "text-green-400",
    slides: [
      {
        icon: BookOpen,
        title: "Monte Carlo Economics",
        kicker: "Method",
        body: "Runs 10,000-trial Monte Carlo on NPV with stochastic price, decline-rate, and uplift inputs. Reports P10/P50/P90 NPV and Quality-Adjusted Estimate (QAE).",
      },
      {
        icon: Sigma,
        title: "Formulas",
        kicker: "Math",
        body: "",
        formula: "NPV = Σ [(Qt·Pt − OPEXt) / (1+r)^t] − CAPEX",
        bullets: [
          "Price ~ Normal(μ_WTI, σ=12%)",
          "Discount rate r = 10% default",
          "QAE = P50 · (1 − σ_NPV / |μ_NPV|)",
          "Payback months from cumulative NPV",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: SPT uplift % from Stage 6",
          "IN: EUR + decline from Stage 4",
          "IN: OPEX, CAPEX, price deck",
          "OUT: P10/P50/P90 NPV + payback → Stage 9",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Investment committees see explicit downside risk (P10) instead of single-point NPV. Cuts capital approval cycle from weeks of debate to one defensible distribution.",
      },
    ],
  },
  geophysical: {
    accent: "text-blue-400",
    slides: [
      {
        icon: BookOpen,
        title: "Petrophysics (Schlumberger Workflow)",
        kicker: "Method",
        body: "Industry-standard 7-step petrophysical interpretation on LAS curves: lithology, shale volume, porosity, Sw, net pay, permeability (Timur), and reserves.",
      },
      {
        icon: Sigma,
        title: "Timur Permeability",
        kicker: "Math",
        body: "Empirical correlation linking porosity and irreducible water saturation to absolute permeability.",
        formula: "k = 0.136 · φ⁴·⁴ / Swirr²",
        bullets: [
          "Vsh cutoff: ≤ 0.40 (clean sand)",
          "φ cutoff: ≥ 0.08 (8% porosity)",
          "Sw cutoff: ≤ 0.60 (pay flag)",
          "k in mD when φ, Swirr fractional",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: LAS curves (GR, RHOB, NPHI, RT)",
          "IN: PERF track from completion records",
          "OUT: Net pay (ft), φ, k, Sw per zone",
          "OUT: Synced FORMATION_DB bounds",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "Replaces ~$50K of contracted petrophysical interpretation per well. Outputs feed both reserves (Stage 4) and SPT screening (Stage 6) with consistent cutoffs.",
      },
    ],
  },
  eor: {
    accent: "text-pink-400",
    slides: [
      {
        icon: BookOpen,
        title: "EOR Recommendation",
        kicker: "Method",
        body: "Synthesizes all prior stages into a ranked EOR recommendation. SPT is prioritized when the well falls in its operational window; otherwise CO₂, polymer, or waterflood alternatives are scored.",
      },
      {
        icon: Sigma,
        title: "Decision Matrix",
        kicker: "Ranking Logic",
        body: "Multi-criteria ranking with inverted Water Cut and GOR (higher = better candidate).",
        bullets: [
          "SPT score (patent priority) — 40% weight",
          "Economics QAE from Stage 7 — 30%",
          "Petrophysical quality (k·h) — 20%",
          "Operational risk (depth, age) — 10%",
        ],
      },
      {
        icon: ArrowRightLeft,
        title: "Inputs / Outputs",
        kicker: "Data Flow",
        body: "",
        bullets: [
          "IN: All Stage 1–8 results",
          "IN: SPT operational window flags",
          "OUT: Ranked EOR method + confidence",
          "OUT: Saved to well_analyses report",
        ],
      },
      {
        icon: Target,
        title: "Business Value",
        kicker: "Why It Matters",
        body: "The final deliverable: one ranked recommendation per well, fully traceable to physics inputs. Operators move from analysis to AFE in the same session.",
        bullets: [
          "End-to-end audit trail",
          "SPT-first methodology",
          "Investor-ready report (Stage 9 → AFE)",
        ],
      },
    ],
  },
};

interface Props {
  stageKey: string;
}

export const StageSlides = ({ stageKey }: Props) => {
  const [idx, setIdx] = useState(0);
  const deck = DECKS[stageKey];
  if (!deck) return null;
  const slide = deck.slides[idx];
  const Icon = slide.icon;
  const total = deck.slides.length;

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 backdrop-blur p-5 my-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-md bg-background/60 flex items-center justify-center ${deck.accent}`}>
            <Icon className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {slide.kicker}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {idx + 1} / {total}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={idx === total - 1}
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h4 className={`text-lg font-semibold mb-2 ${deck.accent}`}>{slide.title}</h4>

      {slide.body && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{slide.body}</p>
      )}

      {slide.formula && (
        <div className="rounded-md bg-background/70 border border-border/40 px-3 py-2 mb-3 font-mono text-xs text-foreground/90">
          {slide.formula}
        </div>
      )}

      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="text-sm flex gap-2 leading-snug">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-current ${deck.accent}`} />
              <span className="text-foreground/85">{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Slide dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {deck.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? `w-6 bg-current ${deck.accent}` : "w-1.5 bg-muted-foreground/30"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StageSlides;
