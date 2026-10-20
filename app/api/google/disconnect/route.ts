import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { clearGoogleConnection } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await clearGoogleConnection();
  } catch {
    return NextResponse.json({ error: "save" }, { status: 500 });
  }
  return NextResponse.json({ connected: false });
}
