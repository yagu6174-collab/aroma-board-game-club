import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

export type RefreshSeal = {
  v: 1;
  purpose: "google-forms";
  iv: string;
  tag: string;
  ciphertext: string;
};

function keyFor(secret: string) {
  return Buffer.from(hkdfSync("sha256", secret, "aroma-google-forms", "refresh-token", 32));
}

export function isRefreshSeal(value: unknown): value is RefreshSeal {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return (
    raw.v === 1 &&
    raw.purpose === "google-forms" &&
    typeof raw.iv === "string" &&
    raw.iv.length > 0 &&
    typeof raw.tag === "string" &&
    raw.tag.length > 0 &&
    typeof raw.ciphertext === "string" &&
    raw.ciphertext.length > 0
  );
}

export function sealRefreshToken(token: string, secret: string): RefreshSeal {
  const trimmed = secret.trim();
  if (!trimmed || !token) throw new Error("seal");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFor(trimmed), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    v: 1,
    purpose: "google-forms",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

export function openRefreshToken(doc: unknown, secret: string) {
  const trimmed = secret.trim();
  if (!trimmed || !isRefreshSeal(doc)) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFor(trimmed), Buffer.from(doc.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(doc.tag, "base64url"));
    const plain = Buffer.concat([decipher.update(Buffer.from(doc.ciphertext, "base64url")), decipher.final()]);
    const token = plain.toString("utf8");
    return token || null;
  } catch {
    return null;
  }
}
