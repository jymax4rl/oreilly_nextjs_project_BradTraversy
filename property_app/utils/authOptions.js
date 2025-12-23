import GoogleProvider from "next-auth/providers/google";

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
      //2.check if user exists
      //3.add user to db if not exists
      //4.return true to allow sign in
    },
    async session({ session }) {
      //1.get user from db
      //2.assign user to session
      //3.return session
    },
  },
};
