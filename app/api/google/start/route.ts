import { NextResponse } from "next/server";
import { adminReturnUrl } from "@/lib/formSync";
import { currentSessionToken } from "@/lib/auth";
import { consentUrlFor, googleConfigured, issueOAuthState } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await currentSessionToken();
  if (!session) return NextResponse.redirect(adminReturnUrl(request));
  if (!googleConfigured()) return NextResponse.redirect(adminReturnUrl(request, "config"));
  return NextResponse.redirect(consentUrlFor(issueOAuthState(session)));
}
