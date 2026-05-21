import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const signInUrl = (req, callbackUrl) => {
  const u = new URL("/api/auth/signin", req.url);
  u.searchParams.set("callbackUrl", callbackUrl);
  return u;
};

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
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
      return NextResponse.redirect(signInUrl(req, pathname));
    }
    if (pathname === "/host/onboarding" && token.hostStatus === "verified") {
      return NextResponse.redirect(new URL("/properties/add", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (
      token?.role === "host" &&
      token.hasCompletedHostOnboarding !== true
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/onboarding") {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (token.role !== "host") {
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
  ],
};
