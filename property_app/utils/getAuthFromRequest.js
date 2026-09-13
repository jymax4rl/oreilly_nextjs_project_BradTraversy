import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import { verifyMobileAccessToken } from "@/utils/mobileAuth/accessToken";
import {
  toAuthSession,
  toAuthUser,
} from "@/utils/mobileAuth/sessionUser";

/**
 * Dual-gate auth for API route handlers only (not page middleware).
 *
 * Resolution order:
 * 1. Existing NextAuth cookie session (unchanged web path) — skipped when
 *    `options.bearerOnly` is true (e.g. GET /api/auth/mobile/me)
 * 2. Else `Authorization: Bearer <accessToken>` verified with MOBILE_JWT_SECRET
 *
 * Returns a shared session-like shape so handlers can migrate without
 * branching on cookie vs Bearer:
 * `{ user: { id, email, name, image, role, hostStatus, hasCompletedHostOnboarding, banned } }`
 *
 * @param {Request} request
 * @param {{ bearerOnly?: boolean }} [options]
 * @returns {Promise<import('@/types/apiAuth').AuthSession|null>}
 */
export async function getAuthFromRequest(request, options = {}) {
  if (!request) return null;

  const bearerOnly = options.bearerOnly === true;

  if (!bearerOnly) {
    const cookieSession = await getSessionFromRequest(request);
    if (cookieSession?.user?.id || cookieSession?.user?.email) {
      const authUser = toAuthUser({
        id: cookieSession.user.id,
        email: cookieSession.user.email,
        name: cookieSession.user.name,
        image: cookieSession.user.image,
        // Pass through NextAuth session fields host handlers already rely on
        role: cookieSession.user.role,
        hostStatus: cookieSession.user.hostStatus,
        hasCompletedHostOnboarding:
          cookieSession.user.hasCompletedHostOnboarding,
        banned: cookieSession.user.banned,
      });
      if (authUser) return toAuthSession(authUser);
    }
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const claims = await verifyMobileAccessToken(match[1].trim());
  if (!claims) return null;

  const connected = await connectToDatabase();
  if (!connected) return null;

  let user = null;
  if (/^[a-fA-F0-9]{24}$/.test(claims.sub)) {
    user = await User.findById(claims.sub);
  }
  if (!user && claims.email) {
    const escaped = String(claims.email)
      .trim()
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    user = await User.findOne({
      email: { $regex: new RegExp(`^${escaped}$`, "i") },
    });
  }
  if (!user) return null;

  // Hydrate host/role fields from Mongo (same source as NextAuth callbacks).
  // Access JWT stays minimal (sub/email/typ); do not trust claims for these.
  const authUser = toAuthUser({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    image: user.image,
    role: user.role,
    hostStatus: user.hostStatus,
    hasCompletedHostOnboarding: user.hasCompletedHostOnboarding,
    banned: user.banned,
  });
  if (!authUser) return null;
  return toAuthSession(authUser);
}
