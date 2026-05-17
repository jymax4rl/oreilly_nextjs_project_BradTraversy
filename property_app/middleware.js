import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname === "/properties/add") {
      if (token?.hostStatus !== "verified") {
        return NextResponse.redirect(new URL("/host/onboarding", req.url));
      }
    }

    if (pathname === "/host/onboarding") {
      if (token?.hostStatus === "verified") {
        return NextResponse.redirect(new URL("/properties/add", req.url));
      }
    }

    // /admin/* → admin role only
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

export const config = {
  matcher: ["/properties/add", "/host/:path*", "/admin/:path*"],
};
