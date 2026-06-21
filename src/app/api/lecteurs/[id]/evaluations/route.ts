import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { EvaluationService } from "@/modules/evaluations/service";
import { canAccessLecteur } from "@/lib/rolePermissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as
      | { user?: { roles?: string[]; parishId?: string; vicariatId?: string } }
      | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const lecteurService = new LecteurService();
    const evaluationService = new EvaluationService();

    const lecteur = await lecteurService.getLecteurById(id);
    if (!lecteur) return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });
    if (!canAccessLecteur(session.user, lecteur as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const evaluations = await evaluationService.getLecteurPublishedEvaluations(id);
    return NextResponse.json(evaluations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
