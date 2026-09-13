/**
 * Smoke test for mobile auth bridge (no Google / Mongo required for core crypto).
 * Run: node --env-file=.env.local scripts/smoke-mobile-auth.mjs
 * Or: MOBILE_JWT_SECRET=test-secret node scripts/smoke-mobile-auth.mjs
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

process.env.MOBILE_JWT_SECRET ||= "smoke-test-mobile-jwt-secret-do-not-use";

const ACCESS_TOKEN_EXPIRES_IN = 900;
const ACCESS_TOKEN_TYP = "access";

function getSecretKey() {
  return new TextEncoder().encode(process.env.MOBILE_JWT_SECRET);
}

async function signMobileAccessToken(user) {
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

async function verifyMobileAccessToken(token) {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });
  assert.equal(payload.typ, ACCESS_TOKEN_TYP);
  assert.equal(typeof payload.sub, "string");
  return payload;
}

function hashRefreshToken(plaintext) {
  return createHash("sha256").update(String(plaintext)).digest("hex");
}

function getGoogleIdTokenAudiences() {
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_IOS,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.GOOGLE_CLIENT_ID_EXPO,
  ];
  const extra = process.env.GOOGLE_MOBILE_CLIENT_IDS;
  if (extra) {
    for (const part of String(extra).split(",")) ids.push(part);
  }
  return [
    ...new Set(ids.map((v) => String(v || "").trim()).filter(Boolean)),
  ];
}

async function main() {
  const user = { id: "507f1f77bcf86cd799439011", email: "guest@example.com" };
  const token = await signMobileAccessToken(user);
  const claims = await verifyMobileAccessToken(token);
  assert.equal(claims.sub, user.id);
  assert.equal(claims.email, user.email);
  assert.equal(claims.typ, "access");
  assert.ok(claims.exp - claims.iat === ACCESS_TOKEN_EXPIRES_IN);

  // Wrong secret must fail
  let rejected = false;
  try {
    await jwtVerify(token, new TextEncoder().encode("wrong-secret"), {
      algorithms: ["HS256"],
    });
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true);

  // NEXTAUTH_SECRET must not verify mobile tokens
  if (process.env.NEXTAUTH_SECRET) {
    let nextAuthRejected = false;
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.NEXTAUTH_SECRET),
        { algorithms: ["HS256"] }
      );
    } catch {
      nextAuthRejected = true;
    }
    assert.equal(nextAuthRejected, true);
  }

  const opaque = randomBytes(32).toString("base64url");
  const h1 = hashRefreshToken(opaque);
  const h2 = hashRefreshToken(opaque);
  assert.equal(h1, h2);
  assert.notEqual(h1, hashRefreshToken(opaque + "x"));
  assert.equal(h1.length, 64);

  process.env.GOOGLE_CLIENT_ID = "web.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_ID_IOS = "ios.apps.googleusercontent.com";
  process.env.GOOGLE_MOBILE_CLIENT_IDS =
    "a.apps.googleusercontent.com, b.apps.googleusercontent.com";
  const audiences = getGoogleIdTokenAudiences();
  assert.deepEqual(audiences, [
    "web.apps.googleusercontent.com",
    "ios.apps.googleusercontent.com",
    "a.apps.googleusercontent.com",
    "b.apps.googleusercontent.com",
  ]);

  console.log("smoke-mobile-auth: ok");
  console.log(
    JSON.stringify(
      {
        accessTokenPreview: `${token.slice(0, 24)}…`,
        claims: {
          sub: claims.sub,
          email: claims.email,
          typ: claims.typ,
          iat: claims.iat,
          exp: claims.exp,
        },
        refreshHashPreview: `${h1.slice(0, 12)}…`,
        audiences,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
