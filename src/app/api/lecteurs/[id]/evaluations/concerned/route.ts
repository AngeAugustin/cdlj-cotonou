import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { EvaluationService } from "@/modules/evaluations/service";

function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "_id" in (v as object)) return String((v as { _id: unknown })._id);
  return String(v);
}

function canAccessLecteur(
  session: { user?: { roles?: string[]; parishId?: string; vicariatId?: string } },
  lecteur: Record<string, unknown>
) {
  const roles: string[] = session.user?.roles ?? [];
  if (roles.includes("SUPERADMIN") || roles.includes("DIOCESAIN")) return true;

  const pid = refId(lecteur.paroisseId);
  const vid = refId(lecteur.vicariatId);

  if (roles.includes("VICARIAL") && session.user?.vicariatId && vid === String(session.user.vicariatId)) return true;
  if (roles.includes("PAROISSIAL") && session.user?.parishId && pid === String(session.user.parishId)) return true;

  return false;
}

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

    if (!canAccessLecteur(session, lecteur as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hasEvaluations = await evaluationService.hasAnyEvaluationForLecteur(id);

    return NextResponse.json({ hasEvaluations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

