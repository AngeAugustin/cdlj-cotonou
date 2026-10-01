import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = Session["user"] & {
  id?: string;
  roles?: string[];
  parishId?: string | null;
  vicariatId?: string | null;
};

/**
 * Helper pour les route handlers API : session obligatoire (+ optionnellement un check rôle).
 * À utiliser sur toute nouvelle route privée pour éviter d'oublier l'auth.
 */
export async function requireApiSession(
  authorize?: (user: SessionUser) => boolean
): Promise<{ session: Session; user: SessionUser } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user as SessionUser;
  if (authorize && !authorize(user)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, user };
}
