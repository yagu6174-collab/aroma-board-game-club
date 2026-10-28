export type FooterContacts = {
  address: string;
  mapLabel: string;
  mapUrl: string;
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function footerContactsFrom(value: unknown, seed: FooterContacts): FooterContacts {
  const raw = asRecord(value);
  return {
    address: text(raw.address, seed.address),
    mapLabel: text(raw.mapLabel, seed.mapLabel),
    mapUrl: text(raw.mapUrl, seed.mapUrl),
  };
}

/** http(s) only. Rejects javascript:, data:, and credentialed URLs. */
export function safeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    return trimmed;
  } catch {
    return "";
  }
}

/** Map buttons accept a normal web map link or a geo: URI. */
export function safeMapUrl(value: string) {
  const external = safeExternalUrl(value);
  if (external) return external;
  const trimmed = value.trim();
  if (/^geo:-?\d+(\.\d+)?,-?\d+(\.\d+)?(\?[^#]*)?$/i.test(trimmed)) return trimmed;
  return "";
}
