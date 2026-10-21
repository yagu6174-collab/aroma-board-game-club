import { NextResponse } from "next/server";
import { readFormHookCall, runFormHook } from "@/lib/formHook";
import { syncFormCounts } from "@/lib/google";

export const dynamic = "force-dynamic";

// Apps Script posts here after a form submit. Auth is the shared secret, not the admin session.
export async function POST(request: Request) {
  const call = await readFormHookCall(request);
  const result = await runFormHook(call, process.env, syncFormCounts);
  if (result.status === 500) console.error("google form hook failed");
  return NextResponse.json(result.body, { status: result.status });
}
