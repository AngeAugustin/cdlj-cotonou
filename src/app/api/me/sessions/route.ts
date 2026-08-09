import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    const service = new AuthSessionService();
    const sessions = await service.listForUser(session.user.id, session.user.sessionId);
    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE ?others=1 — révoque toutes les sessions sauf la courante. */
export async function DELETE(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as MeSession;
    if (!session?.user?.id || !session.user.sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const othersOnly = searchParams.get("others") === "1";
    if (!othersOnly) {
      return NextResponse.json(
        { error: "Précisez ?others=1 ou utilisez /api/me/sessions/[id]" },
        { status: 400 }
      );
    }

    const service = new AuthSessionService();
    const count = await service.revokeOthers(session.user.id, session.user.sessionId);
    return NextResponse.json({ success: true, revoked: count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
