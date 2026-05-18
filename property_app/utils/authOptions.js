import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/config/database";
import User from "@/models/User";

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
  trustHost: true,
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
  ],
  callbacks: {
    async signIn({ profile }) {
      await connectToDatabase();
      const userExists = await User.findOne({ email: profile.email });
      if (!userExists) {
        const username = profile.name;
        await User.create({
          email: profile.email,
          username,
          image: profile.image,
          role: "guest",
          hostStatus: "none",
        });
      }
      return true;
    },
    async jwt({ token, trigger, session }) {
      // Hydrate token from DB on first sign-in
      if (!token.role || !token.hostStatus || !token.id) {
        await connectToDatabase();
        const user = await User.findOne({ email: token.email });
        if (user) {
          token.id = user._id.toString();
          token.role = user.role;
          token.hostStatus = user.hostStatus;
        }
      }

      // Re-hydrate from DB on explicit session update (e.g. after admin approval)
      if (trigger === "update") {
        await connectToDatabase();
        const user = await User.findOne({ email: token.email });
        if (user) {
          token.id = user._id.toString();
          token.role = user.role;
          token.hostStatus = user.hostStatus;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.hostStatus = token.hostStatus;
      }
      return session;
    },
  },
};
