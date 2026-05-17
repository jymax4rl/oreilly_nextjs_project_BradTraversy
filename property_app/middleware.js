import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  SITE_ACCESS_COOKIE,
  SITE_ACCESS_COOKIE_VALUE,
  isSiteAccessGateEnabled,
} from "@/utils/siteAccess";

function hasSiteAccess(req) {
  return req.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}

function isGateExempt(pathname) {
  return (
    pathname === "/coming-soon" ||
    pathname.startsWith("/api/site-access") ||
    pathname.startsWith("/api/auth")
  );
}

function needsAuth(pathname) {
  return (
    pathname === "/properties/add" ||
    pathname === "/properties/my-listings" ||
    pathname.startsWith("/host/") ||
    pathname === "/host/onboarding" ||
    pathname.startsWith("/admin")
  );
}

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (
      pathname === "/properties/add" ||
      pathname === "/properties/my-listings"
    ) {
      if (token?.hostStatus !== "verified") {
        return NextResponse.redirect(new URL("/host/onboarding", req.url));
      }
    }

    if (pathname === "/host/onboarding") {
      if (token?.hostStatus === "verified") {
        return NextResponse.redirect(new URL("/properties/add", req.url));
      }
    }

    if (pathname.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return token !== null;
      },
    },
  },
);

export default function middleware(req, event) {
  const { pathname } = req.nextUrl;

  if (isSiteAccessGateEnabled()) {
    if (pathname === "/coming-soon" && hasSiteAccess(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (!isGateExempt(pathname) && !hasSiteAccess(req)) {
      const url = req.nextUrl.clone();
      url.pathname = "/coming-soon";
      if (pathname !== "/") {
        url.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  if (needsAuth(pathname)) {
    return authMiddleware(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
