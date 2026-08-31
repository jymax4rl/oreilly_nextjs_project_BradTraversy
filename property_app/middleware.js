import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isOpsStaff } from "@/utils/opsAuth";

const signInUrl = (req, callbackUrl) => {
  const u = new URL("/login", req.url);
  if (callbackUrl) {
    u.searchParams.set("callbackUrl", callbackUrl);
  }
  return u;
};

function needsWelcome(token) {
  return (
    token?.hostStatus === "verified" &&
    token.hasCompletedHostOnboarding !== true
  );
}

export async function middleware(req) {
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
    if (needsWelcome(token)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/host")) {
    if (!token) {
      return NextResponse.redirect(signInUrl(req, pathname));
    }
    if (pathname === "/host/onboarding" && token.hostStatus === "verified") {
      if (needsWelcome(token)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      return NextResponse.redirect(new URL("/properties/add", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (needsWelcome(token)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/onboarding") {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (token.hostStatus !== "verified") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (token.hasCompletedHostOnboarding === true) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/onboarding",
    "/properties/add",
    "/host/:path*",
    "/admin/:path*",
    "/ops/:path*",
  ],
};
