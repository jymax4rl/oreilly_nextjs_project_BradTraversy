import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { ACCESS_TOKEN_EXPIRES_IN } from "@/utils/mobileAuth/constants";
import { signMobileAccessToken } from "@/utils/mobileAuth/accessToken";
import {
  mobileCorsJson,
  mobileCorsPreflight,
} from "@/utils/mobileAuth/cors";
import { rotateRefreshToken } from "@/utils/mobileAuth/refreshToken";

export const dynamic = "force-dynamic";

/**
 * OPTIONS /api/auth/mobile/refresh — CORS preflight for Expo.
 */
export const OPTIONS = async (request) => mobileCorsPreflight(request);

/**
 * POST /api/auth/mobile/refresh
 * Body: { refreshToken: string }
 *
 * Validates + rotates refresh token; returns new access + refresh tokens.
 */
export const POST = async (request) => {
  try {
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

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      return mobileCorsJson(
        request,
        { error: "Invalid or expired refreshToken" },
        401
      );
    }

    const user = await User.findById(rotated.userId);
    if (!user || user.banned) {
      return mobileCorsJson(
        request,
        { error: "Invalid or expired refreshToken" },
        401
      );
    }

    const accessToken = await signMobileAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    return mobileCorsJson(request, {
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      refreshToken: rotated.refreshToken,
    });
  } catch (error) {
    console.error("POST /api/auth/mobile/refresh error:", error);
    return mobileCorsJson(request, { error: "Refresh failed" }, 500);
  }
};
