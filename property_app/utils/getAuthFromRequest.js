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
 * 1. Existing NextAuth cookie session (unchanged web path)
 * 2. Else `Authorization: Bearer <accessToken>` verified with MOBILE_JWT_SECRET
 *
 * Returns a shared session-like shape so handlers can migrate without
 * branching on cookie vs Bearer:
 * `{ user: { id, email, name, image } }`
 *
 * @param {Request} request
 * @returns {Promise<{ user: { id: string, email: string, name: string|null, image: string|null } }|null>}
 */
export async function getAuthFromRequest(request) {
  if (!request) return null;

  const cookieSession = await getSessionFromRequest(request);
  if (cookieSession?.user?.id || cookieSession?.user?.email) {
    const authUser = toAuthUser({
      id: cookieSession.user.id,
      email: cookieSession.user.email,
      name: cookieSession.user.name,
      image: cookieSession.user.image,
    });
    if (authUser) return toAuthSession(authUser);
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
  if (!user || user.banned) return null;

  const authUser = toAuthUser({
    id: user._id.toString(),
    email: user.email,
    // Prefer DB name/image; token only carries email + sub
    username: user.username,
    image: user.image,
  });
  if (!authUser) return null;
  return toAuthSession(authUser);
}
