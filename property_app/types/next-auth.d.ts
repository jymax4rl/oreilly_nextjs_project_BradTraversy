import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hostStatus: string;
      hasCompletedHostOnboarding: boolean;
    } & DefaultSession["user"];
  }
}
