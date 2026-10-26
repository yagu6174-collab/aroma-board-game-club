import assert from "node:assert/strict";
import { test } from "node:test";
import { finishedEventSummary } from "./eventStatus.ts";

const oct24 = "2026-10-24T16:00:00+08:00";
const after = Date.parse("2026-10-26T09:00:00+08:00");
const detail = "尚未举行。鸿图道 22 号俊汇中心 701 室，借用香港圣经教会观塘堂场地。";

test("a past event that still says 尚未举行 is marked 已结束", () => {
  assert.equal(
    finishedEventSummary(detail, oct24, after),
    "已结束。鸿图道 22 号俊汇中心 701 室，借用香港圣经教会观塘堂场地。",
  );
});

test("a future event keeps 尚未举行", () => {
  assert.equal(finishedEventSummary(detail, "2026-11-28T18:23:00+08:00", after), detail);
});

test("an event already marked 已结束 stays as written", () => {
  const summary = "已结束。鸿图道 22 号俊汇中心 7 楼。";
  assert.equal(finishedEventSummary(summary, "2026-08-29T16:00:00+08:00", after), summary);
});

test("a past event with no start time is left unchanged", () => {
  assert.equal(finishedEventSummary(detail, "", after), detail);
  assert.equal(finishedEventSummary(detail, undefined, after), detail);
});
