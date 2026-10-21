import "server-only";

// Refresh tokens are sealed with SESSION_SECRET and written through the same
// store as the site draft (Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
// otherwise .data/). The blob store is public, so the file holds ciphertext only.
import { randomBytes } from "crypto";
import {
  applyResponseCount,
  classifyTokenExchange,
  disconnectedSyncNotices,
  googleConsentUrl,
  googleRedirectUri,
  mergeFirstSessionSigned,
  parseGoogleFormId,
  readResponsePage,
} from "@/lib/formSync";
import { createOAuthState, oauthStateMatchesSession } from "@/lib/googleState";
import { isRefreshSeal, openRefreshToken, sealRefreshToken } from "@/lib/googleSeal";
import { readSiteDraft, saveSiteDraft } from "@/lib/site";
import { readStored, writeStored } from "@/lib/store";
import type { SiteEventDraft } from "@/data/siteDraft";

const KEY = "google-forms";
const LEGACY_STATE_COOKIE = "google_oauth_state";

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

export function issueOAuthState(sessionToken: string) {
  return createOAuthState(sessionToken, sessionSecret(), randomBytes(16).toString("base64url"));
}

export function oauthStateAccepts(state: string, sessionToken: string) {
  return oauthStateMatchesSession(state, sessionToken, sessionSecret());
}

export function consentUrlFor(state: string) {
  return googleConsentUrl({ clientId: clientId(), redirectUri: googleRedirectUri(), state });
}

export function legacyStateCookieClear() {
  return {
    name: LEGACY_STATE_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
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

function scopeList(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.join(" ");
  return "";
}

function isTimeout(err: unknown) {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

export async function exchangeGoogleCode(code: string) {
  const signal = AbortSignal.timeout(8000);
  try {
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
    const result = classifyTokenExchange({
      ok,
      error: typeof json?.error === "string" ? json.error : "",
      refreshToken,
      scope: scopeList(json?.scope),
    });
    if (result !== "connected") return result;
    try {
      await saveGoogleRefreshToken(refreshToken);
    } catch {
      return "save";
    }
    return "connected";
  } catch (err) {
    return isTimeout(err) ? "timeout" : "token";
  }
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

async function syncBody(reportEmpty: boolean): Promise<GoogleSyncResult> {
  const draft = await readSiteDraft();
  const pending = draft.events.filter((event) => event.formId.trim());
  const loaded = await loadRefreshToken();
  if (loaded.unreadable) {
    return { connected: false, updates: [], messages: [warn("已保存的 Google 连接读不出来，请重新连接。人数保持原数字。")] };
  }
  if (!loaded.refreshToken) {
    return {
      connected: false,
      updates: [],
      messages: disconnectedSyncNotices({ configured: googleConfigured(), formCount: pending.length, reportEmpty }),
    };
  }
  if (!googleConfigured()) {
    return { connected: true, updates: [], messages: [warn("Google 客户端还没配置，人数保持原数字。")] };
  }
  if (!pending.length) {
    return {
      connected: true,
      updates: [],
      messages: reportEmpty ? [warn("还没有填写同步用的表单编号，人数保持原数字。")] : [],
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

export function syncFormCounts(options: { reportEmpty: boolean }) {
  return exclusive(() => syncBody(options.reportEmpty));
}

export { oauthNotice } from "@/lib/formSync";
