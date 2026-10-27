/** Shelf position stored on each game. Lower numbers sit further left. */

export function readStoredOrder(value: unknown): number | undefined {
  const next = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(next)) return undefined;
  return Math.round(next);
}

/** Keep array order when `order` is missing, otherwise sort by the saved number, then stamp 0..n-1. */
export function sortByStoredOrder<T extends { order?: number }>(items: readonly T[]): Array<T & { order: number }> {
  return items
    .map((item, index) => ({
      item,
      index,
      rank: typeof item.order === "number" && Number.isFinite(item.order) ? Math.round(item.order) : index,
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ item }, order) => ({ ...item, order }));
}

export function withOrder<T extends object>(items: readonly T[]): Array<T & { order: number }> {
  return items.map((item, order) => ({ ...item, order }));
}

export function moveByIndex<T>(items: readonly T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return items.slice();
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items.slice();
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items.slice();
  next.splice(to, 0, moved);
  return next;
}
