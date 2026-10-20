import assert from "node:assert/strict";
import { test } from "node:test";
import { hkDateKey, normalizeVisits, recentDayKeys, recordVisitOn, summarizeVisits } from "./visitMath.ts";

test("Hong Kong calendar day flips at Hong Kong midnight", () => {
  assert.equal(hkDateKey(new Date("2026-10-20T15:59:00.000Z")), "2026-10-20");
  assert.equal(hkDateKey(new Date("2026-10-20T16:00:00.000Z")), "2026-10-21");
});

test("day windows cross month and year boundaries", () => {
  const march = new Date("2026-02-28T16:30:00.000Z");
  assert.deepEqual(recentDayKeys(march, 7), [
    "2026-02-23",
    "2026-02-24",
    "2026-02-25",
    "2026-02-26",
    "2026-02-27",
    "2026-02-28",
    "2026-03-01",
  ]);
  const january = new Date("2026-01-01T16:30:00.000Z");
  assert.deepEqual(recentDayKeys(january, 3), ["2025-12-31", "2026-01-01", "2026-01-02"]);
});

test("a recorded view increments today and the cumulative total", () => {
  const now = new Date("2026-10-20T04:00:00.000Z");
  const stored = {
    total: 10,
    days: {
      "2026-10-06": 5,
      "2026-10-07": 4,
    },
  };
  const next = recordVisitOn(stored, now);
  assert.equal(next.total, 11);
  assert.equal(next.days["2026-10-20"], 1);
  assert.equal(next.days["2026-10-07"], 4);
  assert.equal(next.days["2026-10-06"], undefined);
  assert.equal(stored.total, 10);
  assert.deepEqual(stored.days, { "2026-10-06": 5, "2026-10-07": 4 });
});

test("summary reports today, the last seven days, and the cumulative total", () => {
  const now = new Date("2026-10-20T04:00:00.000Z");
  const summary = summarizeVisits(
    {
      total: 40,
      days: {
        "2026-10-13": 100,
        "2026-10-14": 1,
        "2026-10-20": 3,
      },
    },
    now,
  );
  assert.equal(summary.today, 3);
  assert.equal(summary.last7, 4);
  assert.equal(summary.total, 40);
  assert.equal(summary.days.length, 7);
  assert.equal(summary.days[0]?.date, "2026-10-14");
  assert.equal(summary.days[0]?.count, 1);
  assert.equal(summary.days[6]?.today, true);
  assert.equal(summary.days[6]?.label, "10/20");
  assert.equal(
    summary.last7,
    summary.days.reduce((sum, day) => sum + day.count, 0),
  );
});

test("unreadable counter documents become an empty counter", () => {
  assert.deepEqual(normalizeVisits(null), { total: 0, days: {} });
  assert.deepEqual(normalizeVisits({ total: -3, days: { nope: 4, "2026-10-20": 2.8, "2026-10-21": -1 } }), {
    total: 0,
    days: { "2026-10-20": 2 },
  });
});
