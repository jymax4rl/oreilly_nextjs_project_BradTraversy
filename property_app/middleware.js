import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isOpsStaff } from "@/utils/opsAuth";
import {
  LANG_CHOICE_KEY,
  LANG_COOKIE_MAX_AGE,
  LANG_PREFERENCE_KEY,
} from "@/lib/legal/constants";
import { resolveRequestLang } from "@/lib/i18n/resolveRequestLang";

const langCookie = {
  path: "/",
  maxAge: LANG_COOKIE_MAX_AGE,
  sameSite: "lax",
};

const signInUrl = (req, callbackUrl) => {
  const u = new URL("/login", req.url);
  if (callbackUrl) {
    u.searchParams.set("callbackUrl", callbackUrl);
  }
  return u;
};

function applyLocale(req, response) {
  const { lang, source } = resolveRequestLang({
    cookieLang: req.cookies.get(LANG_PREFERENCE_KEY)?.value,
    explicitChoice: req.cookies.get(LANG_CHOICE_KEY)?.value === "1",
    queryLang: req.nextUrl.searchParams.get("lang"),
    country: req.headers.get("x-vercel-ip-country"),
    acceptLanguage: req.headers.get("accept-language"),
    timeZone: req.headers.get("x-vercel-ip-timezone"),
  });

  if (req.cookies.get(LANG_PREFERENCE_KEY)?.value !== lang) {
    response.cookies.set(LANG_PREFERENCE_KEY, lang, langCookie);
  }
  if (source === "query" && req.cookies.get(LANG_CHOICE_KEY)?.value !== "1") {
    response.cookies.set(LANG_CHOICE_KEY, "1", langCookie);
  }
  return response;
}

async function handleAuth(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = req.nextUrl;
  const staff = isOpsStaff(token?.role);

  if (pathname.startsWith("/ops")) {
    if (pathname === "/ops/login" || pathname.startsWith("/ops/login/")) {
      if (token && staff) {
        return NextResponse.redirect(new URL("/ops", req.url));
      }
      return NextResponse.next();
    }

    if (!token || !staff) {
      const login = new URL("/ops/login", req.url);
      if (pathname !== "/ops") {
        login.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token || !staff) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname === "/admin" || pathname === "/admin/") {
      return NextResponse.redirect(new URL("/ops", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/properties/add") {
    if (!token) {
      return NextResponse.redirect(signInUrl(req, "/properties/add"));
    }
    if (token.hostStatus !== "verified") {
      return NextResponse.redirect(new URL("/host/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/host")) {
    if (!token) {
      if (pathname === "/host/onboarding") {
        return NextResponse.next();
      }
      return NextResponse.redirect(signInUrl(req, pathname));
    }
    const applicant =
      pathname === "/host/onboarding" ||
      pathname.startsWith("/host/onboarding/") ||
      pathname === "/host/pending" ||
      pathname.startsWith("/host/pending/");
    if (!applicant && token.hostStatus !== "verified") {
      if (token.hostStatus === "onboarding") {
        return NextResponse.redirect(new URL("/host/pending", req.url));
      }
      return NextResponse.redirect(new URL("/host/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/host/onboarding", req.url));
  }

  return NextResponse.next();
}

export async function middleware(req) {
  const response = await handleAuth(req);
  return applyLocale(req, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
