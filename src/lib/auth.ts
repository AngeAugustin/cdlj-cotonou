import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "./mongoose";
import { User } from "@/modules/users/model";
import { Paroisse } from "@/modules/paroisses/model";
import bcryptjs from "bcryptjs";
import { normalizeRoles } from "@/lib/rolePermissions";
import {
  AuthSessionService,
  SESSION_IDLE_MS,
  extractClientMeta,
} from "@/modules/auth-sessions/service";

const authSessionService = new AuthSessionService();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
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

        const { userAgent, ip } = extractClientMeta(req?.headers);
        const { sessionId } = await authSessionService.create({
          userId: user._id.toString(),
          userAgent,
          ip,
        });

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          roles: normalizeRoles(user.roles),
          parishId: user.parishId?.toString() || null,
          vicariatId: user.vicariatId?.toString() || null,
          paroisseName,
          sessionId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: Math.floor(SESSION_IDLE_MS / 1000),
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = normalizeRoles(user.roles);
        token.parishId = user.parishId;
        token.vicariatId = user.vicariatId;
        token.paroisseName = user.paroisseName ?? null;
        token.sessionId = user.sessionId;
        return token;
      }

      if (!token.sessionId || !token.id) {
        return {};
      }

      const active = await authSessionService.assertActive(
        String(token.sessionId),
        String(token.id)
      );
      if (!active) {
        return {};
      }

      if (token.roles) {
        token.roles = normalizeRoles(token.roles as string[]);
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !token?.sessionId) {
        return {
          ...session,
          user: {
            name: null,
            email: null,
            image: null,
          },
        };
      }
      if (session.user) {
        session.user.id = String(token.id);
        session.user.roles = normalizeRoles(token.roles as string[] | undefined);
        session.user.parishId = (token.parishId as string | null) ?? null;
        session.user.vicariatId = (token.vicariatId as string | null) ?? null;
        session.user.paroisseName = (token.paroisseName as string | null) ?? null;
        session.user.sessionId = String(token.sessionId);
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const sessionId = token && typeof token === "object" ? (token as { sessionId?: string }).sessionId : undefined;
      const userId = token && typeof token === "object" ? (token as { id?: string }).id : undefined;
      if (sessionId && userId) {
        try {
          await authSessionService.revokeBySessionId(String(userId), String(sessionId));
        } catch {
          // Ne bloque pas la déconnexion cookie
        }
      }
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
