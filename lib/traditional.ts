import "server-only";
import { Converter } from "opencc-js";

const convert = Converter({ from: "cn", to: "tw" });

export function toTraditional(text: string) {
  return convert(text);
}

export function toTraditionalValue<T>(value: T): T {
  if (typeof value === "string") return convert(value) as T;
  if (Array.isArray(value)) return value.map((item) => toTraditionalValue(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = toTraditionalValue(item);
    }
    return out as T;
  }
  return value;
}
