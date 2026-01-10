import { default as nextAuthMiddleware } from "next-auth/middleware";

export default nextAuthMiddleware;

export const config = {
  matcher: ["/properties/add", "/properties/saved", "/messages"],
};
