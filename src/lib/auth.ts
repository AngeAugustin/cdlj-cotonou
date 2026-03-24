import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "./mongoose";
import { User, IUser } from "@/modules/users/model";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email }).lean();
        
        if (!user || !user.password) return null;

        const isPasswordValid = await bcryptjs.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          roles: user.roles,
          parishId: user.parishId?.toString() || null,
          vicariatId: user.vicariatId?.toString() || null,
        } as any;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.parishId = user.parishId;
        token.vicariatId = user.vicariatId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.parishId = token.parishId;
        session.user.vicariatId = token.vicariatId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  }
};
