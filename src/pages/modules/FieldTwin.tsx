import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Boxes, Layers, Radar, Activity, Mountain, Waves, AlertTriangle, TrendingUp, Wind } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

// ============================================================
// Deterministic seed helpers (no Math.random per project memory)
// ============================================================
const stableHash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

// ============================================================
// Demo wells (Brawner 10-15 pad area, fictional local coords)
// ============================================================
type WellInfo = {
  id: string;
  name: string;
  position: [number, number, number];
  status: "producing" | "shut-in" | "candidate";
  oil_bpd: number;
  wct: number;
  formation: string;
  sptScore: number;
  surfaceRisk: "low" | "med" | "high";
};

const WELLS: WellInfo[] = [
  { id: "w1", name: "Brawner 10-15", position: [-2, 0, 1], status: "producing", oil_bpd: 78, wct: 0.42, formation: "Cherokee", sptScore: 0.81, surfaceRisk: "low" },
  { id: "w2", name: "Brawner 11-15", position: [1.5, 0, -1.5], status: "candidate", oil_bpd: 32, wct: 0.68, formation: "Cherokee", sptScore: 0.74, surfaceRisk: "med" },
  { id: "w3", name: "Brawner 12-15", position: [2.5, 0, 1.8], status: "producing", oil_bpd: 54, wct: 0.51, formation: "Mississippi Lime", sptScore: 0.62, surfaceRisk: "low" },
  { id: "w4", name: "Brawner 13-15", position: [-1.2, 0, -2.4], status: "shut-in", oil_bpd: 0, wct: 0.92, formation: "Cherokee", sptScore: 0.41, surfaceRisk: "high" },
];

// ============================================================
// Deterministic 24-month series for selected well (no Math.random)
// ============================================================
type WellSeriesPoint = { month: string; oil: number; wct: number; spt: number };

const buildWellSeries = (w: WellInfo): WellSeriesPoint[] => {
  const months = 24;
  const out: WellSeriesPoint[] = [];
  // Reverse Arps-style: start higher, decline toward current oil_bpd
  const startOil = Math.max(w.oil_bpd * 1.8, 25);
  const endOil = w.oil_bpd;
  const startWct = Math.max(w.wct - 0.35, 0.05);
  const endWct = w.wct;
  const startSpt = Math.max(w.sptScore - 0.25, 0.15);
  const endSpt = w.sptScore;

  const now = new Date();
  for (let i = 0; i < months; i++) {
    const t = i / (months - 1);
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const month = d.toLocaleString("en-US", { month: "short", year: "2-digit" });

    const noiseOil = (stableHash(`${w.id}_oil_${i}`) - 0.5) * 0.18;
    const noiseWct = (stableHash(`${w.id}_wct_${i}`) - 0.5) * 0.06;
    const noiseSpt = (stableHash(`${w.id}_spt_${i}`) - 0.5) * 0.08;

    // Exponential-ish decline for oil
    const oilTrend = startOil * Math.pow(endOil / Math.max(startOil, 1), t);
    const oil = Math.max(0, oilTrend * (1 + noiseOil));
    const wct = Math.min(0.99, Math.max(0, startWct + (endWct - startWct) * t + noiseWct));
    const spt = Math.min(1, Math.max(0, startSpt + (endSpt - startSpt) * t + noiseSpt));

    out.push({ month, oil: +oil.toFixed(1), wct: +(wct * 100).toFixed(1), spt: +spt.toFixed(3) });
  }
  return out;
};

// ============================================================
// Subsurface layers
// ============================================================
const LAYERS = [
  { y: 2.0, h: 0.8, color: "#d4a574", label: "Overburden", opacity: 0.45 },
  { y: 1.1, h: 0.6, color: "#6b7280", label: "Shale Seal", opacity: 0.55 },
  { y: 0.2, h: 1.2, color: "#22c55e", label: "Cherokee Sand", opacity: 0.55, reservoir: true },
  { y: -1.1, h: 0.8, color: "#4b5563", label: "Basement", opacity: 0.65 },
];

// ============================================================
// 3D components
// ============================================================
const SubsurfaceLayer = ({ y, h, color, opacity, label, reservoir }: typeof LAYERS[0]) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(10, h, 10, 24, 1, 24);
    const pos = geo.getAttribute("position");
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(arr[i] * 0.5 + arr[i + 2] * 0.35) * 0.18;
    }
    geo.computeVertexNormals();
    return geo;
  }, [h]);

  useFrame((state) => {
    if (reservoir && meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = opacity + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  return (
    <group position={[0, y, 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[5.4, 0, 0]} fontSize={0.28} color="#94a3b8" anchorX="left">{label}</Text>
    </group>
  );
};

const Well = ({ w, selected, onSelect }: { w: WellInfo; selected: boolean; onSelect: (id: string) => void }) => {
  const color = w.status === "producing" ? "#22c55e" : w.status === "candidate" ? "#1A9FFF" : "#ef4444";
  return (
    <group position={w.position}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(w.id); }}>
        <cylinderGeometry args={[0.08, 0.08, 5, 16]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.22, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.6 : 0.2} />
      </mesh>
      {selected && (
        <mesh position={[0, 2.7, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color="#1A9FFF" side={THREE.DoubleSide} />
        </mesh>
      )}
      <Text position={[0, 3.1, 0]} fontSize={0.18} color="#e2e8f0" anchorX="center">{w.name}</Text>
    </group>
  );
};

// Surface mesh placeholder (procedural terrain that mimics drone-built DEM)
const SurfaceMesh = ({ opacity }: { opacity: number }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, 60, 60);
    const pos = geo.getAttribute("position");
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      const seed = stableHash(`${x.toFixed(2)}_${y.toFixed(2)}`);
      arr[i + 2] =
        Math.sin(x * 0.6) * 0.12 +
        Math.cos(y * 0.5) * 0.1 +
        (seed - 0.5) * 0.08;
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.85, 0]}>
      <meshStandardMaterial
        color="#3a4a3a"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        wireframe={false}
        flatShading
      />
    </mesh>
  );
};

// Drone hovering above selected well
const Drone = ({ target }: { target: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.set(
      target[0] + Math.cos(t * 0.6) * 1.2,
      target[1] + 4.2 + Math.sin(t * 1.2) * 0.1,
      target[2] + Math.sin(t * 0.6) * 1.2
    );
    ref.current.rotation.y = t * 0.6 + Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.25, 0.06, 0.25]} />
        <meshStandardMaterial color="#1A9FFF" emissive="#1A9FFF" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#1A9FFF" intensity={0.6} distance={3} />
    </group>
  );
};

// Animated waterfront / flood front (dynamic twin)
const FloodFront = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 4 + Math.sin(state.clock.elapsedTime * 0.4) * 1.2;
    ref.current.scale.set(s, 1, s);
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <mesh ref={ref} position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 1, 48]} />
      <meshStandardMaterial color="#1A9FFF" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Faults
const Fault = () => (
  <mesh position={[-2.5, 0.3, 2]} rotation={[0, 0, Math.PI / 7]}>
    <planeGeometry args={[0.25, 4]} />
    <meshStandardMaterial color="#ef4444" transparent opacity={0.55} side={THREE.DoubleSide} />
  </mesh>
);

// Fluid contact (OWC)
const OWC = () => (
  <group>
    <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#1A9FFF" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
    <Text position={[4.2, -0.55, 0]} fontSize={0.22} color="#1A9FFF" anchorX="left">OWC -10,335 ft</Text>
  </group>
);

// ============================================================
// CH₄ concentration field (drone gas sensor) — deterministic
// ============================================================
type CH4Sample = { x: number; z: number; ppm: number };

// CH4 ppm thresholds (ambient ≈ 1.9 ppm)
const CH4_LEVELS = [
  { label: "Background", max: 2.5, color: "#1e3a8a" },   // deep blue
  { label: "Low", max: 5, color: "#06b6d4" },             // cyan
  { label: "Elevated", max: 15, color: "#22c55e" },       // green
  { label: "High", max: 50, color: "#eab308" },           // yellow
  { label: "Critical", max: 200, color: "#f97316" },      // orange
  { label: "Leak", max: Infinity, color: "#ef4444" },     // red
];

const ch4Color = (ppm: number) => CH4_LEVELS.find((l) => ppm <= l.max)!.color;

const buildCH4Field = (): CH4Sample[] => {
  const grid: CH4Sample[] = [];
  const N = 28; // 28×28 ≈ 784 samples
  const half = 5;
  // Per-well emission strength based on surfaceRisk + WCT (proxy for leaks)
  const sources = WELLS.map((w) => ({
    x: w.position[0],
    z: w.position[2],
    strength:
      (w.surfaceRisk === "high" ? 140 : w.surfaceRisk === "med" ? 55 : 12) *
      (0.7 + w.wct * 0.6),
    radius: w.surfaceRisk === "high" ? 2.4 : w.surfaceRisk === "med" ? 1.8 : 1.2,
  }));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = -half + (i / (N - 1)) * 2 * half;
      const z = -half + (j / (N - 1)) * 2 * half;
      let ppm = 1.9; // ambient background
      for (const s of sources) {
        const d = Math.hypot(x - s.x, z - s.z);
        // Gaussian-like falloff
        ppm += s.strength * Math.exp(-(d * d) / (2 * s.radius * s.radius));
      }
      // Deterministic small noise via stableHash
      const n = (stableHash(`ch4_${i}_${j}`) - 0.5) * 1.8;
      ppm = Math.max(1.7, ppm + n);
      grid.push({ x, z, ppm });
    }
  }
  return grid;
};

// Per-well max ppm at well location (for hotspot ranking)
const wellCH4 = (w: WellInfo, field: CH4Sample[]): number => {
  let best = 0;
  for (const s of field) {
    const d = Math.hypot(s.x - w.position[0], s.z - w.position[2]);
    if (d < 0.5 && s.ppm > best) best = s.ppm;
  }
  return best;
};

const MethaneHeatmap = ({ field, opacity }: { field: CH4Sample[]; opacity: number }) => {
  // Use one InstancedMesh for performance
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cellSize = useMemo(() => {
    if (field.length < 2) return 0.35;
    // distance between two neighbouring samples in x
    let minDx = Infinity;
    for (let i = 1; i < field.length; i++) {
      const dx = Math.abs(field[i].x - field[i - 1].x);
      if (dx > 0.001 && dx < minDx) minDx = dx;
    }
    return minDx * 1.05;
  }, [field]);

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    field.forEach((s, i) => {
      dummy.position.set(s.x, 2.92, s.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      // Scale by intensity a bit so leaks read bigger
      const scale = Math.min(1.6, 0.6 + Math.log10(Math.max(s.ppm, 2)) * 0.35);
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      color.set(ch4Color(s.ppm));
      meshRef.current!.setColorAt(i, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [field, cellSize]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, field.length]}>
      <planeGeometry args={[cellSize, cellSize]} />
      <meshBasicMaterial transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
};

// Pulsing ring around nearest CH₄ hotspots for the selected well
const MethaneHotspots = ({ sources }: { sources: { pos: [number, number, number]; ppm: number }[] }) => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = 1 + Math.sin(t * 2 + i) * 0.15;
      m.scale.set(s, s, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 2 + i) * 0.2;
    });
  });
  return (
    <>
      {sources.map((s, i) => (
        <group key={i} position={[s.pos[0], 2.95, s.pos[2]]}>
          <mesh ref={(el) => (refs.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.55, 32]} />
            <meshBasicMaterial color={ch4Color(s.ppm)} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 0.25, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap"
              style={{
                background: "rgba(15,23,42,0.85)",
                color: ch4Color(s.ppm),
                border: `1px solid ${ch4Color(s.ppm)}`,
              }}
            >
              {s.ppm.toFixed(1)} ppm CH₄
            </div>
          </Html>
        </group>
      ))}
    </>
  );
};

// ============================================================
// Scene
// ============================================================
type LayerState = {
  surface: boolean;
  subsurface: boolean;
  wells: boolean;
  faults: boolean;
  owc: boolean;
  dynamic: boolean;
  drone: boolean;
  methane: boolean;
};

const Scene = ({ layers, selectedId, setSelectedId, ch4Field, hotspots }: {
  layers: LayerState;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  ch4Field: CH4Sample[];
  hotspots: { pos: [number, number, number]; ppm: number }[];
}) => {
  const selectedWell = WELLS.find((w) => w.id === selectedId);

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 12, 6]} intensity={0.85} />
      <pointLight position={[-10, -6, -8]} intensity={0.3} color="#1A9FFF" />

      {layers.subsurface && LAYERS.map((l) => <SubsurfaceLayer key={l.label} {...l} />)}
      {layers.surface && <SurfaceMesh opacity={0.85} />}
      {layers.owc && <OWC />}
      {layers.faults && <Fault />}
      {layers.dynamic && <FloodFront />}
      {layers.methane && <MethaneHeatmap field={ch4Field} opacity={0.55} />}
      {layers.methane && hotspots.length > 0 && <MethaneHotspots sources={hotspots} />}
      {layers.wells && WELLS.map((w) => (
        <Well key={w.id} w={w} selected={selectedId === w.id} onSelect={setSelectedId} />
      ))}
      {layers.drone && selectedWell && <Drone target={selectedWell.position} />}

      <Grid
        position={[0, -1.6, 0]}
        args={[12, 12]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1f2937"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={40}
        fadeStrength={1}
      />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={28}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
};

// ============================================================
// Page
// ============================================================
const FieldTwin = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>("w2");
  const [layers, setLayers] = useState<LayerState>({
    surface: true,
    subsurface: true,
    wells: true,
    faults: true,
    owc: true,
    dynamic: true,
    drone: true,
    methane: true,
  });

  const selected = WELLS.find((w) => w.id === selectedId);
  const series = useMemo(() => (selected ? buildWellSeries(selected) : []), [selected]);
  const sptDelta = series.length > 1 ? series[series.length - 1].spt - series[0].spt : 0;

  // CH₄ concentration grid (deterministic)
  const ch4Field = useMemo(() => buildCH4Field(), []);

  // Nearest CH₄ hotspots around selected well (top-3 samples within 2.5 units)
  const hotspots = useMemo(() => {
    if (!selected) return [];
    const ranked = ch4Field
      .map((s) => ({
        pos: [s.x, 0, s.z] as [number, number, number],
        ppm: s.ppm,
        d: Math.hypot(s.x - selected.position[0], s.z - selected.position[2]),
      }))
      .filter((s) => s.d < 2.5 && s.ppm > 5)
      .sort((a, b) => b.ppm - a.ppm)
      .slice(0, 3);
    return ranked.map(({ pos, ppm }) => ({ pos, ppm }));
  }, [ch4Field, selected]);

  const selectedWellCH4 = selected ? wellCH4(selected, ch4Field) : 0;

  const toggle = (k: keyof LayerState) => setLayers((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Field Digital Twin</h1>
                <Badge variant="outline" className="border-primary text-primary">Beta</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Unified 3D twin: drone surface · subsurface model · dynamic flow
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-success/20 text-success border-success/40">Surface scan: 3d ago</Badge>
          <Badge className="bg-primary/20 text-primary border-primary/40">Subsurface v2.1</Badge>
          <Badge className="bg-warning/20 text-warning border-warning/40">Dynamic +12h</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: layer toggles */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow icon={<Mountain className="h-4 w-4" />} label="Surface (Drone DEM)" checked={layers.surface} onChange={() => toggle("surface")} />
            <ToggleRow icon={<Boxes className="h-4 w-4" />} label="Subsurface Layers" checked={layers.subsurface} onChange={() => toggle("subsurface")} />
            <ToggleRow icon={<Activity className="h-4 w-4" />} label="Wells" checked={layers.wells} onChange={() => toggle("wells")} />
            <ToggleRow icon={<AlertTriangle className="h-4 w-4" />} label="Faults" checked={layers.faults} onChange={() => toggle("faults")} />
            <ToggleRow icon={<Waves className="h-4 w-4" />} label="OWC Contact" checked={layers.owc} onChange={() => toggle("owc")} />
            <ToggleRow icon={<Waves className="h-4 w-4" />} label="Dynamic Front" checked={layers.dynamic} onChange={() => toggle("dynamic")} />
            <ToggleRow icon={<Radar className="h-4 w-4" />} label="Drone Orbit" checked={layers.drone} onChange={() => toggle("drone")} />
            <ToggleRow icon={<Wind className="h-4 w-4" />} label="CH₄ Concentration" checked={layers.methane} onChange={() => toggle("methane")} />

            <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wells</p>
              {WELLS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    selectedId === w.id ? "bg-primary/20 border border-primary/40" : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{w.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 px-1 ${
                        w.status === "producing"
                          ? "border-success/50 text-success"
                          : w.status === "candidate"
                          ? "border-primary/50 text-primary"
                          : "border-destructive/50 text-destructive"
                      }`}
                    >
                      {w.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center: 3D scene */}
        <Card className="glass-card lg:col-span-2 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[560px] bg-slate-950">
              <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading twin…</div>}>
                <Canvas camera={{ position: [10, 7, 10], fov: 50 }}>
                  <Scene layers={layers} selectedId={selectedId} setSelectedId={setSelectedId} />
                </Canvas>
              </Suspense>
            </div>
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
              <span>CRS: local UTM (demo) · Vertical exag ×4</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: selected well details */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selected Object</CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Well</p>
                  <p className="text-lg font-bold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.formation}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Oil" value={`${selected.oil_bpd} BPD`} />
                  <Stat label="WCT" value={`${(selected.wct * 100).toFixed(0)}%`} />
                  <Stat label="SPT Score" value={selected.sptScore.toFixed(2)} accent />
                  <Stat label="Surface Risk" value={selected.surfaceRisk.toUpperCase()} risk={selected.surfaceRisk} />
                </div>

                <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wider">9-Stage snapshot</p>
                  <StageLine n={3} label="Core" value="k=47 mD" />
                  <StageLine n={5} label="Seismic" value="Bright spot ✓" />
                  <StageLine n={6} label="SPT" value={`Score ${selected.sptScore.toFixed(2)}`} />
                  <StageLine n={8} label="Geophys" value="Sw=0.31" />
                  <StageLine n={9} label="EOR" value={selected.sptScore > 0.7 ? "SPT recommended" : "Re-eval"} />
                </div>

                <div className="pt-3 border-t border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Oil / WCT — 24 mo
                    </p>
                    <span className="text-[10px] text-muted-foreground">monthly</span>
                  </div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={series} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 2" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          interval={5}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="oil"
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <YAxis
                          yAxisId="wct"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={28}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                          formatter={(v: number, n: string) =>
                            n === "WCT" ? [`${v}%`, n] : [`${v} BPD`, n]
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                        <Area
                          yAxisId="oil"
                          type="monotone"
                          dataKey="oil"
                          name="Oil"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.18}
                          strokeWidth={1.8}
                          dot={false}
                        />
                        <Line
                          yAxisId="wct"
                          type="monotone"
                          dataKey="wct"
                          name="WCT"
                          stroke="#1A9FFF"
                          strokeWidth={1.8}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      SPT Score Trend
                    </p>
                    <span
                      className={`text-[10px] flex items-center gap-1 ${
                        sptDelta >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {sptDelta >= 0 ? "+" : ""}
                      {(sptDelta * 100).toFixed(1)} pts
                    </span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 2" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          interval={5}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 1]}
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <ReferenceLine
                          y={0.7}
                          stroke="#1A9FFF"
                          strokeDasharray="3 3"
                          label={{ value: "SPT cutoff 0.70", fontSize: 9, fill: "#1A9FFF", position: "insideTopRight" }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                          formatter={(v: number) => [v.toFixed(3), "SPT"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="spt"
                          stroke="#a78bfa"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <Button className="w-full" size="sm" onClick={() => navigate("/dashboard/spt-projection")}>
                  Open SPT projection
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click a well in the 3D scene.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom strip: data freshness */}
      <Card className="glass-card mt-4">
        <CardContent className="py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <FreshnessItem label="Surface DEM" detail="Drone RGB+LiDAR+VPS" status="3 days ago" tone="success" />
            <FreshnessItem label="Subsurface" detail="Stage 5 Seismic v2.1" status="updated 1 week ago" tone="primary" />
            <FreshnessItem label="Dynamic" detail="Cosmos Predict +12h" status="streaming" tone="warning" />
            <FreshnessItem label="Telemetry" detail="SCADA · 4 wells" status="live" tone="success" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Small UI helpers
// ============================================================
const ToggleRow = ({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between">
    <Label className="flex items-center gap-2 text-sm cursor-pointer">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Stat = ({ label, value, accent, risk }: { label: string; value: string; accent?: boolean; risk?: "low" | "med" | "high" }) => {
  const cls = risk
    ? risk === "high"
      ? "text-destructive"
      : risk === "med"
      ? "text-warning"
      : "text-success"
    : accent
    ? "text-primary"
    : "text-foreground";
  return (
    <div className="p-2 bg-muted/30 rounded">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-bold ${cls}`}>{value}</p>
    </div>
  );
};

const StageLine = ({ n, label, value }: { n: number; label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-2">
      <Badge variant="outline" className="h-4 px-1 text-[10px]">Stage {n}</Badge>
      <span className="text-muted-foreground">{label}</span>
    </span>
    <span className="font-mono">{value}</span>
  </div>
);

const FreshnessItem = ({ label, detail, status, tone }: { label: string; detail: string; status: string; tone: "success" | "primary" | "warning" }) => {
  const toneCls = tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-warning";
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{detail}</p>
      <p className={`mt-0.5 ${toneCls}`}>● {status}</p>
    </div>
  );
};

export default FieldTwin;
