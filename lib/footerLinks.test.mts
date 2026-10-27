import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emailHref,
  footerContactsFrom,
  phoneHref,
  safeMapUrl,
  whatsappHref,
  type FooterContacts,
} from "./footerLinks.ts";

const seed: FooterContacts = {
  address: "九龙观塘鸿图道 22 号俊汇中心",
  phone: "+852 6462 3779",
  whatsapp: "+852 6462 3779",
  email: "contact@aromahk.org",
  mapLabel: "查看地图",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Elite+Centre",
};

test("missing footer fields fall back to the saved club contacts", () => {
  assert.deepEqual(footerContactsFrom(undefined, seed), seed);
  assert.deepEqual(footerContactsFrom({ address: "新地址" }, seed).address, "新地址");
  assert.equal(footerContactsFrom({ address: "新地址" }, seed).phone, seed.phone);
});

test("an emptied contact stays empty instead of snapping back", () => {
  assert.equal(footerContactsFrom({ phone: "  " }, seed).phone, "");
  assert.equal(footerContactsFrom({ mapLabel: "" }, seed).mapLabel, "");
});

test("map links allow http(s) and geo, and drop scripts", () => {
  assert.equal(safeMapUrl(" https://maps.apple.com/?q=Elite%20Centre "), "https://maps.apple.com/?q=Elite%20Centre");
  assert.equal(safeMapUrl("geo:22.312,114.225?q=Elite%20Centre"), "geo:22.312,114.225?q=Elite%20Centre");
  assert.equal(safeMapUrl("javascript:alert(1)"), "");
  assert.equal(safeMapUrl("data:text/html,hi"), "");
  assert.equal(safeMapUrl("https://user:pass@maps.google.com"), "");
});

test("phone, WhatsApp and email become real links from the stored text", () => {
  assert.equal(phoneHref("+852 6462 3779"), "tel:+85264623779");
  assert.equal(whatsappHref("+852 6462 3779"), "https://wa.me/85264623779");
  assert.equal(whatsappHref("https://wa.me/85264623779"), "https://wa.me/85264623779");
  assert.equal(emailHref("contact@aromahk.org"), "mailto:contact@aromahk.org");
  assert.equal(phoneHref("电话待定"), "");
  assert.equal(whatsappHref("javascript:alert(1)"), "");
  assert.equal(emailHref("不是邮箱"), "");
});
