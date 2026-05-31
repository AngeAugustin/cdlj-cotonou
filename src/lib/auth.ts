import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "./mongoose";
import { User } from "@/modules/users/model";
import { Paroisse } from "@/modules/paroisses/model";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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

        let paroisseName: string | null = null;
        if (user.parishId) {
          const parish = await Paroisse.findById(user.parishId).select({ name: 1 }).lean<{ name?: string } | null>();
          paroisseName = parish?.name ?? null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          roles: user.roles,
          parishId: user.parishId?.toString() || null,
          vicariatId: user.vicariatId?.toString() || null,
          paroisseName,
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
        token.paroisseName = user.paroisseName ?? null;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.parishId = token.parishId;
        session.user.vicariatId = token.vicariatId;
        session.user.paroisseName = token.paroisseName ?? null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  }
};
