import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

/**
 * Interactive SVG architecture diagram.
 * - Hover any node → tooltip with description
 * - Hover node → related flows highlight, others dim
 * - Hover a flow → tooltip showing source → target + payload
 */

type NodeKind = "source" | "core" | "platform" | "storage" | "output";

interface NodeDef {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  badge?: string;
  title: string;
  sub: string;
  tip: string;
  color: string;
}

interface FlowDef {
  id: string;
  from: string;
  to: string;
  label: string;
  payload: string;
  kind: "data" | "gpu" | "score" | "storage";
}

const NODES: NodeDef[] = [
  // Sources
  { id: "dji", kind: "source", x: 40, y: 90, w: 280, h: 60, title: "DJI Matrice 300 RTK", sub: "RGB + Thermal · GeoTIFF", tip: "Quadcopter drone with Zenmuse H20T sensor. Captures RGB and thermal imagery + GPS metadata at 3 altitudes (49 / 98 / 197 ft).", color: "#76b900" },
  { id: "pergam", kind: "source", x: 40, y: 175, w: 280, h: 60, title: "Pergam Methane Mini", sub: "CH₂ / CH₄ · CSV", tip: "Tunable diode laser absorption spectrometer mounted on the drone. Outputs concentration time series in CSV.", color: "#76b900" },
  { id: "lidar", kind: "source", x: 40, y: 260, w: 280, h: 60, title: "LiDAR Sensor", sub: ".LAS Point Cloud", tip: "High-density structural scan of the well pad and surrounding terrain.", color: "#76b900" },
  { id: "wireline", kind: "source", x: 40, y: 345, w: 280, h: 60, title: "Wireline Logs", sub: "GR / RES / NEU / DEN", tip: "Existing downhole logs already curated by the AI Smart Well platform.", color: "#76b900" },
  { id: "prod", kind: "source", x: 40, y: 430, w: 280, h: 60, title: "Production History", sub: "Oil · Gas · Water · BHP", tip: "Monthly volumes and bottom-hole pressure from the production_history table.", color: "#76b900" },
  { id: "faa", kind: "source", x: 40, y: 515, w: 280, h: 60, title: "FAA LAANC", sub: "Airspace authorization", tip: "Low Altitude Authorization & Notification Capability — automated FAA Part 107 airspace clearance.", color: "#76b900" },
  { id: "operator", kind: "source", x: 40, y: 600, w: 280, h: 60, title: "Operator Records", sub: "API · Permit · Plug status", tip: "State registry data: 10-digit API number, permit history, current plug status.", color: "#76b900" },

  // Core — row 1
  { id: "ingest", kind: "core", x: 380, y: 90, w: 220, h: 62, badge: "STAGE 1 · 2", title: "Ingestion + QC", sub: "Kafka · S3 · Calibration", tip: "Streams raw telemetry into Kafka, archives bulk artifacts to AWS S3 (per well_id). Validates georeferencing, sensor calibration, flight path coverage.", color: "#1A9FFF" },
  { id: "cv", kind: "core", x: 620, y: 90, w: 220, h: 62, badge: "STAGE 3 · CV CORE", title: "YOLOv8 · U-Net", sub: "Wellhead · Hot-spot · Plume", tip: "Computer Vision core. YOLOv8 detects wellhead, tank battery, pipeline, spill. U-Net segments thermal hot-spots. Gaussian dispersion fits the methane plume.", color: "#1A9FFF" },

  // Core — row 2
  { id: "geo", kind: "core", x: 380, y: 200, w: 220, h: 62, badge: "STAGE 4 · GEO OBJECT", title: "3D Site Model", sub: "Subsurface ⊕ Point Cloud", tip: "Builds a unified 3D object model: subsurface formation tops + surface point cloud, aligned by GPS.", color: "#1A9FFF" },
  { id: "fusion", kind: "core", x: 620, y: 200, w: 220, h: 62, badge: "STAGE 5 · FUSION", title: "Cross-Modal Attention", sub: "α·SPT + β·access − γ·risk", tip: "Cross-modal attention: Q from subsurface features, K/V from drone spatial features. Produces the bankable composite well score.", color: "#f28c00" },

  // Platform pill
  { id: "dgx", kind: "platform", x: 380, y: 300, w: 460, h: 50, title: "NVIDIA DGX CLOUD · H100", sub: "ResNet-50 / ViT · Well-log transformer · Training jobs", tip: "GPU training and heavy inference. Subsurface encoder (well-log transformer) + surface encoder (ResNet-50 / ViT) fine-tuned on H100 cluster.", color: "#76b900" },

  // Core — row 3
  { id: "econ", kind: "core", x: 380, y: 380, w: 220, h: 56, badge: "STAGE 6 · ECON", title: "Cost Offset Engine", sub: "Walkdown vs. Drone", tip: "Stage 6 economics. Compares $4,200/well traditional walkdown against $800/well drone survey. Feeds operator dashboard.", color: "#1A9FFF" },
  { id: "viz", kind: "core", x: 620, y: 380, w: 220, h: 56, badge: "STAGE 7 · VIZ", title: "Orthomosaic + Thermal", sub: "Dashboard layers", tip: "Stage 7 visualization. Renders 3D orthomosaic, thermal overlay, and the geological model in the AI Smart Well dashboard.", color: "#1A9FFF" },

  // Core — row 4
  { id: "planner", kind: "core", x: 380, y: 460, w: 220, h: 56, title: "Boustrophedon · MAVLink", badge: "FLIGHT PLANNER", sub: "Coverage + orbital", tip: "Autonomous waypoint planner. Coverage path planning (boustrophedon) for grid scan + orbital path for vertical structure inspection. Exports MAVLink .plan file.", color: "#1A9FFF" },
  { id: "iot", kind: "core", x: 620, y: 460, w: 220, h: 56, badge: "STAGE 8 · IoT", title: "Leak / Anomaly Watch", sub: "Post-restoration monitor", tip: "Quarterly drone rescan + IoT/SCADA stream. Detects new leaks, structural anomalies, production-site degradation.", color: "#1A9FFF" },

  // Report
  { id: "report", kind: "core", x: 500, y: 540, w: 220, h: 56, badge: "STAGE 9 · REPORT API", title: "Composite Well Score", sub: "Bankable signal · 0–1", tip: "Stage 9 reporting & API. Emits the composite well score, generates EPA Subpart W and DOI submission packages.", color: "#f28c00" },

  // Storage
  { id: "store", kind: "storage", x: 380, y: 620, w: 460, h: 46, title: "DATA LAYER", sub: "Supabase Postgres · AWS S3 (per well_id) · Vector store", tip: "Persistence: Supabase Postgres for structured records (RLS by company_id), AWS S3 for raw drone artifacts, vector store for fused embeddings.", color: "#6b8899" },

  // Outputs
  { id: "score", kind: "output", x: 900, y: 90, w: 260, h: 60, title: "Composite Well Score", sub: "0–1 · bankable signal", tip: "Final scalar consumed by operators, regulators, and PE due diligence pipelines.", color: "#f28c00" },
  { id: "epa", kind: "output", x: 900, y: 175, w: 260, h: 60, title: "EPA Subpart W Report", sub: "Methane plume export", tip: "Auto-generated report package complying with EPA Subpart W methane reporting (effective 2025).", color: "#f28c00" },
  { id: "twin", kind: "output", x: 900, y: 260, w: 260, h: 60, title: "Full Site Digital Twin", sub: "3D model + score · $3,200/well", tip: "Premium tier output: 3D orthomosaic + AI Smart Well subsurface model + composite score, sold to state agencies and PE firms.", color: "#f28c00" },
  { id: "opdash", kind: "output", x: 900, y: 345, w: 260, h: 60, title: "Operator Dashboard", sub: "Web UI · Alerts", tip: "Live operator-facing UI with cost offset analytics and alert routing.", color: "#1A9FFF" },
  { id: "regulator", kind: "output", x: 900, y: 430, w: 260, h: 60, title: "Regulator Portal", sub: "DOI · State submission", tip: "Submission package for DOI Orphaned Wells Program ($4.7B IIJA allocation) and state regulators.", color: "#1A9FFF" },
  { id: "pe", kind: "output", x: 900, y: 515, w: 260, h: 60, title: "PE Due Diligence", sub: "Pre-acquisition pack", tip: "Due-diligence dossier for private equity firms acquiring distressed well portfolios.", color: "#1A9FFF" },
  { id: "rescan", kind: "output", x: 900, y: 600, w: 260, h: 60, title: "Quarterly Rescan", sub: "$200/well/mo IoT", tip: "Recurring revenue stream — quarterly drone re-flight + anomaly alert subscription.", color: "#1A9FFF" },
];

const FLOWS: FlowDef[] = [
  // Sources → Core
  { id: "f1", from: "dji",      to: "ingest",  kind: "data", label: "Imagery → Ingest",      payload: "GeoTIFF orthomosaic + radiometric JPEG batches" },
  { id: "f2", from: "pergam",   to: "ingest",  kind: "data", label: "Gas → Ingest",          payload: "CH₂/CH₄ ppm time series (CSV)" },
  { id: "f3", from: "lidar",    to: "ingest",  kind: "data", label: "Point Cloud → Ingest",  payload: ".LAS dense scan (~5M points/well)" },
  { id: "f4", from: "wireline", to: "geo",     kind: "data", label: "Wireline → Geo Object", payload: "GR / RES / NEU / DEN curves" },
  { id: "f5", from: "prod",     to: "geo",     kind: "data", label: "Production → Geo",      payload: "Monthly oil/gas/water + BHP" },
  { id: "f6", from: "faa",      to: "planner", kind: "data", label: "LAANC → Planner",       payload: "Airspace clearance token" },
  { id: "f7", from: "operator", to: "econ",    kind: "data", label: "Records → Econ",        payload: "API number + permit + plug status" },

  // Core internal
  { id: "f8",  from: "ingest", to: "cv",     kind: "data", label: "Ingest → CV",      payload: "Calibrated drone tiles + thermal channels" },
  { id: "f9",  from: "ingest", to: "geo",    kind: "data", label: "Ingest → Geo",     payload: "Validated subsurface + surface arrays" },
  { id: "f10", from: "cv",     to: "fusion", kind: "data", label: "CV → Fusion",      payload: "Detection masks + plume heatmap" },
  { id: "f11", from: "geo",    to: "fusion", kind: "score", label: "Geo → Fusion",    payload: "Joint 3D site features (GPS aligned)" },
  { id: "f12", from: "fusion", to: "dgx",    kind: "gpu",   label: "Fusion ↔ DGX",    payload: "Embeddings & training batches → H100" },
  { id: "f13", from: "geo",    to: "dgx",    kind: "gpu",   label: "Geo ↔ DGX",       payload: "Well-log transformer fine-tune jobs" },
  { id: "f14", from: "dgx",    to: "econ",   kind: "gpu",   label: "DGX → Econ",      payload: "Cost coefficients (calibrated)" },
  { id: "f15", from: "dgx",    to: "viz",    kind: "gpu",   label: "DGX → Viz",       payload: "Inferred overlays for dashboard" },
  { id: "f16", from: "econ",   to: "planner", kind: "data", label: "Econ → Planner",  payload: "Cost-aware flight prioritization" },
  { id: "f17", from: "viz",    to: "iot",    kind: "data",  label: "Viz → IoT",       payload: "Anomaly thresholds (per-zone)" },
  { id: "f18", from: "planner", to: "report", kind: "data", label: "Planner → Report", payload: "Flight execution log" },
  { id: "f19", from: "iot",    to: "report", kind: "data",  label: "IoT → Report",    payload: "Recurring scan deltas" },
  { id: "f20", from: "report", to: "store",  kind: "storage", label: "Report → Storage", payload: "Versioned score + report PDFs" },

  // Core → Outputs
  { id: "f21", from: "report", to: "score",     kind: "score", label: "Report → Score",     payload: "Composite well score (0–1)" },
  { id: "f22", from: "report", to: "epa",       kind: "score", label: "Report → EPA Pack",  payload: "Subpart W methane report" },
  { id: "f23", from: "report", to: "twin",      kind: "score", label: "Report → Twin",      payload: "3D model + score bundle" },
  { id: "f24", from: "econ",   to: "opdash",    kind: "data",  label: "Econ → Dashboard",   payload: "Live cost offset KPIs" },
  { id: "f25", from: "report", to: "regulator", kind: "score", label: "Report → Regulator", payload: "DOI / state submission package" },
  { id: "f26", from: "report", to: "pe",        kind: "score", label: "Report → PE",        payload: "Pre-acquisition due diligence" },
  { id: "f27", from: "planner", to: "rescan",   kind: "data",  label: "Planner → Rescan",   payload: "Quarterly re-flight schedule" },
];

const KIND_COLOR: Record<FlowDef["kind"], string> = {
  data: "#1A9FFF",
  gpu: "#76b900",
  score: "#f28c00",
  storage: "#6b8899",
};

// Compute attachment point on rectangle edge facing target.
function edgePoint(node: NodeDef, towardX: number, towardY: number) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = node.w / 2;
  const halfH = node.h / 2;
  const scaleX = halfW / Math.abs(dx || 1);
  const scaleY = halfH / Math.abs(dy || 1);
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

const ArchitectureDiagram = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; body: string } | null>(null);

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // Flows touching the hovered node
  const activeFlows = new Set<string>();
  if (hoveredNode) {
    FLOWS.forEach((f) => {
      if (f.from === hoveredNode || f.to === hoveredNode) activeFlows.add(f.id);
    });
  }
  if (hoveredFlow) activeFlows.add(hoveredFlow);

  const isDimmed = (id: string) => {
    if (!hoveredNode && !hoveredFlow) return false;
    if (hoveredNode && id === hoveredNode) return false;
    if (hoveredFlow) {
      const f = FLOWS.find((x) => x.id === hoveredFlow);
      if (f && (f.from === id || f.to === id)) return false;
    }
    if (hoveredNode) {
      const linked = FLOWS.some(
        (f) => (f.from === hoveredNode && f.to === id) || (f.to === hoveredNode && f.from === id)
      );
      if (linked) return false;
    }
    return true;
  };

  const handleNodeEnter = (n: NodeDef, e: React.MouseEvent) => {
    setHoveredNode(n.id);
    const rect = (e.currentTarget as SVGGElement).ownerSVGElement!.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      title: n.title,
      body: n.tip,
    });
  };

  const handleFlowEnter = (f: FlowDef, e: React.MouseEvent) => {
    setHoveredFlow(f.id);
    const rect = (e.currentTarget as SVGElement).ownerSVGElement!.getBoundingClientRect();
    const fromN = nodeMap[f.from];
    const toN = nodeMap[f.to];
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      title: `${fromN.title}  →  ${toN.title}`,
      body: f.payload,
    });
  };

  const clear = () => {
    setHoveredNode(null);
    setHoveredFlow(null);
    setTooltip(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          System Architecture · Hover any node or flow for details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox="0 0 1200 720"
            className="w-full h-auto min-w-[900px] select-none"
            xmlns="http://www.w3.org/2000/svg"
            onMouseLeave={clear}
          >
            <defs>
              {Object.entries(KIND_COLOR).map(([k, c]) => (
                <marker
                  key={k}
                  id={`arrow-${k}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
                </marker>
              ))}

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

            {/* Lanes */}
            <rect x="20" y="60" width="320" height="640" rx="14" fill="url(#laneSrc)" stroke="#76b90033" />
            <rect x="360" y="60" width="500" height="640" rx="14" fill="url(#laneCore)" stroke="#1A9FFF55" />
            <rect x="880" y="60" width="300" height="640" rx="14" fill="url(#laneOut)" stroke="#f28c0044" />

            <text x="180" y="42" textAnchor="middle" fill="#76b900" fontSize="13" fontWeight="700" letterSpacing="2">FIELD DATA SOURCES</text>
            <text x="610" y="42" textAnchor="middle" fill="#1A9FFF" fontSize="13" fontWeight="700" letterSpacing="2">AI SMART WELL · FUSION CORE</text>
            <text x="1030" y="42" textAnchor="middle" fill="#f28c00" fontSize="13" fontWeight="700" letterSpacing="2">OUTPUTS &amp; CLIENTS</text>

            {/* Flows */}
            {FLOWS.map((f) => {
              const a = nodeMap[f.from];
              const b = nodeMap[f.to];
              if (!a || !b) return null;
              const aC = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
              const bC = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
              const start = edgePoint(a, bC.x, bC.y);
              const end = edgePoint(b, aC.x, aC.y);
              const color = KIND_COLOR[f.kind];
              const active = activeFlows.has(f.id);
              const dim = (hoveredNode || hoveredFlow) && !active;
              const dashed = f.kind === "gpu" || f.kind === "storage";
              return (
                <g key={f.id}>
                  {/* invisible thick hit area for easier hover */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="transparent"
                    strokeWidth="14"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => handleFlowEnter(f, e)}
                    onMouseMove={(e) => handleFlowEnter(f, e)}
                    onMouseLeave={() => { setHoveredFlow(null); setTooltip(null); }}
                  />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={dashed ? "4 3" : undefined}
                    opacity={dim ? 0.12 : active ? 1 : 0.55}
                    markerEnd={`url(#arrow-${f.kind})`}
                    pointerEvents="none"
                  />
                  {/* endpoint dots, brighter when active */}
                  <circle cx={start.x} cy={start.y} r={active ? 4 : 2.5} fill={color} opacity={dim ? 0.15 : 1} pointerEvents="none" />
                  <circle cx={end.x} cy={end.y} r={active ? 4 : 2.5} fill={color} opacity={dim ? 0.15 : 1} pointerEvents="none" />
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const dim = isDimmed(n.id);
              const hi = hoveredNode === n.id;
              const stroke = n.color;
              return (
                <g
                  key={n.id}
                  style={{ cursor: "pointer" }}
                  opacity={dim ? 0.25 : 1}
                  onMouseEnter={(e) => handleNodeEnter(n, e)}
                  onMouseMove={(e) => handleNodeEnter(n, e)}
                  onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={n.kind === "platform" ? 25 : 8}
                    fill="#0a1422"
                    stroke={stroke}
                    strokeWidth={hi ? 2 : n.kind === "platform" ? 1 : 1.2}
                    strokeDasharray={n.kind === "platform" || n.kind === "storage" ? "4 3" : undefined}
                  />
                  {n.kind === "source" || n.kind === "output" ? (
                    <circle cx={n.x + 22} cy={n.y + n.h / 2} r="5" fill={n.color} />
                  ) : null}

                  {n.badge && (
                    <text
                      x={n.x + n.w / 2}
                      y={n.y + 22}
                      textAnchor="middle"
                      fill={n.color}
                      fontSize="10"
                      fontWeight="700"
                      letterSpacing="1.5"
                    >
                      {n.badge}
                    </text>
                  )}
                  <text
                    x={n.kind === "source" || n.kind === "output" ? n.x + 38 : n.x + n.w / 2}
                    y={n.badge ? n.y + 42 : n.y + n.h / 2 - 4}
                    textAnchor={n.kind === "source" || n.kind === "output" ? "start" : "middle"}
                    fill="#e6f4ff"
                    fontSize={n.kind === "platform" ? 11 : 13}
                    fontWeight="600"
                  >
                    {n.title}
                  </text>
                  <text
                    x={n.kind === "source" || n.kind === "output" ? n.x + 38 : n.x + n.w / 2}
                    y={n.badge ? n.y + 56 : n.y + n.h / 2 + 12}
                    textAnchor={n.kind === "source" || n.kind === "output" ? "start" : "middle"}
                    fill="#6b8899"
                    fontSize="10"
                  >
                    {n.sub}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(40, 678)">
              <line x1="0" y1="6" x2="20" y2="6" stroke={KIND_COLOR.data} strokeWidth="2" />
              <text x="26" y="10" fill="#6b8899" fontSize="10">data flow</text>
              <line x1="100" y1="6" x2="120" y2="6" stroke={KIND_COLOR.gpu} strokeWidth="2" strokeDasharray="4 3" />
              <text x="126" y="10" fill="#6b8899" fontSize="10">GPU training</text>
              <line x1="220" y1="6" x2="240" y2="6" stroke={KIND_COLOR.score} strokeWidth="2" />
              <text x="246" y="10" fill="#6b8899" fontSize="10">scored output</text>
              <line x1="340" y1="6" x2="360" y2="6" stroke={KIND_COLOR.storage} strokeWidth="2" strokeDasharray="4 3" />
              <text x="366" y="10" fill="#6b8899" fontSize="10">persistence</text>
            </g>
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 max-w-xs rounded-md border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-xl"
              style={{
                left: Math.min(tooltip.x + 14, 800),
                top: Math.max(tooltip.y - 10, 0),
              }}
            >
              <div className="text-xs font-semibold text-foreground">{tooltip.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{tooltip.body}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ArchitectureDiagram;
