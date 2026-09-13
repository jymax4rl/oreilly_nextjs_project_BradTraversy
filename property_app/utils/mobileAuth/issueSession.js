import { ACCESS_TOKEN_EXPIRES_IN } from "@/utils/mobileAuth/constants";
import { signMobileAccessToken } from "@/utils/mobileAuth/accessToken";
import { issueRefreshToken } from "@/utils/mobileAuth/refreshToken";
import { toAuthUser } from "@/utils/mobileAuth/sessionUser";

/**
 * Issue access + refresh tokens and AuthUser payload (google / exchange).
 * @param {object} userDoc — Mongo User or AuthUser-compatible object
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   expiresIn: number,
 *   tokenType: "Bearer",
 *   user: import('@/types/apiAuth').AuthUser
 * }|null>}
 */
export async function issueMobileTokenResponse(userDoc) {
  const authUser = toAuthUser(userDoc);
  if (!authUser) return null;
  if (authUser.banned) return null;

  const accessToken = await signMobileAccessToken({
    id: authUser.id,
    email: authUser.email,
  });
  const refreshToken = await issueRefreshToken(authUser.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    tokenType: "Bearer",
    user: authUser,
  };
}
