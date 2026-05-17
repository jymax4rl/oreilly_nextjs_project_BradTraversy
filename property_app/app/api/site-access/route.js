import { NextResponse } from "next/server";
import {
  SITE_ACCESS_COOKIE,
  SITE_ACCESS_COOKIE_VALUE,
  getSiteAccessCode,
  isSiteAccessGateEnabled,
} from "@/utils/siteAccess";

export async function POST(request) {
  if (!isSiteAccessGateEnabled()) {
    return NextResponse.json({ ok: true });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const code = String(body?.code ?? "").trim();
  if (code !== getSiteAccessCode()) {
    return NextResponse.json(
      { ok: false, error: "Invalid access code" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
