import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { EvaluationService } from "@/modules/evaluations/service";
import { updateLecteurSchema } from "@/modules/lecteurs/schema";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";

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
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[]; parishId?: string; vicariatId?: string } } | null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = new LecteurService();
    const bundle = await service.getLecteurWithHistory(id);
    if (!bundle) return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });

    if (!canAccessLecteur(session, bundle.lecteur as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      lecteur: serializeLecteur(bundle.lecteur),
      history: bundle.history,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string; vicariatId?: string };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = new LecteurService();
    const existing = await service.getLecteurById(id);
    if (!existing) return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });
    if (!canAccessLecteur(session, existing as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateLecteurSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }

    const roles = session.user.roles ?? [];
    const isSuper = roles.includes("SUPERADMIN") || roles.includes("DIOCESAIN");
    const patch = { ...parsed.data };
    if (roles.includes("PAROISSIAL")) {
      if (session.user.parishId) patch.paroisseId = session.user.parishId;
      if (session.user.vicariatId) patch.vicariatId = session.user.vicariatId;
    } else if (!isSuper) {
      delete patch.paroisseId;
      delete patch.vicariatId;
    }

    // Règle TDR : si le lecteur est concerné par au moins une évaluation, alors son grade ne doit plus être modifiable.
    if (patch.gradeId !== undefined) {
      const evaluationService = new EvaluationService();
      const hasEvaluations = await evaluationService.hasAnyEvaluationForLecteur(id);
      if (hasEvaluations) {
        delete patch.gradeId;
      }
    }

    const updated = await service.updateLecteur(id, patch);
    return NextResponse.json(updated ? serializeLecteur(updated) : null);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string; vicariatId?: string };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = new LecteurService();
    const existing = await service.getLecteurById(id);
    if (!existing) return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });
    if (!canAccessLecteur(session, existing as unknown as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await service.deleteLecteur(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
