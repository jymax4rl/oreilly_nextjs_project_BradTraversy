import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isOpsStaff } from "@/utils/opsAuth";
import { canAccessOpsDocumentationToken } from "@/utils/documentation/access";
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

/** Expo web (isisel-mobile) served from this project until a dedicated Vercel project exists. */
const EXPO_APP_HOSTS = new Set(["app.isisel.com", "m.isisel.com"]);

function isExpoAppHost(req) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return EXPO_APP_HOSTS.has(host);
}

/**
 * Map Expo Router paths to static HTML under /public/app-web.
 * Absolute /_expo and /assets URLs are copied to public root so they bypass this rewrite.
 */
function rewriteExpoApp(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_expo/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let target;
  if (pathname === "/" || pathname === "") {
    target = "/app-web/index.html";
  } else if (pathname.startsWith("/property/")) {
    target = "/app-web/property/[id].html";
  } else if (pathname.startsWith("/inbox/")) {
    target = "/app-web/inbox/[propertyId]/[peerId].html";
  } else if (pathname === "/auth" || pathname === "/auth/") {
    target = "/app-web/auth/index.html";
  } else if (pathname.startsWith("/auth/")) {
    target = `/app-web${pathname.replace(/\/$/, "")}.html`;
  } else if (pathname.endsWith(".html")) {
    target = `/app-web${pathname}`;
  } else {
    target = `/app-web${pathname.replace(/\/$/, "")}.html`;
  }

  const url = req.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

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

  if (pathname.startsWith("/documentation")) {
    if (!token || !staff) {
      const login = new URL("/ops/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    if (!canAccessOpsDocumentationToken(token)) {
      return NextResponse.redirect(new URL("/ops", req.url));
    }
    return NextResponse.next();
  }

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
      return NextResponse.redirect(
        signInUrl(req, `${pathname}${req.nextUrl.search || ""}`),
      );
    }
    if (token.hostStatus !== "verified") {
      return NextResponse.redirect(
        new URL("/host/install?next=/host/onboarding", req.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/host")) {
    // Install guide is public so “Become a Host” can land here before sign-in
    // (Android one-tap / iOS Add to Home Screen).
    if (pathname === "/host/install") {
      return NextResponse.next();
    }
    if (!token) {
      if (pathname === "/host/onboarding") {
        return NextResponse.next();
      }
      return NextResponse.redirect(
        signInUrl(req, `${pathname}${req.nextUrl.search || ""}`),
      );
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

  if (pathname === "/insvestors" || pathname.startsWith("/insvestors/")) {
    return NextResponse.redirect(new URL("/investors", req.url));
  }

  return NextResponse.next();
}

export async function middleware(req) {
  if (isExpoAppHost(req)) {
    return rewriteExpoApp(req);
  }
  const response = await handleAuth(req);
  return applyLocale(req, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|pdf)$).*)",
  ],
};
