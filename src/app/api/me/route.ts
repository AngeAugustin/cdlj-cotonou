import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserService, changePasswordSchema } from "@/modules/users/service";
import { AuthSessionService } from "@/modules/auth-sessions/service";

type MeSession = {
  user?: { id?: string; sessionId?: string };
} | null;

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as MeSession;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const service = new UserService();
    const user = await service.getUser(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = (await getServerSession(authOptions)) as MeSession;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  try {
    const service = new UserService();
    await service.changeOwnPassword(session.user.id, parsed.data);

    let revokedOthers = 0;
    if (session.user.sessionId) {
      const sessions = new AuthSessionService();
      revokedOthers = await sessions.revokeOthers(session.user.id, session.user.sessionId);
    } else {
      const sessions = new AuthSessionService();
      revokedOthers = await sessions.revokeAll(session.user.id);
    }

    return NextResponse.json({ success: true, revokedOthers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
