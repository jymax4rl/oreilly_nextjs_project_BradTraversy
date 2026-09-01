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

export const config = {
  matcher: [
    "/onboarding",
    "/properties/add",
    "/host/:path*",
    "/admin/:path*",
    "/ops/:path*",
  ],
};
