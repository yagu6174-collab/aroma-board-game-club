// Pure helpers for Google Form signup counts. The public site never calls Google;
// it only renders the enrolled number already stored on the first session.

export const GOOGLE_FORMS_SCOPES = [
  "https://www.googleapis.com/auth/forms.body.readonly",
  "https://www.googleapis.com/auth/forms.responses.readonly",
] as const;

export const DEFAULT_GOOGLE_REDIRECT_URI = "https://aroma-board-game-club.vercel.app/api/google/callback";

const FORM_ID = "[a-zA-Z0-9_-]{20,}";

export function googleRedirectUri(envValue = process.env.GOOGLE_REDIRECT_URI) {
  const trimmed = envValue?.trim();
  return trimmed || DEFAULT_GOOGLE_REDIRECT_URI;
}

// Next's request.url can report localhost while the browser is on 127.0.0.1.
// A redirect that changes host drops the host-only admin cookie.
export function requestOrigin(request: { url: string; headers: { get(name: string): string | null } }) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? "";
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim() ?? "";
  const host = forwardedHost || hostHeader;
  const fallback = new URL(request.url).origin;
  if (!/^[A-Za-z0-9.-]+(?::\d+)?$/.test(host)) return fallback;
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
  const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function adminReturnUrl(request: { url: string; headers: { get(name: string): string | null } }, code?: string) {
  const url = new URL("/admin", requestOrigin(request));
  if (code) url.searchParams.set("google", code);
  return url;
}

export function googleConsentUrl(input: { clientId: string; redirectUri: string; state: string }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_FORMS_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("state", input.state);
  return url.toString();
}

// Google sometimes attaches identity scopes beside the Forms scopes that were
// requested. Those do not grant Drive or write access. Anything else is rejected
// so a token that can edit forms or read Drive is never stored.
const IDENTITY_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

export function grantedScopesAcceptable(scope: string) {
  const granted = scope.split(/[\s+]+/).filter(Boolean);
  if (!GOOGLE_FORMS_SCOPES.every((item) => granted.includes(item))) return false;
  const allowed = new Set<string>([...GOOGLE_FORMS_SCOPES, ...IDENTITY_SCOPES]);
  return granted.every((item) => allowed.has(item));
}

export type GoogleConnectNotice = { text: string; warn: boolean };

const OAUTH_NOTICES: Record<string, GoogleConnectNotice> = {
  connected: { text: "已连接 Google 表单。", warn: false },
  denied: { text: "没有完成授权，报名人数保持原数字。请在同意页继续，并勾选两个表单只读权限。", warn: true },
  config: { text: "服务器还没有配好 Google 客户端。", warn: true },
  nologin: { text: "登录状态没有一起回来。请在本页重新登录后，再连接 Google 表单。", warn: true },
  state: { text: "这次授权对不上当前登录。请留在本页重新点「连接 Google 表单」，不要换浏览器或中途退出。", warn: true },
  scope: { text: "授权范围不是表单只读。请再连接，并在同意页勾选查看表单和查看回复这两项。", warn: true },
  save: { text: "授权已经拿到，但没有保存成功。请稍后再连接一次。", warn: true },
  norefresh: { text: "Google 没有发回可长期使用的凭证。请在 Google 账号里取消本应用的授权后再连接；若应用仍在测试模式，请把表单所有者加为测试用户。", warn: true },
  invalid_client: { text: "Google 客户端编号或密钥不正确。请核对 Vercel 上的 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET。", warn: true },
  redirect_uri: { text: "回调地址和 Google 控制台不一致。请在 OAuth 客户端里登记 https://aroma-board-game-club.vercel.app/api/google/callback 。", warn: true },
  invalid_grant: { text: "授权码无效或已经用过。请再点一次「连接 Google 表单」。", warn: true },
  timeout: { text: "连接 Google 超时。请再试一次。", warn: true },
  token: { text: "换取 Google 凭证失败。请再试一次；若仍失败，请核对客户端密钥和回调地址。", warn: true },
  error: { text: "连接 Google 失败，请再试一次。", warn: true },
};

const REDIRECT_ERROR_CODES: Record<string, string> = {
  access_denied: "denied",
  invalid_scope: "scope",
  redirect_uri_mismatch: "redirect_uri",
  invalid_client: "invalid_client",
  unauthorized_client: "invalid_client",
  invalid_grant: "invalid_grant",
  invalid_request: "token",
  server_error: "token",
  temporarily_unavailable: "token",
  interaction_required: "denied",
  login_required: "nologin",
  consent_required: "denied",
  admin_policy_enforced: "denied",
  org_internal: "denied",
  policy_enforced: "denied",
  disallowed_useragent: "token",
};

export function oauthNotice(code: string | undefined): GoogleConnectNotice | null {
  if (!code) return null;
  return OAUTH_NOTICES[code] ?? null;
}

export function isOAuthNotice(text: string) {
  return Object.values(OAUTH_NOTICES).some((item) => item.text === text);
}

// Keep a connect failure on screen when a later sync would otherwise replace it
// with the empty-form-id warning.
export function mergeGoogleNotices<T extends { text: string }>(current: readonly T[], incoming: readonly T[]) {
  const kept = current.filter((item) => isOAuthNotice(item.text) && !incoming.some((next) => next.text === item.text));
  return [...kept, ...incoming];
}

export function classifyOAuthRedirectError(error: string | null | undefined) {
  if (!error) return null;
  return REDIRECT_ERROR_CODES[error] ?? "token";
}

export function classifyTokenExchange(input: {
  ok: boolean;
  error?: string;
  refreshToken?: string;
  scope?: string;
  timedOut?: boolean;
}) {
  if (input.timedOut) return "timeout";
  if (!input.ok) return classifyOAuthRedirectError(input.error) ?? "token";
  if (!input.refreshToken) return "norefresh";
  if (input.scope && !grantedScopesAcceptable(input.scope)) return "scope";
  return "connected";
}

export function disconnectedSyncNotices(input: { configured: boolean; formCount: number; reportEmpty: boolean }): GoogleConnectNotice[] {
  if (!input.formCount && !input.reportEmpty) return [];
  const messages: GoogleConnectNotice[] = [
    {
      text: input.configured
        ? "Google 未连接，请先连接表单所有者账号。人数保持原数字。"
        : "Google 客户端还没配置，人数保持原数字。",
      warn: true,
    },
  ];
  if (!input.formCount) messages.push({ text: "还没有填写同步用的表单编号，人数保持原数字。", warn: true });
  return messages;
}

// Edit URLs look like https://docs.google.com/forms/d/{id}/edit.
// The public /forms/d/e/{id}/viewform id is a different id and cannot be synced.
export function parseGoogleFormId(input: string) {
  const trimmed = input.trim();
  if (!trimmed || /\/forms\/d\/e\//i.test(trimmed)) return "";
  const fromUrl = new RegExp(`\\/forms\\/(?:u\\/\\d+\\/)?d\\/(${FORM_ID})(?:\\/|\\?|#|$)`, "i").exec(trimmed);
  if (fromUrl?.[1]) return fromUrl[1];
  if (new RegExp(`^${FORM_ID}$`).test(trimmed)) return trimmed;
  return "";
}

export function canonicalFormId(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const parsed = parseGoogleFormId(trimmed);
  if (parsed) return parsed;
  if (/https?:|docs\.google|\/forms\//i.test(trimmed)) return "";
  return trimmed.replace(/\s+/g, "").slice(0, 128);
}

export function readResponsePage(body: unknown) {
  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const count = Array.isArray(raw.responses) ? raw.responses.length : 0;
  const nextPageToken = typeof raw.nextPageToken === "string" ? raw.nextPageToken : "";
  return { count, nextPageToken };
}

// One form belongs to one event. The response total is the first session's enrolled
// number (the figure on a single-session card). Later sessions stay hand-entered.
export function applyResponseCount<T extends { sessions: { signed: number }[] }>(event: T, count: number) {
  if (!event.sessions.length || !Number.isFinite(count) || count < 0) return { event, applied: false };
  const signed = Math.round(count);
  return {
    applied: true,
    event: {
      ...event,
      sessions: event.sessions.map((session, index) => (index === 0 ? { ...session, signed } : session)),
    },
  };
}

export function mergeFirstSessionSigned<T extends { id: string; sessions: { signed: number }[] }>(
  events: T[],
  updates: readonly { id: string; signed: number }[],
) {
  const signedById = new Map(updates.map((item) => [item.id, item.signed]));
  return events.map((event) => {
    if (!signedById.has(event.id) || !event.sessions.length) return event;
    const signed = signedById.get(event.id)!;
    return {
      ...event,
      sessions: event.sessions.map((session, index) => (index === 0 ? { ...session, signed } : session)),
    };
  });
}
