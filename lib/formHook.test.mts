import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  DEFAULT_FORM_HOOK_URL,
  FORM_HOOK_HEADER,
  configuredHookSecrets,
  formHookAuthorized,
  readFormHookCall,
  runFormHook,
} from "./formHook.ts";
import { GOOGLE_FORMS_SCOPES } from "./formSync.ts";

const SECRET = "hook-secret-value";
const CRON = "cron-secret-value";
const FORM_ID = "1bZ7formEditIdExample0001";

function call(partial: Partial<{ authorization: string | null; hookHeader: string | null; secretField: string | null; formId: string | null }>) {
  return {
    authorization: partial.authorization ?? null,
    hookHeader: partial.hookHeader ?? null,
    secretField: partial.secretField ?? null,
    formId: partial.formId ?? null,
  };
}

test("missing, blank, and wrong secrets are rejected", () => {
  const env = { FORM_HOOK_SECRET: SECRET };
  assert.equal(formHookAuthorized(call({}), env), false);
  assert.equal(formHookAuthorized(call({ authorization: "Bearer " }), env), false);
  assert.equal(formHookAuthorized(call({ authorization: "Bearer wrong" }), env), false);
  assert.equal(formHookAuthorized(call({ authorization: SECRET }), env), false);
  assert.equal(formHookAuthorized(call({ hookHeader: "wrong" }), env), false);
  assert.equal(formHookAuthorized(call({ secretField: "wrong" }), env), false);
  assert.equal(formHookAuthorized(call({ authorization: `Bearer ${SECRET}` }), {}), false);
  assert.equal(formHookAuthorized(call({ authorization: `Bearer ${SECRET}` }), { FORM_HOOK_SECRET: "  ", CRON_SECRET: "" }), false);
  assert.equal(formHookAuthorized(call({ secretField: SECRET }), { CRON_SECRET: "not-the-body" }), false);
});

test("header or body secrets are accepted from either env name", () => {
  assert.equal(formHookAuthorized(call({ authorization: `Bearer ${SECRET}` }), { FORM_HOOK_SECRET: SECRET }), true);
  assert.equal(formHookAuthorized(call({ authorization: `bearer ${SECRET}` }), { FORM_HOOK_SECRET: `  ${SECRET}  ` }), true);
  assert.equal(formHookAuthorized(call({ hookHeader: SECRET }), { FORM_HOOK_SECRET: SECRET }), true);
  assert.equal(formHookAuthorized(call({ secretField: SECRET }), { FORM_HOOK_SECRET: SECRET }), true);
  assert.equal(formHookAuthorized(call({ authorization: `Bearer ${CRON}` }), { CRON_SECRET: CRON }), true);
  assert.equal(formHookAuthorized(call({ authorization: "Bearer wrong", secretField: SECRET }), { FORM_HOOK_SECRET: SECRET, CRON_SECRET: CRON }), true);
  assert.equal(formHookAuthorized(call({ authorization: `Bearer ${CRON}` }), { FORM_HOOK_SECRET: SECRET, CRON_SECRET: CRON }), true);
  assert.deepEqual(configuredHookSecrets({ FORM_HOOK_SECRET: SECRET, CRON_SECRET: SECRET }), [SECRET]);
});

test("a bad secret does not sync, and a good secret syncs that form or every linked form", async () => {
  const calls: { reportEmpty: boolean; formId?: string }[] = [];
  const sync = async (options: { reportEmpty: true; formId?: string }) => {
    calls.push(options);
    return { connected: true, updates: [{ id: "night", signed: 4 }], messages: [] };
  };
  const env = { FORM_HOOK_SECRET: SECRET };

  const denied = await runFormHook(call({ formId: FORM_ID }), env, sync);
  assert.equal(denied.status, 401);
  assert.deepEqual(denied.body, { error: "unauthorized" });
  assert.equal(calls.length, 0);

  const one = await runFormHook(call({ authorization: `Bearer ${SECRET}`, formId: `  ${FORM_ID}  ` }), env, sync);
  assert.equal(one.status, 200);
  assert.equal(calls[0]?.reportEmpty, true);
  assert.equal(calls[0]?.formId, FORM_ID);
  if (one.status === 200) assert.equal(one.body.updates[0]?.signed, 4);

  const all = await runFormHook(call({ hookHeader: SECRET, formId: "   " }), env, sync);
  assert.equal(all.status, 200);
  assert.equal(calls[1]?.formId, undefined);
  assert.equal("formId" in (calls[1] ?? {}), false);

  const failed = await runFormHook(call({ secretField: SECRET, formId: FORM_ID }), env, async () => {
    throw new Error(`boom ${SECRET}`);
  });
  assert.equal(failed.status, 500);
  assert.equal(JSON.stringify(failed.body).includes(SECRET), false);
  assert.equal(calls.length, 2);
});

test("the request reader takes the secret from the header or JSON body, never the query string", async () => {
  const headers = new Headers({ authorization: `Bearer ${SECRET}`, [FORM_HOOK_HEADER]: "header-secret" });
  const read = await readFormHookCall({
    url: `https://aroma-board-game-club.vercel.app/api/google/hook?formId=from-query&secret=query-secret`,
    headers,
    text: async () => JSON.stringify({ secret: "body-secret", formId: FORM_ID }),
  });
  assert.equal(read.authorization, `Bearer ${SECRET}`);
  assert.equal(read.hookHeader, "header-secret");
  assert.equal(read.secretField, "body-secret");
  assert.equal(read.formId, FORM_ID);
  assert.equal(JSON.stringify(read).includes("query-secret"), false);

  const fromQuery = await readFormHookCall({
    url: `https://aroma-board-game-club.vercel.app/api/google/hook?formId=${FORM_ID}&secret=query-secret`,
    headers: new Headers(),
    text: async () => "",
  });
  assert.equal(fromQuery.secretField, "");
  assert.equal(fromQuery.formId, FORM_ID);

  const headerOnly = await readFormHookCall({
    url: "https://aroma-board-game-club.vercel.app/api/google/hook",
    headers: new Headers({ authorization: `Bearer ${SECRET}` }),
    text: async () => "not-json",
  });
  assert.equal(headerOnly.secretField, "");
  assert.equal(headerOnly.formId, "");
  assert.equal(formHookAuthorized(headerOnly, { FORM_HOOK_SECRET: SECRET }), true);
});

test("the Apps Script posts to the hook and keeps the readonly form scopes unchanged", () => {
  const script = readFileSync(new URL("../scripts/google-form-hook.gs", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/google/hook/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("syncFormCounts"), true);
  assert.equal(route.includes("isAuthed"), false);
  assert.equal(script.includes(DEFAULT_FORM_HOOK_URL), true);
  assert.equal(script.includes("FORM_HOOK_SECRET"), true);
  assert.equal(script.includes("FORM_HOOK_URL"), true);
  assert.equal(script.includes("syncEnrollmentOnSubmit"), true);
  assert.equal(script.includes("installSubmitTrigger"), true);
  assert.equal(script.includes("onFormSubmit"), true);
  assert.equal(script.includes("Authorization"), true);
  assert.equal(script.includes(SECRET), false);
  assert.equal(GOOGLE_FORMS_SCOPES.join(" "), "https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly");
});
