import assert from "node:assert/strict";
import { test } from "node:test";
import {
  joinButtonPaint,
  joinButtonsFromLinks,
  linksFromJoinButtons,
  resolveJoinButtons,
  type JoinLinkMap,
} from "./joinButtons.ts";

const links: JoinLinkMap = {
  email: { text: "", href: "mailto:contact@aromahk.org" },
  wechat: { text: "微信账号", href: "" },
  whatsapp: { text: "WhatsApp", href: "https://wa.me/85264623779" },
  instagram: { text: "Instagram", href: "https://www.instagram.com/aromahk111/" },
  form: { text: "馨香基金会官网", href: "https://example.org" },
};

test("stored link rows become the current colored buttons", () => {
  const buttons = resolveJoinButtons(undefined, links);
  assert.deepEqual(
    buttons.map((button) => [button.slot, button.text, button.style, button.color]),
    [
      ["email", "", "glass", "#ffffff"],
      ["wechat", "微信账号", "solid", "#059669"],
      ["whatsapp", "WhatsApp", "solid", "#22c55e"],
      ["instagram", "Instagram", "gradient", "#a855f7"],
      ["form", "馨香基金会官网", "solid", "#4f46e5"],
    ],
  );
  const instagram = buttons.find((button) => button.slot === "instagram");
  assert.equal(instagram?.colorMid, "#ec4899");
  assert.equal(instagram?.colorEnd, "#fb923c");
  assert.equal(instagram?.href, links.instagram.href);
  assert.deepEqual(linksFromJoinButtons(buttons), links);
});

test("an explicit button list replaces the fixed five and keeps order", () => {
  const buttons = resolveJoinButtons(
    [
      { id: "form", slot: "form", text: "官网", href: "https://example.org", style: "solid", color: "#112233", textColor: "#ffffff" },
      { id: "extra", text: "新按钮", href: "https://example.com/new", style: "gradient", color: "#111111", colorEnd: "#222222", textColor: "#f8fafc" },
      null,
      { id: "form", slot: "form", text: "重复", href: "https://ignored.example", style: "solid", color: "#000000" },
    ],
    links,
  );
  assert.deepEqual(buttons.map((button) => button.id), ["form", "extra", "form-2"]);
  assert.equal(buttons[1]?.slot, "");
  assert.equal(buttons[1]?.colorMid, "");
  assert.equal(buttons[2]?.slot, "");
  const derived = linksFromJoinButtons(buttons);
  assert.equal(derived.form.text, "官网");
  assert.equal(derived.form.href, "https://example.org");
  assert.equal(derived.whatsapp.href, "");
  assert.equal(derived.email.text, "");
});

test("an empty list stays empty instead of restoring the defaults", () => {
  const buttons = resolveJoinButtons([], links);
  assert.deepEqual(buttons, []);
  assert.deepEqual(linksFromJoinButtons(buttons).instagram, { text: "", href: "" });
});

test("invalid colors fall back and cleared gradient stops stay empty", () => {
  const [button] = resolveJoinButtons(
    [{ id: "custom", text: "A", href: "", style: "nope", color: "red", colorMid: "", colorEnd: "blue", textColor: "white" }],
    links,
  );
  assert.equal(button?.style, "solid");
  assert.equal(button?.color, "#4f46e5");
  assert.equal(button?.colorMid, "");
  assert.equal(button?.colorEnd, "");
  assert.equal(button?.textColor, "#ffffff");
});

test("paint matches the solid, glass, and instagram gradient buttons", () => {
  const buttons = joinButtonsFromLinks(links);
  const email = buttons.find((button) => button.slot === "email");
  const whatsapp = buttons.find((button) => button.slot === "whatsapp");
  const instagram = buttons.find((button) => button.slot === "instagram");
  assert.ok(email && whatsapp && instagram);
  assert.deepEqual(joinButtonPaint(email), {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#ffffff",
  });
  assert.deepEqual(joinButtonPaint(whatsapp), { backgroundColor: "#22c55e", color: "#ffffff" });
  assert.deepEqual(joinButtonPaint(instagram), {
    backgroundImage: "linear-gradient(to right, #a855f7, #ec4899, #fb923c)",
    color: "#ffffff",
  });
  assert.deepEqual(joinButtonPaint({ ...instagram, colorMid: "", colorEnd: "" }), {
    backgroundColor: "#a855f7",
    color: "#ffffff",
  });
});
