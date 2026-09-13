import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

/**
 * Collect Google OAuth client IDs accepted as ID-token audiences.
 * Web (`GOOGLE_CLIENT_ID`) plus optional Expo / iOS / Android clients.
 * @returns {string[]}
 */
export function getGoogleIdTokenAudiences() {
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_IOS,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.GOOGLE_CLIENT_ID_EXPO,
  ];
  const extra = process.env.GOOGLE_MOBILE_CLIENT_IDS;
  if (extra) {
    for (const part of String(extra).split(",")) {
      ids.push(part);
    }
  }
  return [
    ...new Set(
      ids
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    ),
  ];
}

/**
 * Verify a Google ID token and return profile fields.
 * @param {string} idToken
 * @returns {Promise<{ email: string, name?: string, image?: string, emailVerified: boolean }|null>}
 */
export async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") return null;
  const audience = getGoogleIdTokenAudiences();
  if (audience.length === 0) {
    console.error(
      "No Google client IDs configured for mobile ID token audience"
    );
    return null;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return null;
    return {
      email: String(payload.email).trim().toLowerCase(),
      name: payload.name ? String(payload.name) : undefined,
      image: payload.picture ? String(payload.picture) : undefined,
      emailVerified: payload.email_verified === true,
    };
  } catch (error) {
    console.warn("Google ID token verification failed:", error?.message || error);
    return null;
  }
}
