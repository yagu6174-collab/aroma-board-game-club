"use client";

import { useEffect, useRef, useState } from "react";

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export default function DiceCursor() {
  const node = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [face, setFace] = useState(5);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine && !reduced) setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("dice-on");
    const faceNow = { current: 5 };
    let rollingNow = false;
    let rollTimer = 0;
    let stopTimer = 0;

    const move = (event: PointerEvent) => {
      const el = node.current;
      if (!el) return;
      el.style.left = `${event.clientX}px`;
      el.style.top = `${event.clientY}px`;
      if (!rollingNow) {
        rollingNow = true;
        setRolling(true);
        rollTimer = window.setInterval(() => {
          faceNow.current = (faceNow.current % 6) + 1;
          setFace(faceNow.current);
        }, 120);
      }
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        window.clearInterval(rollTimer);
        rollingNow = false;
        faceNow.current = 1 + Math.floor(Math.random() * 6);
        setFace(faceNow.current);
        setRolling(false);
      }, 150);
    };

    window.addEventListener("pointermove", move);
    return () => {
      document.documentElement.classList.remove("dice-on");
      window.removeEventListener("pointermove", move);
      window.clearInterval(rollTimer);
      window.clearTimeout(stopTimer);
    };
  }, [on]);

  if (!on) return null;

  const pips = PIPS[face] ?? PIPS[1];
  return (
    <div
      ref={node}
      data-dice=""
      data-face={face}
      data-rolling={rolling ? "1" : "0"}
      aria-hidden
      className="dice-cursor pointer-events-none fixed top-0 left-0 z-[90]"
    >
      <span className="grid h-7 w-7 grid-cols-3 grid-rows-3 rounded-[0.45rem] bg-[#f7f3ea] p-0.5 shadow-md ring-1 ring-stone-300">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className={pips.includes(index) ? "m-auto h-1.5 w-1.5 rounded-full bg-slate-900" : "m-auto h-1.5 w-1.5"} />
        ))}
      </span>
    </div>
  );
}
