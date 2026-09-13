import { SignJWT, jwtVerify } from "jose";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_TYP,
} from "@/utils/mobileAuth/constants";

function getSecretKey() {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error("MOBILE_JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(String(secret).trim());
}

/**
 * Issue a short-lived mobile access JWT.
 * Claims: sub (userId), email, typ: "access", iat, exp.
 *
 * @param {{ id: string, email: string }} user
 * @returns {Promise<string>}
 */
export async function signMobileAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: user.email,
    typ: ACCESS_TOKEN_TYP,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(user.id))
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_EXPIRES_IN)
    .sign(getSecretKey());
}

/**
 * Verify a mobile access JWT signed with MOBILE_JWT_SECRET.
 * @param {string} token
 * @returns {Promise<{ sub: string, email?: string, typ?: string, iat?: number, exp?: number }|null>}
 */
export async function verifyMobileAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.typ !== ACCESS_TOKEN_TYP) return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      typ: ACCESS_TOKEN_TYP,
      iat: typeof payload.iat === "number" ? payload.iat : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}
