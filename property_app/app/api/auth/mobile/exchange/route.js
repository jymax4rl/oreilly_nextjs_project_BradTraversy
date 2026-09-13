import connectToDatabase from "@/config/database";
import User from "@/models/User";
import {
  mobileCorsJson,
  mobileCorsPreflight,
} from "@/utils/mobileAuth/cors";
import { issueMobileTokenResponse } from "@/utils/mobileAuth/issueSession";
import { consumeAuthCode } from "@/utils/mobileAuth/oneTimeCode";

export const dynamic = "force-dynamic";

/**
 * OPTIONS /api/auth/mobile/exchange — CORS preflight for Expo.
 */
export const OPTIONS = async (request) => mobileCorsPreflight(request);

/**
 * POST /api/auth/mobile/exchange
 * Body: { code: string }
 *
 * Exchanges a one-time deep-link code for the same token payload as Google login:
 * `{ accessToken, refreshToken, expiresIn: 900, tokenType: "Bearer", user }`
 * then invalidates the code.
 */
export const POST = async (request) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return mobileCorsJson(request, { error: "Invalid JSON" }, 400);
    }

    const code = body?.code;
    if (!code || typeof code !== "string" || !code.trim()) {
      return mobileCorsJson(request, { error: "Missing code" }, 400);
    }

    const connected = await connectToDatabase();
    if (!connected) {
      return mobileCorsJson(request, { error: "Database unavailable" }, 503);
    }

    const consumed = await consumeAuthCode(code);
    if (!consumed) {
      return mobileCorsJson(
        request,
        { error: "Invalid or expired code" },
        401
      );
    }

    const user = await User.findById(consumed.userId);
    if (!user || user.banned) {
      return mobileCorsJson(
        request,
        { error: "Invalid or expired code" },
        401
      );
    }

    const tokens = await issueMobileTokenResponse(user);
    if (!tokens) {
      return mobileCorsJson(request, { error: "Unable to issue tokens" }, 500);
    }

    return mobileCorsJson(request, tokens);
  } catch (error) {
    console.error("POST /api/auth/mobile/exchange error:", error);
    return mobileCorsJson(request, { error: "Exchange failed" }, 500);
  }
};
