import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_GOOGLE_REDIRECT_URI,
  applyResponseCount,
  canonicalFormId,
  adminReturnUrl,
  googleConsentUrl,
  googleRedirectUri,
  grantedScopesAcceptable,
  mergeFirstSessionSigned,
  parseGoogleFormId,
  readResponsePage,
  GOOGLE_FORMS_SCOPES,
} from "./formSync.ts";
import { isRefreshSeal, openRefreshToken, sealRefreshToken } from "./googleSeal.ts";

const EDIT_ID = "1bZ7formEditIdExample0001";
const EDIT_URL = `https://docs.google.com/forms/d/${EDIT_ID}/edit?usp=sharing`;

test("edit urls and bare ids become the Forms API id", () => {
  assert.equal(parseGoogleFormId(EDIT_URL), EDIT_ID);
  assert.equal(parseGoogleFormId(`https://docs.google.com/forms/u/0/d/${EDIT_ID}/edit`), EDIT_ID);
  assert.equal(parseGoogleFormId(`  ${EDIT_ID}  `), EDIT_ID);
  assert.equal(canonicalFormId(EDIT_URL), EDIT_ID);
});

test("the public viewform id is not treated as the edit id", () => {
  const published = "1FAIpQLSdPublicViewformId0001";
  assert.equal(parseGoogleFormId(`https://docs.google.com/forms/d/e/${published}/viewform`), "");
  assert.equal(canonicalFormId(`https://docs.google.com/forms/d/e/${published}/viewform`), "");
  assert.equal(parseGoogleFormId("https://docs.google.com/forms/d/too-short/edit"), "");
  assert.equal(parseGoogleFormId(""), "");
});

test("a half-typed id is kept, and a bad url is dropped", () => {
  assert.equal(canonicalFormId("1bZ7still-typing"), "1bZ7still-typing");
  assert.equal(canonicalFormId("https://example.com/not-a-form"), "");
});

test("response pages add up, and the count lands on the first session only", () => {
  const first = readResponsePage({ responses: [{ responseId: "a" }, { responseId: "b" }], nextPageToken: "next" });
  const second = readResponsePage({ responses: [{ responseId: "c" }] });
  assert.equal(first.count + second.count, 3);
  assert.equal(first.nextPageToken, "next");
  assert.equal(readResponsePage(null).count, 0);

  const event = {
    id: "night",
    sessions: [
      { name: "第一场", signed: 6, capacity: 18 },
      { name: "第二场", signed: 1, capacity: 8 },
    ],
  };
  const next = applyResponseCount(event, 11);
  assert.equal(next.applied, true);
  assert.equal(next.event.sessions[0]?.signed, 11);
  assert.equal(next.event.sessions[0]?.capacity, 18);
  assert.equal(next.event.sessions[1]?.signed, 1);
  assert.equal(event.sessions[0]?.signed, 6);
  assert.equal(applyResponseCount(event, 0).event.sessions[0]?.signed, 0);
  assert.equal(applyResponseCount({ sessions: [] }, 4).applied, false);
  assert.equal(applyResponseCount(event, -1).applied, false);
});

test("merging a sync updates only the enrolled number that was fetched", () => {
  const events = [
    { id: "a", sessions: [{ signed: 1 }, { signed: 9 }] },
    { id: "b", sessions: [{ signed: 4 }] },
  ];
  const next = mergeFirstSessionSigned(events, [{ id: "a", signed: 7 }]);
  assert.equal(next[0]?.sessions[0]?.signed, 7);
  assert.equal(next[0]?.sessions[1]?.signed, 9);
  assert.equal(next[1]?.sessions[0]?.signed, 4);
  assert.equal(events[0]?.sessions[0]?.signed, 1);
});

test("consent asks only for the readonly Forms scopes", () => {
  const url = new URL(googleConsentUrl({ clientId: "client", redirectUri: DEFAULT_GOOGLE_REDIRECT_URI, state: "nonce.mac" }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("scope"), GOOGLE_FORMS_SCOPES.join(" "));
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("include_granted_scopes"), "false");
  assert.equal(url.searchParams.get("redirect_uri"), DEFAULT_GOOGLE_REDIRECT_URI);
  assert.equal(url.toString().includes("auth/drive"), false);
  assert.equal(grantedScopesAcceptable(GOOGLE_FORMS_SCOPES.join(" ")), true);
  assert.equal(grantedScopesAcceptable(`${GOOGLE_FORMS_SCOPES[0]} https://www.googleapis.com/auth/drive`), false);
  assert.equal(grantedScopesAcceptable(GOOGLE_FORMS_SCOPES[1]), false);
  assert.equal(googleRedirectUri(""), DEFAULT_GOOGLE_REDIRECT_URI);
  assert.equal(googleRedirectUri(" https://example.com/api/google/callback "), "https://example.com/api/google/callback");
});

test("admin redirects stay on the browser host", () => {
  const request = {
    url: "http://localhost:3000/api/google/start",
    headers: { get: (name: string) => (name === "host" ? "127.0.0.1:3000" : null) },
  };
  assert.equal(adminReturnUrl(request, "config").href, "http://127.0.0.1:3000/admin?google=config");
  const forwarded = {
    url: "http://localhost:3000/api/google/callback",
    headers: {
      get: (name: string) => {
        if (name === "x-forwarded-host") return "aroma-board-game-club.vercel.app";
        if (name === "x-forwarded-proto") return "https";
        if (name === "host") return "internal.local";
        return null;
      },
    },
  };
  assert.equal(adminReturnUrl(forwarded, "connected").href, "https://aroma-board-game-club.vercel.app/admin?google=connected");
});

test("a sealed refresh token round-trips and is not stored in plaintext", () => {
  const token = "1//refresh-token-value-should-not-leak";
  const secret = "local-test-secret";
  const sealed = sealRefreshToken(token, secret);
  assert.equal(isRefreshSeal(sealed), true);
  assert.equal(JSON.stringify(sealed).includes(token), false);
  assert.equal("refreshToken" in sealed, false);
  assert.equal(openRefreshToken(sealed, secret), token);
  assert.equal(openRefreshToken(sealed, "other-secret"), null);
  const flipped = `${sealed.ciphertext[0] === "A" ? "B" : "A"}${sealed.ciphertext.slice(1)}`;
  assert.equal(openRefreshToken({ ...sealed, ciphertext: flipped }, secret), null);
  assert.equal(openRefreshToken({ v: 0 }, secret), null);
});
