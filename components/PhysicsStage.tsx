"use client";

import dynamic from "next/dynamic";

const PhysicsBackground = dynamic(() => import("@/components/PhysicsBackground"), { ssr: false });

export default function PhysicsStage() {
  return <PhysicsBackground />;
}
