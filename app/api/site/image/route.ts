import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { writeImage } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "bad" }, { status: 400 });
  try {
    const url = await writeImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "bad";
    const status = reason === "type" || reason === "size" ? 400 : 500;
    return NextResponse.json({ error: reason }, { status });
  }
}
