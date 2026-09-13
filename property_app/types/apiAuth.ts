/**
 * Shared dual-gate auth shape for API route handlers.
 * Returned by getAuthFromRequest for both NextAuth cookie and mobile Bearer paths.
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  hostStatus: string;
  hasCompletedHostOnboarding: boolean;
  banned: boolean;
};

export type AuthSession = {
  user: AuthUser;
};
