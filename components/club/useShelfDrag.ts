"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { shelfCenters, shelfDropIndex, shelfGesture, shelfShiftX, type ShelfSlot } from "@/lib/shelfDrag";

const SLIDE = "transform 160ms cubic-bezier(0.2, 0, 0, 1)";
const EDGE_PX = 64;

export type ShelfDrag = {
  from: number;
  dx: number;
  shifts: number[];
  reduce: boolean;
};

type Session = {
  id: string;
  pointerId: number;
  index: number;
  startClientX: number;
  startClientY: number;
  clientX: number;
  grabOffset: number;
  active: boolean;
  reduce: boolean;
  target: HTMLElement;
  cleanup: () => void;
};

function measureSlots(shelf: HTMLElement): ShelfSlot[] {
  const rect = shelf.getBoundingClientRect();
  const scroll = shelf.scrollLeft;
  return [...shelf.querySelectorAll<HTMLElement>("[data-shelf-card]")].map((card) => {
    const box = card.getBoundingClientRect();
    return { left: box.left - rect.left + scroll, width: box.width };
  });
}

function contentLeft(shelf: HTMLElement, clientX: number, grabOffset: number) {
  const rect = shelf.getBoundingClientRect();
  return clientX - rect.left + shelf.scrollLeft - grabOffset;
}

function findCard(shelf: HTMLElement, target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const card = target.closest("[data-shelf-card]");
  if (!(card instanceof HTMLElement) || !shelf.contains(card)) return null;
  const index = [...shelf.querySelectorAll("[data-shelf-card]")].indexOf(card);
  if (index < 0) return null;
  return { card, index };
}

export function shelfCardStyle(drag: ShelfDrag | null, index: number): CSSProperties | undefined {
  if (!drag) return undefined;
  if (index === drag.from) {
    return {
      transform: `translate3d(${drag.dx}px, -8px, 0)`,
      zIndex: 30,
      transition: "none",
      cursor: "grabbing",
      position: "relative",
      boxShadow: "0 18px 36px rgba(15, 23, 42, 0.35)",
    };
  }
  return {
    transform: `translate3d(${drag.shifts[index] ?? 0}px, 0, 0)`,
    transition: drag.reduce ? "none" : SLIDE,
    cursor: "grabbing",
    position: "relative",
    zIndex: 1,
  };
}

export function useShelfDrag({
  shelfRef,
  enabled,
  onReorder,
}: {
  shelfRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onReorder: (id: string, to: number) => void;
}) {
  const sessionRef = useRef<Session | null>(null);
  const slotsRef = useRef<ShelfSlot[] | null>(null);
  const overRef = useRef(0);
  const onReorderRef = useRef(onReorder);
  const suppressRef = useRef(0);
  const gestureRef = useRef(0);
  const [drag, setDrag] = useState<ShelfDrag | null>(null);
  const dragRef = useRef<ShelfDrag | null>(null);
  const applyRef = useRef<(clientX: number) => void>(() => {});

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  function show(next: ShelfDrag | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function applyPointer(clientX: number) {
    const session = sessionRef.current;
    const shelf = shelfRef.current;
    const slots = slotsRef.current;
    if (!session?.active || !shelf || !slots?.length) return;
    const slot = slots[session.index];
    if (!slot) return;
    const cardLeft = contentLeft(shelf, clientX, session.grabOffset);
    const over = shelfDropIndex(shelfCenters(slots), cardLeft + slot.width / 2);
    overRef.current = over;
    const dx = cardLeft - slot.left;
    const shifts = slots.map((_, index) => shelfShiftX(slots, session.index, over, index));
    const current = dragRef.current;
    if (
      current &&
      current.from === session.index &&
      Math.abs(current.dx - dx) < 0.5 &&
      shifts.length === current.shifts.length &&
      shifts.every((shift, index) => shift === current.shifts[index])
    ) {
      return;
    }
    show({ from: session.index, dx, shifts, reduce: session.reduce });
  }

  useEffect(() => {
    applyRef.current = applyPointer;
  });

  const dragging = drag !== null;

  useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const step = () => {
      const session = sessionRef.current;
      const shelf = shelfRef.current;
      if (!session?.active || !shelf) return;
      const rect = shelf.getBoundingClientRect();
      const x = session.clientX;
      let delta = 0;
      if (x < rect.left + EDGE_PX) delta = -Math.max(6, Math.ceil(((rect.left + EDGE_PX - x) / EDGE_PX) * 18));
      else if (x > rect.right - EDGE_PX) delta = Math.max(6, Math.ceil(((x - (rect.right - EDGE_PX)) / EDGE_PX) * 18));
      if (delta) {
        const before = shelf.scrollLeft;
        shelf.scrollLeft = before + delta;
        if (shelf.scrollLeft !== before) applyRef.current(session.clientX);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [dragging, shelfRef]);

  useEffect(() => {
    if (!dragging) return;
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [dragging]);

  useEffect(() => {
    const shelf = shelfRef.current;
    if (!enabled || !shelf) return;

    const armSuppress = () => {
      const token = gestureRef.current + 1;
      gestureRef.current = token;
      suppressRef.current = token;
      window.setTimeout(() => {
        if (suppressRef.current === token) suppressRef.current = 0;
      }, 500);
    };

    const stopSession = () => {
      sessionRef.current?.cleanup();
      sessionRef.current = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || sessionRef.current || dragRef.current) return;
      const found = findCard(shelf, event.target);
      if (!found) return;
      const slots = measureSlots(shelf);
      const slot = slots[found.index];
      if (!slot) return;
      const id = found.card.dataset.gameId ?? "";
      if (!id) return;
      const rect = shelf.getBoundingClientRect();
      const origin = event.clientX - rect.left + shelf.scrollLeft;
      slotsRef.current = slots;
      overRef.current = found.index;
      const session: Session = {
        id,
        pointerId: event.pointerId,
        index: found.index,
        startClientX: event.clientX,
        startClientY: event.clientY,
        clientX: event.clientX,
        grabOffset: origin - slot.left,
        active: false,
        reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        target: found.card,
        cleanup: () => {},
      };
      const onMove = (ev: PointerEvent) => {
        const current = sessionRef.current;
        if (!current || ev.pointerId !== current.pointerId) return;
        current.clientX = ev.clientX;
        if (!current.active) {
          const gesture = shelfGesture(ev.clientX - current.startClientX, ev.clientY - current.startClientY);
          if (gesture === "scroll") {
            armSuppress();
            stopSession();
            slotsRef.current = null;
            return;
          }
          if (gesture !== "drag") return;
          current.active = true;
          armSuppress();
          try {
            current.target.setPointerCapture(current.pointerId);
          } catch {
            // The pointer can already be gone if the browser took the gesture.
          }
          if (ev.cancelable) ev.preventDefault();
          applyRef.current(ev.clientX);
          return;
        }
        if (ev.cancelable) ev.preventDefault();
        applyRef.current(ev.clientX);
      };
      const onEnd = (ev: PointerEvent, commit: boolean) => {
        const current = sessionRef.current;
        if (!current || ev.pointerId !== current.pointerId) return;
        const active = current.active;
        const dropped = overRef.current;
        const gameId = current.id;
        const from = current.index;
        stopSession();
        slotsRef.current = null;
        if (dragRef.current) show(null);
        if (commit && active && dropped !== from) onReorderRef.current(gameId, dropped);
        else if (active) suppressRef.current = 0;
      };
      const onUp = (ev: PointerEvent) => onEnd(ev, true);
      const onCancel = (ev: PointerEvent) => onEnd(ev, false);
      session.cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      sessionRef.current = session;
    };

    const onClick = (event: MouseEvent) => {
      if (!suppressRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressRef.current = 0;
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    shelf.addEventListener("pointerdown", onPointerDown);
    shelf.addEventListener("click", onClick, true);
    shelf.addEventListener("dragstart", onDragStart);
    return () => {
      shelf.removeEventListener("pointerdown", onPointerDown);
      shelf.removeEventListener("click", onClick, true);
      shelf.removeEventListener("dragstart", onDragStart);
      stopSession();
      slotsRef.current = null;
    };
  }, [enabled, shelfRef]);

  return { drag };
}
