/// <reference types="vite/client" />

declare module "leaflet-draw" {}

// Fix R3F JSX intrinsic element types for Three.js materials/geometries
import type { Object3DNode, MaterialNode, BufferGeometryNode } from "@react-three/fiber";
import * as THREE from "three";

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshStandardMaterial: MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
    meshBasicMaterial: MaterialNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
    pointsMaterial: MaterialNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;
    bufferAttribute: BufferGeometryNode<THREE.BufferAttribute, typeof THREE.BufferAttribute>;
  }
}
