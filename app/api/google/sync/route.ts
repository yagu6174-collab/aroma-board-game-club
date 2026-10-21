import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { syncFormCounts } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await syncFormCounts({ reportEmpty: true }));
  } catch {
    console.error("google sync failed");
    return NextResponse.json(
      { connected: false, updates: [], messages: [{ text: "同步没有完成，报名人数保持原数字。", warn: true }] },
      { status: 500 },
    );
  }
}
