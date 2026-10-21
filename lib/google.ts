import "server-only";

// Refresh tokens are sealed with SESSION_SECRET and written through the same
// store as the site draft (Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
// otherwise .data/). The blob store is public, so the file holds ciphertext only.
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  applyResponseCount,
  googleConsentUrl,
  googleRedirectUri,
  grantedScopesAcceptable,
  mergeFirstSessionSigned,
  parseGoogleFormId,
  readResponsePage,
  selectEventsForFormSync,
} from "@/lib/formSync";
import { isRefreshSeal, openRefreshToken, sealRefreshToken } from "@/lib/googleSeal";
import { readSiteDraft, saveSiteDraft } from "@/lib/site";
import { readStored, writeStored } from "@/lib/store";
import type { SiteEventDraft } from "@/data/siteDraft";

const KEY = "google-forms";
const STATE_COOKIE = "google_oauth_state";

export type GoogleNotice = { text: string; warn: boolean };
export type GoogleSyncResult = {
  connected: boolean;
  updates: { id: string; signed: number }[];
  messages: GoogleNotice[];
};

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  scope?: unknown;
  error?: unknown;
};

class FormCountError extends Error {
  constructor(readonly status: number) {
    super("form-count");
    this.name = "FormCountError";
  }
}

let chain: Promise<unknown> = Promise.resolve();

function exclusive<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sessionSecret() {
  return process.env.SESSION_SECRET?.trim() ?? "";
}

function clientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

export function googleConfigured() {
  return Boolean(clientId() && clientSecret() && sessionSecret());
}

function stateCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

function signNonce(nonce: string) {
  return createHmac("sha256", sessionSecret()).update(nonce).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueOAuthState() {
  const nonce = randomBytes(16).toString("base64url");
  return `${nonce}.${signNonce(nonce)}`;
}

export function oauthStateValid(state: string) {
  if (!sessionSecret()) return false;
  const split = state.lastIndexOf(".");
  if (split <= 0) return false;
  const nonce = state.slice(0, split);
  const mac = state.slice(split + 1);
  return safeEqual(mac, signNonce(nonce));
}

export function consentUrlFor(state: string) {
  return googleConsentUrl({ clientId: clientId(), redirectUri: googleRedirectUri(), state });
}

export function rememberOAuthState(response: NextResponse, state: string) {
  response.cookies.set(STATE_COOKIE, state, stateCookie());
  return response;
}

export function forgetOAuthState(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", { ...stateCookie(), maxAge: 0 });
  return response;
}

export async function oauthStateMatches(state: string) {
  const jar = await cookies();
  const saved = jar.get(STATE_COOKIE)?.value ?? "";
  return Boolean(saved && state) && safeEqual(saved, state) && oauthStateValid(state);
}

async function writeSeal(token: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("seal");
  await writeStored(KEY, sealRefreshToken(token, secret));
}

async function clearSeal() {
  await writeStored(KEY, { v: 0, purpose: "google-forms" });
}

async function loadRefreshToken() {
  const stored = await readStored(KEY);
  if (!isRefreshSeal(stored)) return { refreshToken: null as string | null, unreadable: false };
  const secret = sessionSecret();
  if (!secret) return { refreshToken: null, unreadable: true };
  const refreshToken = openRefreshToken(stored, secret);
  if (!refreshToken) return { refreshToken: null, unreadable: true };
  return { refreshToken, unreadable: false };
}

export function saveGoogleRefreshToken(token: string) {
  return exclusive(() => writeSeal(token));
}

export function clearGoogleConnection() {
  return exclusive(() => clearSeal());
}

function asToken(body: unknown): TokenResponse | null {
  return body && typeof body === "object" ? (body as TokenResponse) : null;
}

async function postToken(body: URLSearchParams, signal: AbortSignal) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal,
  });
  const json = asToken(await res.json().catch(() => null));
  return { ok: res.ok, json };
}

export async function exchangeGoogleCode(code: string) {
  const signal = AbortSignal.timeout(8000);
  const { ok, json } = await postToken(
    new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    signal,
  );
  const refreshToken = typeof json?.refresh_token === "string" ? json.refresh_token : "";
  const scope = typeof json?.scope === "string" ? json.scope : "";
  if (!ok || !refreshToken) return false;
  if (scope && !grantedScopesAcceptable(scope)) {
    console.error("google oauth scopes rejected");
    return false;
  }
  await saveGoogleRefreshToken(refreshToken);
  return true;
}

async function refreshAccessToken(refreshToken: string, signal: AbortSignal) {
  const { ok, json } = await postToken(
    new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal,
  );
  const accessToken = typeof json?.access_token === "string" ? json.access_token : "";
  if (ok && accessToken) return { ok: true as const, accessToken };
  return { ok: false as const, revoked: json?.error === "invalid_grant" };
}

async function countFormResponses(accessToken: string, formId: string, signal: AbortSignal) {
  let total = 0;
  let pageToken = "";
  const seen = new Set<string>();
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(`https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}/responses`);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new FormCountError(res.status);
    const next = readResponsePage(await res.json().catch(() => null));
    total += next.count;
    if (!next.nextPageToken || seen.has(next.nextPageToken)) return total;
    seen.add(next.nextPageToken);
    pageToken = next.nextPageToken;
  }
  throw new FormCountError(0);
}

function eventTitle(event: SiteEventDraft) {
  const title = event.title.trim() || "未命名活动";
  return title.length > 40 ? `${title.slice(0, 40)}…` : title;
}

function warn(text: string): GoogleNotice {
  return { text, warn: true };
}

function note(text: string): GoogleNotice {
  return { text, warn: false };
}

function countFailure(event: SiteEventDraft, error: unknown) {
  const title = eventTitle(event);
  if (error instanceof FormCountError && error.status === 404) return warn(`「${title}」找不到这张表单，人数保持原数字。`);
  if (error instanceof FormCountError && (error.status === 401 || error.status === 403)) {
    return warn(`「${title}」这个账号读不到回复，人数保持原数字。`);
  }
  if (error instanceof Error && error.name === "AbortError") return warn("同步超时，报名人数保持原数字。");
  return warn(`「${title}」暂时读不到回复，人数保持原数字。`);
}

type SyncOptions = { reportEmpty: boolean; formId?: string };

async function syncBody(options: SyncOptions): Promise<GoogleSyncResult> {
  const draft = await readSiteDraft();
  const requestedFormId = options.formId?.trim() ?? "";
  const pending = selectEventsForFormSync(draft.events, requestedFormId);
  const loaded = await loadRefreshToken();
  if (requestedFormId && !pending.length) {
    return {
      connected: !loaded.unreadable && Boolean(loaded.refreshToken),
      updates: [],
      messages: [warn("没有活动使用这张表单，人数保持原数字。")],
    };
  }
  if (loaded.unreadable) {
    return { connected: false, updates: [], messages: [warn("已保存的 Google 连接读不出来，请重新连接。人数保持原数字。")] };
  }
  if (!loaded.refreshToken) {
    if (!pending.length && !options.reportEmpty) return { connected: false, updates: [], messages: [] };
    const text = googleConfigured() ? "Google 未连接，报名人数保持原数字。" : "Google 客户端还没配置，人数保持原数字。";
    if (!pending.length) return { connected: false, updates: [], messages: [warn("还没有填写同步用的表单编号，人数保持原数字。")] };
    return { connected: false, updates: [], messages: [warn(text)] };
  }
  if (!googleConfigured()) {
    return { connected: true, updates: [], messages: [warn("Google 客户端还没配置，人数保持原数字。")] };
  }
  if (!pending.length) {
    return {
      connected: true,
      updates: [],
      messages: options.reportEmpty ? [warn("还没有填写同步用的表单编号，人数保持原数字。")] : [],
    };
  }

  const signal = AbortSignal.timeout(12000);
  let accessToken = "";
  try {
    const refreshed = await refreshAccessToken(loaded.refreshToken, signal);
    if (!refreshed.ok) {
      if (refreshed.revoked) {
        await clearSeal();
        return { connected: false, updates: [], messages: [warn("Google 连接已失效，请重新连接。人数保持原数字。")] };
      }
      return { connected: true, updates: [], messages: [warn("暂时连不上 Google，报名人数保持原数字。")] };
    }
    accessToken = refreshed.accessToken;
  } catch {
    return { connected: true, updates: [], messages: [warn("暂时连不上 Google，报名人数保持原数字。")] };
  }

  const messages: GoogleNotice[] = [];
  const updates: { id: string; signed: number }[] = [];
  for (const event of pending) {
    const formId = parseGoogleFormId(event.formId);
    if (!formId) {
      messages.push(warn(`「${eventTitle(event)}」的表单编号无法识别，人数保持原数字。`));
      continue;
    }
    if (!event.sessions.length) {
      messages.push(warn(`「${eventTitle(event)}」没有场次，人数保持原数字。`));
      continue;
    }
    try {
      const count = await countFormResponses(accessToken, formId, signal);
      const applied = applyResponseCount(event, count);
      if (!applied.applied) {
        messages.push(warn(`「${eventTitle(event)}」没有场次，人数保持原数字。`));
        continue;
      }
      updates.push({ id: event.id, signed: applied.event.sessions[0]?.signed ?? 0 });
    } catch (error) {
      const message = countFailure(event, error);
      if (message.text.startsWith("同步超时") && messages.some((item) => item.text.startsWith("同步超时"))) continue;
      messages.push(message);
    }
  }
  if (updates.length) {
    const latest = await readSiteDraft();
    const events = mergeFirstSessionSigned(latest.events, updates);
    const same = updates.every((update) => latest.events.find((event) => event.id === update.id)?.sessions[0]?.signed === update.signed);
    if (!same) await saveSiteDraft({ ...latest, events });
    messages.unshift(note(`已同步 ${updates.length} 场活动的报名人数。`));
  }
  return { connected: true, updates, messages };
}

export function syncFormCounts(options: SyncOptions) {
  return exclusive(() => syncBody(options));
}

export function oauthNotice(code: string | undefined): GoogleNotice | null {
  if (code === "connected") return note("已连接 Google 表单。");
  if (code === "denied") return warn("没有完成授权，报名人数保持原数字。");
  if (code === "error") return warn("连接 Google 失败，请再试一次。");
  if (code === "config") return warn("服务器还没有配好 Google 客户端。");
  return null;
}
