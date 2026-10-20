import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { exchangeGoogleCode, forgetOAuthState, googleConfigured, oauthStateMatches } from "@/lib/google";

export const dynamic = "force-dynamic";

function finish(request: Request, code: string) {
  return forgetOAuthState(NextResponse.redirect(new URL(`/admin?google=${code}`, request.url)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!(await isAuthed())) return finish(request, "error");
  if (!googleConfigured()) return finish(request, "config");
  const error = url.searchParams.get("error");
  if (error === "access_denied") return finish(request, "denied");
  if (error) return finish(request, "error");
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  if (!code || !(await oauthStateMatches(state))) return finish(request, "error");
  try {
    const saved = await exchangeGoogleCode(code);
    return finish(request, saved ? "connected" : "error");
  } catch {
    console.error("google oauth callback failed");
    return finish(request, "error");
  }
}
