import assert from "node:assert/strict";
import { test } from "node:test";
import { footerContactsFrom, safeMapUrl, type FooterContacts } from "./footerLinks.ts";

const seed: FooterContacts = {
  address: "九龙观塘鸿图道 22 号俊汇中心",
  mapLabel: "查看地图",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Elite+Centre",
};

test("missing footer fields fall back to the saved venue and map", () => {
  assert.deepEqual(footerContactsFrom(undefined, seed), seed);
  assert.deepEqual(footerContactsFrom({ address: "新地址" }, seed).address, "新地址");
  assert.equal(footerContactsFrom({ address: "新地址" }, seed).mapLabel, seed.mapLabel);
});

test("an emptied map label stays empty instead of snapping back", () => {
  assert.equal(footerContactsFrom({ mapLabel: "  " }, seed).mapLabel, "");
  assert.equal(footerContactsFrom({ address: "" }, seed).address, "");
});

test("map links allow http(s) and geo, and drop scripts", () => {
  assert.equal(safeMapUrl(" https://maps.apple.com/?q=Elite%20Centre "), "https://maps.apple.com/?q=Elite%20Centre");
  assert.equal(safeMapUrl("geo:22.312,114.225?q=Elite%20Centre"), "geo:22.312,114.225?q=Elite%20Centre");
  assert.equal(safeMapUrl("javascript:alert(1)"), "");
  assert.equal(safeMapUrl("data:text/html,hi"), "");
  assert.equal(safeMapUrl("https://user:pass@maps.google.com"), "");
});
