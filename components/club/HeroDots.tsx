"use client";

import { useEffect, useRef } from "react";

const HUES = [25, 140, 205, 275, 330];

export default function HeroDots() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Dot = { x: number; y: number; r: number; hue: number; alpha: number; phase: number };
    let dots: Dot[] = [];
    let frame = 0;

    const layout = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
      const count = Math.min(90, Math.max(24, Math.floor((width * height) / 16000)));
      dots = Array.from({ length: count }, (_, index) => {
        const angle = index * 2.39996;
        return {
          x: (width / 2 + Math.cos(angle) * index * 3.4 + width) % width,
          y: (height / 2 + Math.sin(angle) * index * 2.2 + height) % height,
          r: 1.1 + (index % 5) * 0.32,
          hue: HUES[index % HUES.length],
          alpha: 0.16 + (index % 4) * 0.04,
          phase: index * 0.7,
        };
      });
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const dot of dots) {
        const x = (dot.x + Math.sin(time * 0.00015 + dot.phase) * 14 + canvas.width) % canvas.width;
        const y = (dot.y + Math.cos(time * 0.00012 + dot.phase) * 10 + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${dot.hue} 78% 58% / ${dot.alpha})`;
        ctx.arc(x, y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    layout();
    draw(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    if (!reduced) frame = requestAnimationFrame(loop);
    const observer = new ResizeObserver(layout);
    observer.observe(parent);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} data-hero-dots="" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
