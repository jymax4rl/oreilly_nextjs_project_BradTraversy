import { NextResponse } from "next/server";
import {
  isAllowedMobileDeepLink,
  resolveMobileDeepLinkBase,
} from "@/utils/mobileAuth/deepLink";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/mobile/start
 *
 * Expo entry for WebBrowser.openAuthSessionAsync / full-page web OAuth.
 * Redirects into NextAuth Google with callback to /api/auth/mobile/callback
 * (which then returns to an allowlisted target with ?code= — never JWTs in URL).
 *
 * Query:
 * - state (optional) — echoed on return for client CSRF / correlation
 * - redirect_uri (optional) — must be in MOBILE_DEEP_LINK_ALLOWLIST
 *   (isisel://auth or https://app.isisel.com/auth)
 */
export const GET = async (request) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const redirectUri = url.searchParams.get("redirect_uri");
  const returnBase = resolveMobileDeepLinkBase(redirectUri);

  if (redirectUri && !isAllowedMobileDeepLink(redirectUri)) {
    return NextResponse.json(
      { error: "redirect_uri is not allowlisted" },
      { status: 400 },
    );
  }

  const callback = new URL("/api/auth/mobile/callback", url.origin);
  if (state) {
    callback.searchParams.set("state", state.slice(0, 256));
  }
  // Pass chosen return base through the NextAuth round-trip.
  callback.searchParams.set("redirect_uri", returnBase);

  const signIn = new URL("/api/auth/signin/google", url.origin);
  signIn.searchParams.set("callbackUrl", callback.toString());

  return NextResponse.redirect(signIn);
};
