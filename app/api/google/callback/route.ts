import { NextResponse } from "next/server";
import { currentSessionToken } from "@/lib/auth";
import { adminReturnUrl, classifyOAuthRedirectError } from "@/lib/formSync";
import { exchangeGoogleCode, googleConfigured, legacyStateCookieClear, oauthStateAccepts } from "@/lib/google";

export const dynamic = "force-dynamic";

function finish(request: Request, code: string) {
  const response = NextResponse.redirect(adminReturnUrl(request, code));
  const clear = legacyStateCookieClear();
  response.cookies.set(clear.name, "", clear.options);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const session = await currentSessionToken();
  if (!session) return finish(request, "nologin");
  if (!googleConfigured()) return finish(request, "config");
  const redirectError = classifyOAuthRedirectError(url.searchParams.get("error"));
  if (redirectError) return finish(request, redirectError);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  if (!oauthStateAccepts(state, session)) return finish(request, "state");
  if (!code) return finish(request, "token");
  const result = await exchangeGoogleCode(code);
  if (result !== "connected") console.error("google oauth connect result", result);
  return finish(request, result);
}
