import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { isOpsStaff } from "@/utils/opsAuth";
import {
  ensureMarketplaceUser,
  normalizeEmail,
} from "@/utils/user/ensureMarketplaceUser";

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "ops-credentials",
      name: "Ops",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        await connectToDatabase();
        const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({
          email: { $regex: new RegExp(`^${escaped}$`, "i") },
        }).select("+passwordHash");
        if (!user?.passwordHash || !isOpsStaff(user.role)) {
          return null;
        }
        // Ops Credentials: banned staff cannot sign in either.
        if (user.banned) {
          return null;
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
          image: user.image || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "ops-credentials") {
        // authorize() already rejected banned ops accounts
        return true;
      }

      await connectToDatabase();
      const email = normalizeEmail(profile?.email || user?.email);
      if (!email) return false;

      const marketplaceUser = await ensureMarketplaceUser({
        email,
        name: profile?.name || user?.name,
        image: profile?.image || user?.image,
      });
      if (!marketplaceUser) return false;

      // Block Google sign-in for banned marketplace accounts
      if (marketplaceUser.banned) {
        return false;
      }
      return true;
    },
    async jwt({ token, trigger }) {
      const needsHydrate =
        typeof token.id !== "string" ||
        typeof token.role !== "string" ||
        typeof token.hostStatus !== "string" ||
        typeof token.hasCompletedHostOnboarding !== "boolean" ||
        typeof token.banned !== "boolean";

      if (needsHydrate || trigger === "update") {
        await connectToDatabase();
        if (token.email) {
          token.email = normalizeEmail(token.email);
        }
        const user = await ensureMarketplaceUser({
          id: typeof token.id === "string" ? token.id : undefined,
          email: token.email,
          name: token.name,
          image: token.picture,
        });
        if (user) {
          token.id = user._id.toString();
          token.email = user.email;
          token.role = user.role;
          token.hostStatus = user.hostStatus;
          token.hasCompletedHostOnboarding = !!user.hasCompletedHostOnboarding;
          token.banned = !!user.banned;
          // Prefer DB display name so Profile edits show in Navbar
          if (user.username) {
            token.name = user.username;
          }
          // Prefer DB image (Cloudinary upload or Google) over stale OAuth picture
          if (user.image) {
            token.picture = user.image;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.hostStatus = token.hostStatus;
        session.user.hasCompletedHostOnboarding =
          token.hasCompletedHostOnboarding === true;
        session.user.banned = token.banned === true;
        if (token.picture) {
          session.user.image = token.picture;
        }
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.email) {
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
};
