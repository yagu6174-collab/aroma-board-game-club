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

export function grantedScopesAcceptable(scope: string) {
  const granted = scope.split(/\s+/).filter(Boolean);
  if (!GOOGLE_FORMS_SCOPES.every((item) => granted.includes(item))) return false;
  const allowed = new Set<string>(GOOGLE_FORMS_SCOPES);
  return granted.every((item) => allowed.has(item));
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
