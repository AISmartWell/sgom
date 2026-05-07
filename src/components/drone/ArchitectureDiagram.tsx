import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

/**
 * Architecture diagram for the Drone Inspection Integration Module.
 * Three swim-lanes: Sources → AI Smart Well Core → Outputs.
 * Pure SVG, semantic tokens via CSS variables on parent (uses HSL fills).
 */
const ArchitectureDiagram = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" /> System Architecture · Components & Data Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 1200 720"
            className="w-full h-auto min-w-[900px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Arrow marker */}
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1A9FFF" />
              </marker>
              <marker
                id="arrowMuted"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b8899" />
              </marker>

              {/* Lane background */}
              <linearGradient id="laneCore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A9FFF" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#1A9FFF" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="laneSrc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#76b900" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#76b900" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="laneOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f28c00" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#f28c00" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* === SWIM LANES === */}
            <rect x="20" y="60" width="320" height="640" rx="14" fill="url(#laneSrc)" stroke="#76b90033" />
            <rect x="360" y="60" width="500" height="640" rx="14" fill="url(#laneCore)" stroke="#1A9FFF55" />
            <rect x="880" y="60" width="300" height="640" rx="14" fill="url(#laneOut)" stroke="#f28c0044" />

            {/* Lane titles */}
            <text x="180" y="42" textAnchor="middle" fill="#76b900" fontSize="13" fontWeight="700" letterSpacing="2">
              FIELD DATA SOURCES
            </text>
            <text x="610" y="42" textAnchor="middle" fill="#1A9FFF" fontSize="13" fontWeight="700" letterSpacing="2">
              AI SMART WELL · FUSION CORE
            </text>
            <text x="1030" y="42" textAnchor="middle" fill="#f28c00" fontSize="13" fontWeight="700" letterSpacing="2">
              OUTPUTS &amp; CLIENTS
            </text>

            {/* === SOURCE NODES === */}
            {[
              { y: 90, t: "DJI Matrice 300 RTK", s: "RGB + Thermal · GeoTIFF" },
              { y: 175, t: "Pergam Methane Mini", s: "CH₂ / CH₄ · CSV" },
              { y: 260, t: "LiDAR Sensor", s: ".LAS Point Cloud" },
              { y: 345, t: "Wireline Logs", s: "GR / RES / NEU / DEN" },
              { y: 430, t: "Production History", s: "Oil · Gas · Water · BHP" },
              { y: 515, t: "FAA LAANC", s: "Airspace authorization" },
              { y: 600, t: "Operator Records", s: "API · Permit · Plug status" },
            ].map((n) => (
              <g key={n.t}>
                <rect x="40" y={n.y} width="280" height="60" rx="8" fill="#0d1520" stroke="#76b90055" />
                <circle cx="62" cy={n.y + 30} r="5" fill="#76b900" />
                <text x="78" y={n.y + 26} fill="#e6f4ff" fontSize="13" fontWeight="600">{n.t}</text>
                <text x="78" y={n.y + 46} fill="#6b8899" fontSize="11">{n.s}</text>
              </g>
            ))}

            {/* === CORE NODES === */}
            {/* Stage 1 — Ingestion */}
            <g>
              <rect x="380" y="90" width="220" height="62" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="490" y="114" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 1 · 2</text>
              <text x="490" y="134" textAnchor="middle" fill="#e6f4ff" fontSize="13" fontWeight="600">Ingestion + QC</text>
              <text x="490" y="148" textAnchor="middle" fill="#6b8899" fontSize="10">Kafka · S3 · Calibration</text>
            </g>
            {/* Stage 3 — CV Core */}
            <g>
              <rect x="620" y="90" width="220" height="62" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="730" y="114" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 3 · CV CORE</text>
              <text x="730" y="134" textAnchor="middle" fill="#e6f4ff" fontSize="13" fontWeight="600">YOLOv8 · U-Net</text>
              <text x="730" y="148" textAnchor="middle" fill="#6b8899" fontSize="10">Wellhead · Hot-spot · Plume</text>
            </g>

            {/* Stage 4 — Geological Object Model */}
            <g>
              <rect x="380" y="200" width="220" height="62" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="490" y="224" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 4 · GEO OBJECT</text>
              <text x="490" y="244" textAnchor="middle" fill="#e6f4ff" fontSize="13" fontWeight="600">3D Site Model</text>
              <text x="490" y="258" textAnchor="middle" fill="#6b8899" fontSize="10">Subsurface ⊕ Point Cloud</text>
            </g>
            {/* Stage 5 — Fusion Engine */}
            <g>
              <rect x="620" y="200" width="220" height="62" rx="8" fill="#0a1422" stroke="#f28c00" strokeWidth="1.5" />
              <text x="730" y="224" textAnchor="middle" fill="#f28c00" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 5 · FUSION</text>
              <text x="730" y="244" textAnchor="middle" fill="#e6f4ff" fontSize="13" fontWeight="600">Cross-Modal Attention</text>
              <text x="730" y="258" textAnchor="middle" fill="#6b8899" fontSize="10">α·SPT + β·access − γ·risk</text>
            </g>

            {/* DGX Cloud platform pill (spans both) */}
            <g>
              <rect x="380" y="300" width="460" height="50" rx="25" fill="#0a1422" stroke="#76b900" strokeDasharray="4 3" />
              <text x="610" y="322" textAnchor="middle" fill="#76b900" fontSize="11" fontWeight="700" letterSpacing="1.5">
                NVIDIA DGX CLOUD · H100
              </text>
              <text x="610" y="338" textAnchor="middle" fill="#6b8899" fontSize="10">
                ResNet-50 / ViT surface encoder · Well-log transformer · Training jobs
              </text>
            </g>

            {/* Stage 6 Economics */}
            <g>
              <rect x="380" y="380" width="220" height="56" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="490" y="402" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 6 · ECON</text>
              <text x="490" y="422" textAnchor="middle" fill="#e6f4ff" fontSize="12" fontWeight="600">Cost Offset Engine</text>
            </g>
            {/* Stage 7 Visualization */}
            <g>
              <rect x="620" y="380" width="220" height="56" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="730" y="402" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 7 · VIZ</text>
              <text x="730" y="422" textAnchor="middle" fill="#e6f4ff" fontSize="12" fontWeight="600">Orthomosaic + Thermal</text>
            </g>

            {/* Flight Planner */}
            <g>
              <rect x="380" y="460" width="220" height="56" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="490" y="482" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">FLIGHT PLANNER</text>
              <text x="490" y="502" textAnchor="middle" fill="#e6f4ff" fontSize="12" fontWeight="600">Boustrophedon · MAVLink</text>
            </g>
            {/* Stage 8 Monitor */}
            <g>
              <rect x="620" y="460" width="220" height="56" rx="8" fill="#0a1422" stroke="#1A9FFF" />
              <text x="730" y="482" textAnchor="middle" fill="#1A9FFF" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 8 · IoT</text>
              <text x="730" y="502" textAnchor="middle" fill="#e6f4ff" fontSize="12" fontWeight="600">Leak / Anomaly Watch</text>
            </g>

            {/* Stage 9 Report API */}
            <g>
              <rect x="500" y="540" width="220" height="56" rx="8" fill="#0a1422" stroke="#f28c00" strokeWidth="1.5" />
              <text x="610" y="562" textAnchor="middle" fill="#f28c00" fontSize="10" fontWeight="700" letterSpacing="1.5">STAGE 9 · REPORT API</text>
              <text x="610" y="582" textAnchor="middle" fill="#e6f4ff" fontSize="12" fontWeight="600">Composite Well Score</text>
            </g>

            {/* Storage layer (bottom of core lane) */}
            <g>
              <rect x="380" y="620" width="460" height="46" rx="8" fill="#0a1422" stroke="#243040" strokeDasharray="3 3" />
              <text x="610" y="640" textAnchor="middle" fill="#6b8899" fontSize="10" fontWeight="700" letterSpacing="1.5">DATA LAYER</text>
              <text x="610" y="656" textAnchor="middle" fill="#6b8899" fontSize="10">Supabase Postgres · AWS S3 (per well_id) · Vector store</text>
            </g>

            {/* === OUTPUT NODES === */}
            {[
              { y: 90, t: "Composite Well Score", s: "0–1 · bankable signal", color: "#f28c00" },
              { y: 175, t: "EPA Subpart W Report", s: "Methane plume export", color: "#f28c00" },
              { y: 260, t: "Full Site Digital Twin", s: "3D model + score", color: "#f28c00" },
              { y: 345, t: "Operator Dashboard", s: "Web UI · Alerts", color: "#1A9FFF" },
              { y: 430, t: "Regulator Portal", s: "DOI · State submission", color: "#1A9FFF" },
              { y: 515, t: "PE Due Diligence", s: "Pre-acquisition pack", color: "#1A9FFF" },
              { y: 600, t: "Quarterly Rescan", s: "$200/well/mo IoT", color: "#1A9FFF" },
            ].map((n) => (
              <g key={n.t}>
                <rect x="900" y={n.y} width="260" height="60" rx="8" fill="#0d1520" stroke={`${n.color}66`} />
                <circle cx="922" cy={n.y + 30} r="5" fill={n.color} />
                <text x="938" y={n.y + 26} fill="#e6f4ff" fontSize="13" fontWeight="600">{n.t}</text>
                <text x="938" y={n.y + 46} fill="#6b8899" fontSize="11">{n.s}</text>
              </g>
            ))}

            {/* === FLOW ARROWS (Sources → Core) === */}
            {[
              { y1: 120, target: 121 },   // DJI → Ingest
              { y1: 205, target: 121 },   // Pergam → Ingest
              { y1: 290, target: 121 },   // LiDAR → Ingest
              { y1: 375, target: 231 },   // Wireline → GeoObject
              { y1: 460, target: 231 },   // Production → GeoObject
              { y1: 545, target: 488 },   // FAA → Flight Planner
              { y1: 630, target: 408 },   // Operator → Econ
            ].map((a, i) => (
              <line
                key={i}
                x1="320"
                y1={a.y1}
                x2="380"
                y2={a.target}
                stroke="#1A9FFF"
                strokeWidth="1.5"
                opacity="0.7"
                markerEnd="url(#arrow)"
              />
            ))}

            {/* === INTERNAL CORE FLOWS === */}
            {/* Ingest → CV Core */}
            <line x1="600" y1="121" x2="620" y2="121" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* Ingest ↓ GeoObject */}
            <line x1="490" y1="152" x2="490" y2="200" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* CV Core ↓ Fusion */}
            <line x1="730" y1="152" x2="730" y2="200" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* GeoObject → Fusion */}
            <line x1="600" y1="231" x2="620" y2="231" stroke="#f28c00" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* Fusion ↓ DGX */}
            <line x1="730" y1="262" x2="730" y2="300" stroke="#76b900" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowMuted)" />
            <line x1="490" y1="262" x2="490" y2="300" stroke="#76b900" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowMuted)" />
            {/* DGX ↓ to Econ + Viz */}
            <line x1="490" y1="350" x2="490" y2="380" stroke="#76b900" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowMuted)" />
            <line x1="730" y1="350" x2="730" y2="380" stroke="#76b900" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowMuted)" />
            {/* Econ + Viz ↓ Flight + IoT */}
            <line x1="490" y1="436" x2="490" y2="460" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="730" y1="436" x2="730" y2="460" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* Flight + IoT ↓ Report */}
            <line x1="490" y1="516" x2="580" y2="540" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="730" y1="516" x2="640" y2="540" stroke="#1A9FFF" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* Report ↓ Data layer */}
            <line x1="610" y1="596" x2="610" y2="620" stroke="#6b8899" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrowMuted)" />

            {/* === CORE → OUTPUT ARROWS === */}
            {[
              { from: 562, to: 120 },  // Report → Composite
              { from: 562, to: 205 },  // Report → EPA
              { from: 562, to: 290 },  // Report → Twin
              { from: 408, to: 375 },  // Econ → Operator dash
              { from: 562, to: 460 },  // Report → Regulator
              { from: 562, to: 545 },  // Report → PE
              { from: 488, to: 630 },  // Flight Plan → Quarterly
            ].map((a, i) => (
              <line
                key={i}
                x1={a.from === 408 ? 600 : 720}
                y1={a.from}
                x2="900"
                y2={a.to}
                stroke="#f28c00"
                strokeWidth="1.5"
                opacity="0.6"
                markerEnd="url(#arrow)"
              />
            ))}

            {/* Legend */}
            <g transform="translate(40, 678)">
              <rect width="14" height="3" y="6" fill="#1A9FFF" />
              <text x="22" y="11" fill="#6b8899" fontSize="10">data flow</text>
              <line x1="100" y1="8" x2="120" y2="8" stroke="#76b900" strokeWidth="2" strokeDasharray="4 3" />
              <text x="128" y="11" fill="#6b8899" fontSize="10">GPU training</text>
              <line x1="220" y1="8" x2="240" y2="8" stroke="#f28c00" strokeWidth="2" />
              <text x="248" y="11" fill="#6b8899" fontSize="10">scored output</text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArchitectureDiagram;
