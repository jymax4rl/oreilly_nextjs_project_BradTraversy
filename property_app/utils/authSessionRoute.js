import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

/**
 * NextAuth session for App Router Route Handlers.
 *
 * `getServerSession(authOptions)` alone reads `cookies()` from `next/headers`,
 * which does not always match the incoming `Request` in route handlers.
 * Building `req` from `request.headers.get("cookie")` keeps PATCH/GET auth aligned
 * with the browser request so admin APIs receive the session and can update MongoDB.
 */

const noopRes = {
  getHeader() {},
  setCookie() {},
  setHeader() {},
};

export function parseCookieHeader(cookieHeader) {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== "string") return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    let val = part.slice(idx + 1).trim();
    try {
      val = decodeURIComponent(val);
    } catch {
      /* keep raw */
    }
    if (key) out[key] = val;
  }
  return out;
}

export async function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const req = {
    headers: Object.fromEntries(request.headers.entries()),
    cookies: parseCookieHeader(cookieHeader),
  };
  return getServerSession(req, noopRes, authOptions);
}
