export const fallbackColors = {
  text: "#0f172a",
  accent: "#f97316",
  accentEnd: "#eab308",
  body: "#475569",
  meta: "#64748b",
};

export function cssColor(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  const hex = raw.startsWith("#") ? raw : raw ? `#${raw}` : "";
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [r, g, b] = hex.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}
