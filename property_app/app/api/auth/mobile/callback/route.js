import { NextResponse } from "next/server";
import connectToDatabase from "@/config/database";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import {
  buildMobileDeepLink,
  isAllowedMobileDeepLink,
} from "@/utils/mobileAuth/deepLink";
import { issueAuthCode } from "@/utils/mobileAuth/oneTimeCode";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/mobile/callback
 *
 * After NextAuth Google completes (cookie session present), issues a short-lived
 * one-time code and redirects to isisel://auth?code=... (+ optional state).
 * Access/refresh JWTs are NEVER placed in the deep-link URL.
 */
export const GET = async (request) => {
  const url = new URL(request.url);
  const stateParam = url.searchParams.get("state");
  const state =
    typeof stateParam === "string" && stateParam.trim()
      ? stateParam.trim().slice(0, 256)
      : null;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id && !session?.user?.email) {
      const login = new URL("/login", url.origin);
      login.searchParams.set(
        "callbackUrl",
        `/api/auth/mobile/callback${state ? `?state=${encodeURIComponent(state)}` : ""}`
      );
      return NextResponse.redirect(login);
    }

    if (session.user.banned) {
      const deepLink = buildMobileDeepLink({ error: "banned", state });
      if (!isAllowedMobileDeepLink(deepLink)) {
        return new Response("Invalid deep link configuration", { status: 500 });
      }
      return NextResponse.redirect(deepLink);
    }

    const connected = await connectToDatabase();
    if (!connected) {
      const deepLink = buildMobileDeepLink({ error: "unavailable", state });
      return NextResponse.redirect(deepLink);
    }

    const code = await issueAuthCode(session.user.id, { state });
    const deepLink = buildMobileDeepLink({ code, state });

    if (!isAllowedMobileDeepLink(deepLink)) {
      console.error("Mobile callback refused non-allowlisted deep link");
      return new Response("Invalid deep link", { status: 500 });
    }

    return NextResponse.redirect(deepLink);
  } catch (error) {
    console.error("GET /api/auth/mobile/callback error:", error);
    const deepLink = buildMobileDeepLink({ error: "callback_failed", state });
    return NextResponse.redirect(deepLink);
  }
};
