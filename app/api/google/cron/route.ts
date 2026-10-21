import { NextResponse } from "next/server";
import { runFormCron } from "@/lib/formCron";
import { syncFormCounts } from "@/lib/google";

export const dynamic = "force-dynamic";

// Vercel Cron sends GET with Authorization: Bearer CRON_SECRET. Same quiet refresh as opening the admin page.
export async function GET(request: Request) {
  const result = await runFormCron(request, { CRON_SECRET: process.env.CRON_SECRET }, syncFormCounts);
  if (result.status === 500) console.error("google form cron failed");
  return NextResponse.json(result.body, { status: result.status });
}
