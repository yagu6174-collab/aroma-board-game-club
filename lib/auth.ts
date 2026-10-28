import "server-only";
import { createHmac, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const WEEK = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET?.trim() ?? "";
}

function password() {
  return process.env.EDITOR_PASSWORD?.trim() ?? "";
}

function sign(exp: number) {
  const mac = createHmac("sha256", secret()).update(String(exp)).digest("base64url");
  return `${exp}.${mac}`;
}

export function verifyToken(token: string | undefined) {
  if (!token || !secret()) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(exp).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function passwordsMatch(input: string) {
  const expected = password();
  if (!expected || !secret()) return false;
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function sessionCookieValue() {
  return sign(Date.now() + WEEK * 1000);
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: WEEK,
};

export async function currentSessionToken() {
  const jar = await cookies();
  const token = jar.get("session")?.value ?? "";
  return verifyToken(token) ? token : "";
}

export async function isAuthed() {
  return Boolean(await currentSessionToken());
}
