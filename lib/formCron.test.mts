import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FORM_CRON_PATH, FORM_CRON_SCHEDULE, formCronAuthorized, runFormCron } from "./formCron.ts";

const CRON = "cron-secret-value";
const HOOK = "hook-secret-value";

test("missing, blank, and non-bearer secrets are rejected", () => {
  const env = { CRON_SECRET: CRON };
  assert.equal(formCronAuthorized(null, env), false);
  assert.equal(formCronAuthorized("", env), false);
  assert.equal(formCronAuthorized("Bearer ", env), false);
  assert.equal(formCronAuthorized("Bearer wrong", env), false);
  assert.equal(formCronAuthorized(CRON, env), false);
  assert.equal(formCronAuthorized(`Bearer ${HOOK}`, env), false);
  assert.equal(formCronAuthorized(`Bearer ${CRON}`, {}), false);
  assert.equal(formCronAuthorized(`Bearer ${CRON}`, { CRON_SECRET: "  " }), false);
  assert.equal(formCronAuthorized(`Bearer ${CRON} `, { CRON_SECRET: `${CRON} extra` }), false);
});

test("Vercel Cron's Authorization Bearer header is accepted", () => {
  assert.equal(formCronAuthorized(`Bearer ${CRON}`, { CRON_SECRET: CRON }), true);
  assert.equal(formCronAuthorized(`bearer ${CRON}`, { CRON_SECRET: `  ${CRON}  ` }), true);
  assert.equal(formCronAuthorized(`Bearer   ${CRON}  `, { CRON_SECRET: CRON }), true);
});

test("a bad secret does not sync, and a good secret refreshes every linked form quietly", async () => {
  const calls: { reportEmpty: false }[] = [];
  const sync = async (options: { reportEmpty: false }) => {
    calls.push(options);
    return { connected: true, updates: [{ id: "night", signed: 4 }], messages: [] };
  };
  const env = { CRON_SECRET: CRON };

  const query = await runFormCron(
    {
      url: `https://aroma-board-game-club.vercel.app${FORM_CRON_PATH}?secret=${CRON}`,
      headers: new Headers(),
    },
    env,
    sync,
  );
  assert.equal(query.status, 401);
  assert.deepEqual(query.body, { error: "unauthorized" });
  assert.equal(calls.length, 0);

  const hookSecret = await runFormCron({ headers: new Headers({ authorization: `Bearer ${HOOK}` }) }, env, sync);
  assert.equal(hookSecret.status, 401);
  assert.equal(calls.length, 0);

  const ok = await runFormCron({ headers: new Headers({ authorization: `Bearer ${CRON}` }) }, env, sync);
  assert.equal(ok.status, 200);
  assert.deepEqual(calls[0], { reportEmpty: false });
  assert.equal("formId" in (calls[0] ?? {}), false);
  if (ok.status === 200) assert.equal(ok.body.updates[0]?.signed, 4);

  const failed = await runFormCron({ headers: new Headers({ authorization: `Bearer ${CRON}` }) }, env, async () => {
    throw new Error(`boom ${CRON}`);
  });
  assert.equal(failed.status, 500);
  assert.equal(JSON.stringify(failed.body).includes(CRON), false);
  assert.equal(calls.length, 1);
});

test("vercel.json schedules the cron once a day and the route stays on the shared sync path", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
    crons?: { path: string; schedule: string }[];
  };
  assert.equal(FORM_CRON_SCHEDULE, "0 0 * * *");
  assert.deepEqual(config.crons, [{ path: FORM_CRON_PATH, schedule: FORM_CRON_SCHEDULE }]);

  const route = readFileSync(new URL("../app/api/google/cron/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("export async function GET"), true);
  assert.equal(route.includes("runFormCron"), true);
  assert.equal(route.includes("syncFormCounts"), true);
  assert.equal(route.includes("CRON_SECRET"), true);
  assert.equal(route.includes("isAuthed"), false);
  assert.equal(route.includes("FORM_HOOK_SECRET"), false);
  assert.equal(route.includes("reportEmpty: true"), false);

  const hook = readFileSync(new URL("../app/api/google/hook/route.ts", import.meta.url), "utf8");
  assert.equal(hook.includes("export async function POST"), true);
  assert.equal(hook.includes("runFormHook"), true);
  assert.equal(hook.includes("FORM_HOOK_SECRET"), true);
});
