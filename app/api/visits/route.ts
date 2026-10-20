import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/visits";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await recordVisit();
  } catch (error) {
    console.error("visit counter skipped", error);
  }
  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
