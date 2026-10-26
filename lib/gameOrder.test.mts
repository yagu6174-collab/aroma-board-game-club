import assert from "node:assert/strict";
import { test } from "node:test";
import { moveByIndex, readStoredOrder, sortByStoredOrder, withOrder } from "./gameOrder.ts";

test("missing order keeps the stored array and stamps 0..n-1", () => {
  const games = sortByStoredOrder([{ id: "ice" }, { id: "wolf" }, { id: "guandan" }]);
  assert.deepEqual(
    games.map((game) => game.id),
    ["ice", "wolf", "guandan"],
  );
  assert.deepEqual(
    games.map((game) => game.order),
    [0, 1, 2],
  );
});

test("explicit order is the public left-to-right shelf", () => {
  const games = sortByStoredOrder([
    { id: "wolf", order: 2 },
    { id: "poker", order: 0 },
    { id: "guandan", order: 1 },
  ]);
  assert.deepEqual(
    games.map((game) => game.id),
    ["poker", "guandan", "wolf"],
  );
  assert.deepEqual(
    games.map((game) => game.order),
    [0, 1, 2],
  );
});

test("string order values are explicit positions", () => {
  const games = sortByStoredOrder([
    { id: "wolf", order: readStoredOrder("2") },
    { id: "poker", order: readStoredOrder("0") },
    { id: "ice", order: readStoredOrder("nope") },
  ]);
  assert.deepEqual(
    games.map((game) => game.id),
    ["poker", "wolf", "ice"],
  );
});

test("equal order keeps the earlier row", () => {
  const games = sortByStoredOrder([
    { id: "a", order: 1 },
    { id: "b", order: 1 },
    { id: "c", order: 0 },
  ]);
  assert.deepEqual(
    games.map((game) => game.id),
    ["c", "a", "b"],
  );
});

test("moving an item then stamping order is what admin save persists", () => {
  const start = withOrder([{ id: "ice" }, { id: "wolf" }, { id: "guandan" }, { id: "poker" }]);
  const moved = withOrder(moveByIndex(start, 3, 1));
  assert.deepEqual(
    moved.map((game) => game.id),
    ["ice", "poker", "wolf", "guandan"],
  );
  assert.deepEqual(
    moved.map((game) => game.order),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    sortByStoredOrder(moved).map((game) => game.id),
    ["ice", "poker", "wolf", "guandan"],
  );
});

test("a move outside the list leaves the shelf alone", () => {
  const start = withOrder([{ id: "ice" }, { id: "wolf" }]);
  assert.deepEqual(
    moveByIndex(start, -1, 0).map((game) => game.id),
    ["ice", "wolf"],
  );
  assert.deepEqual(
    moveByIndex(start, 0, 0).map((game) => game.id),
    ["ice", "wolf"],
  );
  assert.equal(readStoredOrder(""), undefined);
  assert.equal(readStoredOrder(1.6), 2);
});
