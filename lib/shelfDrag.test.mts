import assert from "node:assert/strict";
import { test } from "node:test";
import { moveByIndex, sortByStoredOrder, withOrder } from "./gameOrder.ts";
import { shelfCenters, shelfDropIndex, shelfGesture, shelfShiftX, type ShelfSlot } from "./shelfDrag.ts";

const slots: ShelfSlot[] = [
  { left: 0, width: 260 },
  { left: 276, width: 260 },
  { left: 552, width: 260 },
  { left: 828, width: 260 },
];

test("a small move stays a click and a vertical move scrolls", () => {
  assert.equal(shelfGesture(0, 0), "pending");
  assert.equal(shelfGesture(7, 2), "pending");
  assert.equal(shelfGesture(8, 8), "pending");
  assert.equal(shelfGesture(1, 12), "scroll");
  assert.equal(shelfGesture(-14, 4), "drag");
});

test("the drop index is the nearest card center", () => {
  const centers = shelfCenters(slots);
  assert.equal(shelfDropIndex(centers, centers[0]), 0);
  assert.equal(shelfDropIndex(centers, (centers[0] + centers[1]) / 2), 0);
  assert.equal(shelfDropIndex(centers, (centers[0] + centers[1]) / 2 + 1), 1);
  assert.equal(shelfDropIndex(centers, centers[3]), 3);
  assert.equal(shelfDropIndex([], Number.NaN), 0);
});

test("neighbors slide into the gap and the held card does not", () => {
  assert.equal(shelfShiftX(slots, 0, 2, 0), 0);
  assert.equal(shelfShiftX(slots, 0, 2, 1), -276);
  assert.equal(shelfShiftX(slots, 0, 2, 2), -276);
  assert.equal(shelfShiftX(slots, 0, 2, 3), 0);
  assert.equal(shelfShiftX(slots, 3, 1, 1), 276);
  assert.equal(shelfShiftX(slots, 3, 1, 2), 276);
  assert.equal(shelfShiftX(slots, 3, 1, 3), 0);
  assert.equal(shelfShiftX(slots, 1, 1, 0), 0);
  assert.equal(shelfShiftX(slots, -1, 0, 0), 0);
});

test("dropping a preview card writes the same order the public shelf sorts", () => {
  const centers = shelfCenters(slots);
  const over = shelfDropIndex(centers, centers[0]);
  const moved = withOrder(moveByIndex([{ id: "ice" }, { id: "wolf" }, { id: "guandan" }, { id: "poker" }], 3, over));
  assert.deepEqual(
    moved.map((game) => game.id),
    ["poker", "ice", "wolf", "guandan"],
  );
  assert.deepEqual(
    moved.map((game) => game.order),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    sortByStoredOrder(moved).map((game) => game.id),
    ["poker", "ice", "wolf", "guandan"],
  );
});
