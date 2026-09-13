import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { verifyMobileAccessToken } from "@/utils/mobileAuth/accessToken";
import {
  mobileCorsJson,
  mobileCorsPreflight,
  mobileCorsResponse,
} from "@/utils/mobileAuth/cors";
import { revokeRefreshToken } from "@/utils/mobileAuth/refreshToken";

export const dynamic = "force-dynamic";

/**
 * OPTIONS /api/auth/mobile/logout — CORS preflight for Expo.
 */
export const OPTIONS = async (request) => mobileCorsPreflight(request);

/**
 * POST /api/auth/mobile/logout
 * Requires: Authorization: Bearer <accessToken>
 * Body: { refreshToken: string }
 *
 * Revokes the refresh token server-side.
 */
export const POST = async (request) => {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return mobileCorsJson(
        request,
        { error: "Bearer access token required" },
        401
      );
    }

    const claims = await verifyMobileAccessToken(match[1].trim());
    if (!claims?.sub) {
      return mobileCorsJson(request, { error: "Unauthorized" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return mobileCorsJson(request, { error: "Invalid JSON" }, 400);
    }

    const refreshToken = body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string" || !refreshToken.trim()) {
      return mobileCorsJson(request, { error: "Missing refreshToken" }, 400);
    }

    const connected = await connectToDatabase();
    if (!connected) {
      return mobileCorsJson(request, { error: "Database unavailable" }, 503);
    }

    // Confirm user still exists; revoke only tokens owned by this subject
    const user = await User.findById(claims.sub);
    if (!user) {
      return mobileCorsJson(request, { error: "Unauthorized" }, 401);
    }

    await revokeRefreshToken(refreshToken, user._id.toString());

    return mobileCorsResponse(request, null, { status: 204 });
  } catch (error) {
    console.error("POST /api/auth/mobile/logout error:", error);
    return mobileCorsJson(request, { error: "Logout failed" }, 500);
  }
};
