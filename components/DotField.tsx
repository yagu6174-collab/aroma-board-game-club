"use client";

import { useEffect, useRef } from "react";

const HUES = [217, 5, 45, 137, 260];
const GOLDEN = 137.5 * (Math.PI / 180);

type Orb = {
  offsetX: number;
  offsetY: number;
  hue: number;
  size: number;
  phase: number;
};

export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const field = {
      ringX: window.innerWidth / 2,
      ringY: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      mouseX: -1000,
      mouseY: -1000,
      pointing: false,
    };
    let orbs: Orb[] = [];
    let time = 0;
    let frame = 0;

    const layout = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!field.pointing) {
        field.targetX = canvas.width / 2;
        field.targetY = canvas.height / 2;
      }
      const count = Math.min(150, Math.floor((canvas.width * canvas.height) / 9000));
      const spacing = canvas.width > 800 ? 55 : 35;
      orbs = Array.from({ length: count }, (_, index) => {
        const n = index + 1;
        const radius = Math.sqrt(n) * spacing;
        const angle = n * GOLDEN;
        return {
          offsetX: Math.cos(angle) * radius,
          offsetY: Math.sin(angle) * radius,
          hue: HUES[Math.floor(Math.random() * HUES.length)],
          size: Math.random() * 25 + 15,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const draw = () => {
      const follow = field.pointing ? 0.05 : 0.01;
      field.ringX += (field.targetX - field.ringX) * follow;
      field.ringY += (field.targetY - field.ringY) * follow;
      const driftX = field.pointing ? 0 : Math.sin(time * 0.7) * 60 + Math.cos(time * 0.3) * 30;
      const driftY = field.pointing ? 0 : Math.cos(time * 0.6) * 40 + Math.sin(time * 0.4) * 20;
      const originX = field.ringX + driftX;
      const originY = field.ringY + driftY;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        const breathe = 1 + Math.sin(time * 1.5 + orb.phase * 0.1) * 0.1;
        let x = originX + orb.offsetX * breathe + Math.sin(time * 1.2 + orb.phase) * 12;
        let y = originY + orb.offsetY * breathe + Math.cos(time * 1.4 + orb.phase) * 12;
        if (field.pointing) {
          const dx = field.mouseX - x;
          const dy = field.mouseY - y;
          const distSq = dx * dx + dy * dy;
          const reach = 220;
          if (distSq > 0 && distSq < reach * reach) {
            const dist = Math.sqrt(distSq);
            const force = ((reach - dist) / reach) ** 2;
            x -= (dx / dist) * force * 45;
            y -= (dy / dist) * force * 45;
          }
        }
        const hue = (orb.hue + time * 8) % 360;
        const light = 50 + Math.sin(time * 2 + orb.phase) * 15;
        const alpha = 0.55 + Math.sin(time * 1.5 + orb.phase) * 0.12;
        const paint = ctx.createRadialGradient(x, y, 0, x, y, orb.size);
        paint.addColorStop(0, `hsla(${hue}, 90%, ${light}%, ${alpha})`);
        paint.addColorStop(0.4, `hsla(${hue}, 90%, ${light}%, ${alpha * 0.3})`);
        paint.addColorStop(1, `hsla(${hue}, 90%, ${light}%, 0)`);
        ctx.fillStyle = paint;
        ctx.beginPath();
        ctx.arc(x, y, orb.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onMove = (event: MouseEvent) => {
      const box = canvas.getBoundingClientRect();
      field.mouseX = event.clientX - box.left;
      field.mouseY = event.clientY - box.top;
      field.pointing = true;
      field.targetX = field.mouseX;
      field.targetY = field.mouseY;
    };
    const onLeave = () => {
      field.pointing = false;
      field.mouseX = -1000;
      field.mouseY = -1000;
      field.targetX = canvas.width / 2;
      field.targetY = canvas.height / 2;
    };
    const onResize = () => layout();

    layout();
    draw();
    window.addEventListener("resize", onResize);
    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseleave", onLeave);
      const loop = () => {
        time += 0.012;
        draw();
        frame = window.requestAnimationFrame(loop);
      };
      frame = window.requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-90 mix-blend-multiply" aria-hidden="true" />;
}
