import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/mobile/start
 *
 * Expo entry for WebBrowser.openAuthSessionAsync / openAuthSessionAsync.
 * Redirects into NextAuth Google with callback to /api/auth/mobile/callback
 * (which then deep-links to isisel://auth?code=... — never puts JWTs in the URL).
 *
 * Query:
 * - state (optional) — echoed on deep-link for client CSRF / correlation
 */
export const GET = async (request) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");

  const callback = new URL("/api/auth/mobile/callback", url.origin);
  if (state) {
    callback.searchParams.set("state", state.slice(0, 256));
  }

  const signIn = new URL("/api/auth/signin/google", url.origin);
  signIn.searchParams.set("callbackUrl", callback.toString());

  return NextResponse.redirect(signIn);
};
