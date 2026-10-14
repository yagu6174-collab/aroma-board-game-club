import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readSiteDraft, saveSiteDraft } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await readSiteDraft());
}

export async function PUT(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad" }, { status: 400 });
  return NextResponse.json(await saveSiteDraft(body));
}
