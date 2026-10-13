"use client";

import { useEffect, useRef, useState } from "react";
import { MERGED_STICKERS } from "@/data/stickerPacks";

const STICKERS = [...MERGED_STICKERS];

export default function DiceCursor() {
  const node = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [sticker, setSticker] = useState(0);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine && !reduced) setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("dice-on");
    let index = 0;
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
          index = (index + 1) % STICKERS.length;
          setSticker(index);
        }, 140);
      }
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        window.clearInterval(rollTimer);
        rollingNow = false;
        setRolling(false);
      }, 160);
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

  return (
    <div
      ref={node}
      data-dice=""
      data-pack="merged"
      data-rolling={rolling ? "1" : "0"}
      aria-hidden
      className="dice-cursor pointer-events-none fixed top-0 left-0 z-[90]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#fff7ed] text-lg shadow-md ring-2 ring-orange-200">
        {STICKERS[sticker]}
      </span>
    </div>
  );
}
