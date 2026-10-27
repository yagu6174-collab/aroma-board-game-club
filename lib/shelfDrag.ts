/** Geometry for dragging shelf cards. Order is still applied with moveByIndex + withOrder. */

export type ShelfSlot = {
  left: number;
  width: number;
};

export const SHELF_GRAB_PX = 8;

export type ShelfGesture = "pending" | "drag" | "scroll";

/** Horizontal movement past the threshold starts a reorder. A taller move is a scroll, not a drag. */
export function shelfGesture(dx: number, dy: number, threshold = SHELF_GRAB_PX): ShelfGesture {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (vertical >= threshold && vertical > horizontal) return "scroll";
  if (horizontal >= threshold && horizontal > vertical) return "drag";
  return "pending";
}

export function shelfCenters(slots: readonly ShelfSlot[]): number[] {
  return slots.map((slot) => slot.left + slot.width / 2);
}

/** Index of the slot whose center is closest to the dragged card's center. */
export function shelfDropIndex(centers: readonly number[], centerX: number): number {
  if (!centers.length || !Number.isFinite(centerX)) return 0;
  let best = 0;
  let bestDist = Math.abs(centers[0] - centerX);
  for (let index = 1; index < centers.length; index += 1) {
    const dist = Math.abs(centers[index] - centerX);
    if (dist < bestDist) {
      best = index;
      bestDist = dist;
    }
  }
  return best;
}

/** How far a resting card slides while another card is held over `over`. The held card itself stays put. */
export function shelfShiftX(slots: readonly Pick<ShelfSlot, "left">[], from: number, over: number, index: number): number {
  if (!Number.isInteger(from) || !Number.isInteger(over) || !Number.isInteger(index)) return 0;
  if (from < 0 || over < 0 || index < 0 || from >= slots.length || over >= slots.length || index >= slots.length) return 0;
  if (from === over || index === from) return 0;
  if (from < over && index > from && index <= over) {
    return slots[index - 1].left - slots[index].left;
  }
  if (over < from && index >= over && index < from) {
    return slots[index + 1].left - slots[index].left;
  }
  return 0;
}
