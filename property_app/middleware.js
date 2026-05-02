import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // /properties/add → verified hosts only
    if (pathname === "/properties/add") {
      if (token?.hostStatus !== "verified") {
        return NextResponse.redirect(new URL("/host/onboarding", req.url));
      }
    }

    // /host/onboarding → block already-verified hosts
    if (pathname === "/host/onboarding") {
      if (token?.hostStatus === "verified") {
        return NextResponse.redirect(new URL("/properties/add", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // All matched routes require at least a logged-in user
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: ["/properties/add", "/host/:path*"],
};
