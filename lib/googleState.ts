import { createHmac, timingSafeEqual } from "crypto";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function macFor(sessionToken: string, secret: string, nonce: string) {
  return createHmac("sha256", secret).update(`${nonce}.${sessionToken}`).digest("base64url");
}

// The state is HMAC(session cookie). The callback can check it from the admin
// session alone, so a second cookie set on the redirect to Google is not required.
export function createOAuthState(sessionToken: string, secret: string, nonce: string) {
  const trimmed = secret.trim();
  if (!trimmed || !sessionToken || !nonce) throw new Error("state");
  return `${nonce}.${macFor(sessionToken, trimmed, nonce)}`;
}

export function oauthStateMatchesSession(state: string, sessionToken: string, secret: string) {
  const trimmed = secret.trim();
  if (!trimmed || !sessionToken || !state) return false;
  const split = state.lastIndexOf(".");
  if (split <= 0) return false;
  const nonce = state.slice(0, split);
  const mac = state.slice(split + 1);
  if (!nonce || !mac) return false;
  return safeEqual(mac, macFor(sessionToken, trimmed, nonce));
}
