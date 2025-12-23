import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/config/database";
import User from "@/models/User";

export const authOptions = {
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
      //1.connect to db
      await connectToDatabase();
      //2.check if user exists
      const userExists = await User.findOne({ email: profile.email });
      //3.add user to db if not exists
      if (!userExists) {
        //truncate user name if too long
        const username =
          profile.name.length > 20
            ? profile.name.substring(0, 20)
            : profile.name;
        await User.create({
          email: profile.email,
          username,
          image: profile.image,
        });
      }
      //4.return true to allow sign in
      return true;
    },
    async session({ session }) {
      //1.get user from db
      const user = await User.findOne({ email: session.user.email });
      //2.assign user id to session
      session.user.id = user._id.toString();
      //3.return session
      return session;
    },
  },
};
