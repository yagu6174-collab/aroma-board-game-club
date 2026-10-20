import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { consentUrlFor, googleConfigured, issueOAuthState, rememberOAuthState } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAuthed())) return NextResponse.redirect(new URL("/admin", request.url));
  if (!googleConfigured()) return NextResponse.redirect(new URL("/admin?google=config", request.url));
  const state = issueOAuthState();
  return rememberOAuthState(NextResponse.redirect(consentUrlFor(state)), state);
}
