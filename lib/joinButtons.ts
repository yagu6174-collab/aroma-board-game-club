import { cssColor } from "./color";

export const joinSlots = ["email", "wechat", "whatsapp", "instagram", "form"] as const;
export type JoinSlot = (typeof joinSlots)[number];
export type JoinButtonStyle = "solid" | "gradient" | "glass";

export type JoinButton = {
  id: string;
  slot: JoinSlot | "";
  text: string;
  href: string;
  style: JoinButtonStyle;
  color: string;
  colorMid: string;
  colorEnd: string;
  textColor: string;
};

export type JoinLink = { text: string; href: string };
export type JoinLinkMap = Record<JoinSlot, JoinLink>;

export type JoinButtonPaint = {
  backgroundColor?: string;
  backgroundImage?: string;
  border?: string;
  color: string;
};

const presets: Record<JoinSlot, Pick<JoinButton, "style" | "color" | "colorMid" | "colorEnd" | "textColor">> = {
  email: { style: "glass", color: "#ffffff", colorMid: "", colorEnd: "", textColor: "#ffffff" },
  wechat: { style: "solid", color: "#059669", colorMid: "", colorEnd: "", textColor: "#ffffff" },
  whatsapp: { style: "solid", color: "#22c55e", colorMid: "", colorEnd: "", textColor: "#ffffff" },
  instagram: { style: "gradient", color: "#a855f7", colorMid: "#ec4899", colorEnd: "#fb923c", textColor: "#ffffff" },
  form: { style: "solid", color: "#4f46e5", colorMid: "", colorEnd: "", textColor: "#ffffff" },
};

function plain(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function slotOf(value: unknown): JoinSlot | "" {
  return joinSlots.includes(value as JoinSlot) ? (value as JoinSlot) : "";
}

function styleOf(value: unknown, fallback: JoinButtonStyle): JoinButtonStyle {
  return value === "solid" || value === "gradient" || value === "glass" ? value : fallback;
}

function optionalColor(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return cssColor(value, fallback);
}

function safeId(value: unknown) {
  return plain(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

function uniqueId(preferred: string, used: Set<string>, index: number) {
  let id = preferred || `btn-${index + 1}`;
  let n = 2;
  while (used.has(id)) {
    id = `${(preferred || "btn").slice(0, 32)}-${n}`.slice(0, 40);
    n += 1;
  }
  used.add(id);
  return id;
}

export function joinButtonsFromLinks(links: JoinLinkMap): JoinButton[] {
  return joinSlots.map((slot) => ({
    id: slot,
    slot,
    text: links[slot].text,
    href: links[slot].href,
    ...presets[slot],
  }));
}

export function linksFromJoinButtons(buttons: JoinButton[]): JoinLinkMap {
  const links = {} as JoinLinkMap;
  for (const slot of joinSlots) {
    const found = buttons.find((button) => button.slot === slot);
    links[slot] = found ? { text: found.text, href: found.href } : { text: "", href: "" };
  }
  return links;
}

export function resolveJoinButtons(rawButtons: unknown, links: JoinLinkMap): JoinButton[] {
  if (!Array.isArray(rawButtons)) return joinButtonsFromLinks(links);
  return normalizeJoinButtons(rawButtons);
}

export function normalizeJoinButtons(rows: unknown[]): JoinButton[] {
  const used = new Set<string>();
  const taken = new Set<JoinSlot>();
  const buttons: JoinButton[] = [];
  rows.forEach((item, index) => {
    const raw = asRecord(item);
    if (!raw) return;
    const requested = slotOf(raw.slot);
    const slot = requested && !taken.has(requested) ? requested : "";
    if (slot) taken.add(slot);
    const preset = slot ? presets[slot] : undefined;
    const style = styleOf(raw.style, preset?.style ?? "solid");
    buttons.push({
      id: uniqueId(safeId(raw.id), used, index),
      slot,
      text: plain(raw.text),
      href: plain(raw.href),
      style,
      color: cssColor(raw.color, preset?.color ?? (style === "glass" ? "#ffffff" : "#4f46e5")),
      colorMid: optionalColor(raw.colorMid, raw.colorMid == null ? (preset?.colorMid ?? "") : ""),
      colorEnd: optionalColor(raw.colorEnd, raw.colorEnd == null ? (preset?.colorEnd ?? "") : ""),
      textColor: cssColor(raw.textColor, preset?.textColor ?? "#ffffff"),
    });
  });
  return buttons;
}

function hexAlpha(hex: string, alpha: number) {
  const raw = cssColor(hex, "#ffffff").slice(1);
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function joinButtonPaint(button: Pick<JoinButton, "style" | "color" | "colorMid" | "colorEnd" | "textColor">): JoinButtonPaint {
  const color = cssColor(button.textColor, "#ffffff");
  if (button.style === "gradient") {
    const stops = [button.color, button.colorMid, button.colorEnd].map((stop) => stop.trim()).filter(Boolean);
    if (stops.length >= 2) return { backgroundImage: `linear-gradient(to right, ${stops.join(", ")})`, color };
  }
  if (button.style === "glass") {
    return {
      backgroundColor: hexAlpha(button.color || "#ffffff", 0.1),
      border: "1px solid rgba(255,255,255,0.3)",
      color,
    };
  }
  return { backgroundColor: cssColor(button.color, "#4f46e5"), color };
}
