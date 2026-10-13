"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BallCollider, CapsuleCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";

type Shape = "sphere" | "box" | "capsule";

type Piece = {
  id: number;
  shape: Shape;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  spin: [number, number, number];
  color: string;
  glow: string;
  size: number;
};

const PAIRS: [string, string][] = [
  ["#ff2d55", "#ff9f0a"],
  ["#7c5cff", "#22d3ee"],
  ["#00f0ff", "#3b82f6"],
  ["#f472b6", "#a78bfa"],
  ["#a3e635", "#22d3ee"],
  ["#fb7185", "#facc15"],
  ["#38bdf8", "#e879f9"],
  ["#f97316", "#f43f5e"],
];

function spawn(width: number, height: number): Piece[] {
  const count = 30 + Math.floor(Math.random() * 21);
  const shapes: Shape[] = ["sphere", "box", "capsule"];
  return Array.from({ length: count }, (_, id) => {
    const [color, glow] = PAIRS[id % PAIRS.length];
    return {
      id,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      position: [(Math.random() - 0.5) * width * 0.82, (Math.random() - 0.5) * height * 0.72, (Math.random() - 0.5) * 1.4],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      velocity: [(Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.4],
      spin: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
      color,
      glow,
      size: 0.42 + Math.random() * 0.5,
    };
  });
}

function Neon({ color, glow }: { color: string; glow: string }) {
  return <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={2.2} roughness={0.2} metalness={0.05} toneMapped={false} />;
}

function Toy({ piece }: { piece: Piece }) {
  const radius = piece.size;
  return (
    <RigidBody
      colliders={false}
      position={piece.position}
      rotation={piece.rotation}
      linearVelocity={piece.velocity}
      angularVelocity={piece.spin}
      restitution={0.72}
      friction={0.15}
      linearDamping={0.35}
      angularDamping={0.4}
    >
      {piece.shape === "sphere" ? <BallCollider args={[radius]} /> : null}
      {piece.shape === "box" ? <CuboidCollider args={[radius, radius, radius]} /> : null}
      {piece.shape === "capsule" ? <CapsuleCollider args={[radius * 0.85, radius * 0.48]} /> : null}
      <mesh castShadow={false} receiveShadow={false}>
        {piece.shape === "sphere" ? <sphereGeometry args={[radius, 32, 32]} /> : null}
        {piece.shape === "box" ? <boxGeometry args={[radius * 2, radius * 2, radius * 2]} /> : null}
        {piece.shape === "capsule" ? <capsuleGeometry args={[radius * 0.48, radius * 1.7, 8, 16]} /> : null}
        <Neon color={piece.color} glow={piece.glow} />
      </mesh>
    </RigidBody>
  );
}

function Walls() {
  const { viewport } = useThree();
  const halfW = viewport.width / 2;
  const halfH = viewport.height / 2;
  const thick = 1;
  return (
    <RigidBody type="fixed" colliders={false} restitution={0.45} friction={0.2}>
      <CuboidCollider args={[halfW + thick, thick, 4]} position={[0, -halfH - thick, 0]} />
      <CuboidCollider args={[halfW + thick, thick, 4]} position={[0, halfH + thick, 0]} />
      <CuboidCollider args={[thick, halfH + thick, 4]} position={[-halfW - thick, 0, 0]} />
      <CuboidCollider args={[thick, halfH + thick, 4]} position={[halfW + thick, 0, 0]} />
      <CuboidCollider args={[halfW + thick, halfH + thick, thick]} position={[0, 0, -2.4]} />
      <CuboidCollider args={[halfW + thick, halfH + thick, thick]} position={[0, 0, 2.4]} />
    </RigidBody>
  );
}

function Pointer() {
  const body = useRef<RapierRigidBody>(null);
  const { viewport, pointer } = useThree();
  useFrame(() => {
    body.current?.setNextKinematicTranslation({
      x: (pointer.x * viewport.width) / 2,
      y: (pointer.y * viewport.height) / 2,
      z: 0,
    });
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} ccd friction={0} restitution={0.2}>
      <BallCollider args={[0.62]} />
    </RigidBody>
  );
}

function World() {
  const { viewport } = useThree();
  const [pieces] = useState(() => spawn(Math.max(viewport.width, 8), Math.max(viewport.height, 6)));
  return (
    <Physics gravity={[0, 0, 0]} timeStep={1 / 60}>
      <Walls />
      <Pointer />
      {pieces.map((piece) => (
        <Toy key={piece.id} piece={piece} />
      ))}
    </Physics>
  );
}

export default function PhysicsBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 6, 8]} intensity={40} color="#ffffff" />
      <World />
    </Canvas>
  );
}
