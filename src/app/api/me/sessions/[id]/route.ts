import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AuthSessionService } from "@/modules/auth-sessions/service";

type MeSession = {
  user?: { id?: string; sessionId?: string };
} | null;

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = (await getServerSession(authOptions)) as MeSession;
    if (!session?.user?.id || !session.user.sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetSessionId } = await context.params;
    if (!targetSessionId) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 400 });
    }

    if (targetSessionId === session.user.sessionId) {
      return NextResponse.json(
        { error: "Utilisez la déconnexion pour fermer la session en cours" },
        { status: 400 }
      );
    }

    const service = new AuthSessionService();
    const ok = await service.revokeBySessionId(session.user.id, targetSessionId);
    if (!ok) {
      return NextResponse.json({ error: "Session introuvable ou déjà révoquée" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
