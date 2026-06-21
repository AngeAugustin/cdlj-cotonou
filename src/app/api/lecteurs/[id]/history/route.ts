import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { serializeParticipationHistory } from "@/modules/lecteurs/serializeApi";
import { canAccessLecteur } from "@/lib/rolePermissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string; vicariatId?: string };
    } | null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = new LecteurService();
    const lecteur = await service.getLecteurById(id);
    if (!lecteur) return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });

    if (!canAccessLecteur(session.user ?? {}, lecteur as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const history = await service.getParticipationHistory(id);
    return NextResponse.json(serializeParticipationHistory(history));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
