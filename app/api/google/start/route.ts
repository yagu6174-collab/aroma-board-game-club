import { NextResponse } from "next/server";
import { adminReturnUrl } from "@/lib/formSync";
import { isAuthed } from "@/lib/auth";
import { consentUrlFor, googleConfigured, issueOAuthState, rememberOAuthState } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAuthed())) return NextResponse.redirect(adminReturnUrl(request));
  if (!googleConfigured()) return NextResponse.redirect(adminReturnUrl(request, "config"));
  const state = issueOAuthState();
  return rememberOAuthState(NextResponse.redirect(consentUrlFor(state)), state);
}
