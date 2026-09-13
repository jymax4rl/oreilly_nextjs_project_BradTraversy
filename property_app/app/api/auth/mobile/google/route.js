import connectToDatabase from "@/config/database";
import {
  mobileCorsJson,
  mobileCorsPreflight,
} from "@/utils/mobileAuth/cors";
import { verifyGoogleIdToken } from "@/utils/mobileAuth/googleIdToken";
import { issueMobileTokenResponse } from "@/utils/mobileAuth/issueSession";
import { ensureMarketplaceUser } from "@/utils/user/ensureMarketplaceUser";

export const dynamic = "force-dynamic";

/**
 * OPTIONS /api/auth/mobile/google — CORS preflight for Expo.
 */
export const OPTIONS = async (request) => mobileCorsPreflight(request);

/**
 * POST /api/auth/mobile/google
 * Body: { idToken: string }
 *
 * Verifies Google ID token, upserts marketplace user (same as NextAuth Google),
 * issues access JWT (15m) + opaque refresh token (30d).
 */
export const POST = async (request) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return mobileCorsJson(request, { error: "Invalid JSON" }, 400);
    }

    const idToken = body?.idToken;
    if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
      return mobileCorsJson(request, { error: "Missing idToken" }, 400);
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    if (!googleUser?.email) {
      return mobileCorsJson(
        request,
        { error: "Invalid or expired idToken" },
        401
      );
    }

    const connected = await connectToDatabase();
    if (!connected) {
      return mobileCorsJson(request, { error: "Database unavailable" }, 503);
    }

    const marketplaceUser = await ensureMarketplaceUser({
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.image,
    });
    if (!marketplaceUser) {
      return mobileCorsJson(request, { error: "Unable to provision user" }, 500);
    }
    if (marketplaceUser.banned) {
      return mobileCorsJson(request, { error: "Account banned" }, 401);
    }

    // Keep Google profile image if user has none yet (parity with OAuth path)
    if (googleUser.image && !marketplaceUser.image) {
      marketplaceUser.image = googleUser.image;
      await marketplaceUser.save();
    }

    const tokens = await issueMobileTokenResponse(marketplaceUser);
    if (!tokens) {
      return mobileCorsJson(request, { error: "Unable to issue tokens" }, 500);
    }

    return mobileCorsJson(request, tokens);
  } catch (error) {
    console.error("POST /api/auth/mobile/google error:", error);
    return mobileCorsJson(request, { error: "Authentication failed" }, 500);
  }
};
