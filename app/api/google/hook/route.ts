import { NextResponse } from "next/server";
import { readFormHookCall, runFormHook } from "@/lib/formHook";
import { syncFormCounts } from "@/lib/google";

export const dynamic = "force-dynamic";

// Apps Script posts here after a form submit. Auth is the shared secret, not the admin session.
export async function POST(request: Request) {
  const call = await readFormHookCall(request);
  const result = await runFormHook(
    call,
    {
      FORM_HOOK_SECRET: process.env.FORM_HOOK_SECRET,
      CRON_SECRET: process.env.CRON_SECRET,
    },
    syncFormCounts,
  );
  if (result.status === 500) console.error("google form hook failed");
  return NextResponse.json(result.body, { status: result.status });
}
