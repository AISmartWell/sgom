import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Grid } from "@react-three/drei";
import * as THREE from "three";

interface LayerProps {
  position: [number, number, number];
  color: string;
  opacity: number;
  height: number;
  label: string;
  isReservoir?: boolean;
}

const GeologicalLayer = ({ position, color, opacity, height, label, isReservoir }: LayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isReservoir) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  // Create wavy geometry for more realistic layers
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(8, height, 8, 20, 1, 20);
    const positionAttr = geo.getAttribute('position');
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      // Add subtle waves
      positions[i + 1] += Math.sin(x * 0.5 + z * 0.3) * 0.15;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [height]);

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        position={[4.5, 0, 0]}
        fontSize={0.25}
        color="white"
        anchorX="left"
      >
        {label}
      </Text>
    </group>
  );
};

const Well = ({ position }: { position: [number, number, number] }) => {
  const wellRef = useRef<THREE.Group>(null);

  return (
    <group ref={wellRef} position={position}>
      {/* Well casing */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 5, 16]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Well head */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Production indicator */}
      <pointLight position={[0, 2.8, 0]} color="#22c55e" intensity={0.5} distance={1} />
    </group>
  );
};

const FaultLine = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  const lineRef = useRef<THREE.Line>(null);
  
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color: "#ef4444", linewidth: 2 });
  }, []);

  return (
    <group>
      <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />
      {/* Fault plane */}
      <mesh position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]} rotation={[0, 0, Math.PI / 6]}>
        <planeGeometry args={[0.3, 4]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const FluidContacts = () => {
  return (
    <group>
      {/* Oil-Water Contact */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[4, -0.5, 0]} fontSize={0.2} color="#3b82f6" anchorX="left">
        OWC -10,335 ft
      </Text>
      
      {/* Gas-Oil Contact */}
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#eab308" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[3.5, 0.8, 0]} fontSize={0.2} color="#eab308" anchorX="left">
        GOC -9,678 ft
      </Text>
    </group>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Geological layers from top to bottom */}
      <GeologicalLayer
        position={[0, 2, 0]}
        color="#d4a574"
        opacity={0.6}
        height={0.8}
        label="Overburden"
      />
      <GeologicalLayer
        position={[0, 1.2, 0]}
        color="#6b7280"
        opacity={0.7}
        height={0.6}
        label="Shale Seal"
      />
      <GeologicalLayer
        position={[0, 0.3, 0]}
        color="#22c55e"
        opacity={0.5}
        height={1.2}
        label="Reservoir Sand"
        isReservoir
      />
      <GeologicalLayer
        position={[0, -1, 0]}
        color="#4b5563"
        opacity={0.8}
        height={0.8}
        label="Basement"
      />

      {/* Wells */}
      <Well position={[-1.5, 0, 1]} />
      <Well position={[1, 0, -1.5]} />
      <Well position={[2, 0, 1.5]} />

      {/* Fault */}
      <FaultLine start={[-3, 2.5, 2]} end={[-2, -1.5, 3]} />

      {/* Fluid contacts */}
      <FluidContacts />

      {/* Grid helper */}
      <Grid
        position={[0, -1.5, 0]}
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#374151"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4b5563"
        fadeDistance={30}
        fadeStrength={1}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

const Geological3DModel = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">3D Structural Model</h4>
          <p className="text-sm text-muted-foreground">Interactive geological framework with wells and fluid contacts</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Reservoir</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Fault</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>OWC</span>
          </div>
        </div>
      </div>

      <div className="h-80 bg-slate-900/50 rounded-lg overflow-hidden">
        <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>

      {/* Model Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-lg font-bold text-primary">12.5 km²</p>
          <p className="text-xs text-muted-foreground">Model Area</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-center">
          <p className="text-lg font-bold text-accent">4</p>
          <p className="text-xs text-muted-foreground">Horizons</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-lg font-bold text-success">2.1M</p>
          <p className="text-xs text-muted-foreground">Grid Cells</p>
        </div>
        <div className="p-3 bg-warning/10 rounded-lg text-center">
          <p className="text-lg font-bold text-warning">1</p>
          <p className="text-xs text-muted-foreground">Faults</p>
        </div>
      </div>
    </div>
  );
};

export default Geological3DModel;
