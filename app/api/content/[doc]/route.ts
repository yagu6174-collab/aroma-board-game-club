import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readDoc, saveDoc } from "@/lib/content";
import { isDocName } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ doc: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { doc } = await context.params;
  if (!isDocName(doc)) return NextResponse.json({ error: "unknown" }, { status: 404 });
  return NextResponse.json(await readDoc(doc));
}

export async function PUT(request: Request, context: { params: Promise<{ doc: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { doc } = await context.params;
  if (!isDocName(doc)) return NextResponse.json({ error: "unknown" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad" }, { status: 400 });
  return NextResponse.json(await saveDoc(doc, body));
}
