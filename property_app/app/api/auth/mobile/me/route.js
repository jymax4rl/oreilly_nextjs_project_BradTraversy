import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import {
  mobileCorsJson,
  mobileCorsPreflight,
} from "@/utils/mobileAuth/cors";

export const dynamic = "force-dynamic";

/**
 * OPTIONS /api/auth/mobile/me — CORS preflight for Expo.
 */
export const OPTIONS = async (request) => mobileCorsPreflight(request);

/**
 * GET /api/auth/mobile/me
 * Requires: Authorization: Bearer <accessToken>
 * Returns: { user: AuthUser }
 */
export const GET = async (request) => {
  try {
    const authHeader = request.headers.get("authorization") || "";
    if (!/^Bearer\s+\S+/i.test(authHeader)) {
      return mobileCorsJson(
        request,
        { error: "Bearer access token required" },
        401
      );
    }

    const session = await getAuthFromRequest(request, { bearerOnly: true });
    if (!session?.user?.id) {
      return mobileCorsJson(request, { error: "Unauthorized" }, 401);
    }

    return mobileCorsJson(request, { user: session.user });
  } catch (error) {
    console.error("GET /api/auth/mobile/me error:", error);
    return mobileCorsJson(request, { error: "Failed to load user" }, 500);
  }
};
