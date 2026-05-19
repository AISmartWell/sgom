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
import { ArrowLeft, Boxes, Layers, Radar, Activity, Mountain, Waves, AlertTriangle } from "lucide-react";

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
};

const Scene = ({ layers, selectedId, setSelectedId }: {
  layers: LayerState;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
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
  });

  const selected = WELLS.find((w) => w.id === selectedId);

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
