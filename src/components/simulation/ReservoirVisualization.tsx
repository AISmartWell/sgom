import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Line } from "@react-three/drei";
import * as THREE from "three";

interface WellProps {
  position: [number, number, number];
  depth: number;
  isProducing: boolean;
  productionRate: number;
  name: string;
}

const Well = ({ position, depth, isProducing, productionRate, name }: WellProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Animate particles rising if producing
  useFrame((state) => {
    if (particlesRef.current && isProducing) {
      particlesRef.current.rotation.y += 0.02;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.02;
        if (positions[i] > 0.5) {
          positions[i] = -depth + 0.5;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Create particle positions for oil flow
  const particles = useMemo(() => {
    const count = 20;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = -Math.random() * depth;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return positions;
  }, [depth]);

  return (
    <group position={position}>
      {/* Well casing */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.05, 0.05, depth, 8]} />
        <meshStandardMaterial 
          color={isProducing ? "#22c55e" : "#6b7280"} 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Wellhead */}
      <mesh position={[0, depth / 2 + 0.1, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Oil flow particles */}
      {isProducing && (
        <points ref={particlesRef} position={[0, depth / 2, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={20}
              array={particles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.03} color="#f59e0b" transparent opacity={0.8} />
        </points>
      )}

      {/* Well name label */}
      <Text
        position={[0, depth / 2 + 0.4, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      
      {/* Production rate */}
      {isProducing && (
        <Text
          position={[0, depth / 2 + 0.25, 0]}
          fontSize={0.08}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          {productionRate} BPD
        </Text>
      )}
    </group>
  );
};

interface ReservoirLayerProps {
  yPosition: number;
  color: string;
  opacity: number;
  name: string;
}

const ReservoirLayer = ({ yPosition, color, opacity, name }: ReservoirLayerProps) => {
  return (
    <group position={[0, yPosition, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const FluidFlow = () => {
  const lineRef = useRef<THREE.Line>(null);
  const [offset, setOffset] = useState(0);

  useFrame(() => {
    setOffset((prev) => (prev + 0.01) % 1);
  });

  // Create flow path points
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push([
        Math.sin(t * Math.PI * 2) * 0.5,
        -2 + t * 1.5,
        Math.cos(t * Math.PI * 2) * 0.5,
      ]);
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#f59e0b"
      lineWidth={2}
      dashed
      dashScale={5}
      dashSize={0.2}
      dashOffset={offset}
    />
  );
};

const PressureField = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 2, 32]} />
      <meshStandardMaterial
        color="#6366f1"
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface ReservoirVisualizationProps {
  isSimulating: boolean;
}

const ReservoirVisualization = ({ isSimulating }: ReservoirVisualizationProps) => {
  const wells: WellProps[] = [
    { position: [-1, 0, -1], depth: 3, isProducing: true, productionRate: 65, name: "W-001" },
    { position: [1, 0, -0.5], depth: 2.8, isProducing: true, productionRate: 52, name: "W-002" },
    { position: [0, 0, 1], depth: 3.2, isProducing: isSimulating, productionRate: 78, name: "W-003" },
    { position: [-0.8, 0, 0.8], depth: 2.5, isProducing: false, productionRate: 0, name: "W-004" },
  ];

  const layers: ReservoirLayerProps[] = [
    { yPosition: 0, color: "#8b5a2b", opacity: 0.3, name: "Surface" },
    { yPosition: -1, color: "#a0522d", opacity: 0.4, name: "Shale" },
    { yPosition: -2, color: "#daa520", opacity: 0.5, name: "Reservoir (Sandstone)" },
    { yPosition: -3, color: "#696969", opacity: 0.3, name: "Basement" },
  ];

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden bg-slate-900/80 border border-border/50">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={45} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-3, 2, -3]} intensity={0.5} color="#6366f1" />
        
        {/* Reservoir layers */}
        {layers.map((layer, index) => (
          <ReservoirLayer key={index} {...layer} />
        ))}
        
        {/* Wells */}
        {wells.map((well, index) => (
          <Well key={index} {...well} />
        ))}
        
        {/* Fluid flow visualization */}
        {isSimulating && <FluidFlow />}
        
        {/* Pressure field */}
        <PressureField />
        
        {/* Grid helper */}
        <gridHelper args={[6, 12, "#4b5563", "#374151"]} position={[0, -3.01, 0]} />
      </Canvas>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>Producing Well</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span>Inactive Well</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-1 bg-warning rounded" />
          <span>Oil Flow</span>
        </div>
      </div>
    </div>
  );
};

export default ReservoirVisualization;
