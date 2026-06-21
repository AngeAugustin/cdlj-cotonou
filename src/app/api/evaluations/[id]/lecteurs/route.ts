import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";
import { canManageEvaluations, canViewEvaluations, isDirectionSpirituelle } from "@/lib/rolePermissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!canViewEvaluations(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new EvaluationService();

    if (isDirectionSpirituelle(roles) && !canManageEvaluations(roles)) {
      const evaluation = await service.getEvaluationDetails(id);
      if (!evaluation) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
      if (!evaluation.publiee) {
        return NextResponse.json({ error: "Évaluation non publiée" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(_request.url);
    const vicariatId = searchParams.get("vicariatId") ?? undefined;
    const paroisseId = searchParams.get("paroisseId") ?? undefined;

    const result = await service.getEvaluationReaders(id, { vicariatId: vicariatId || undefined, paroisseId: paroisseId || undefined });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
