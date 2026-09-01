import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canTerminateEvaluations } from "@/lib/rolePermissions";
import { EvaluationService } from "@/modules/evaluations/service";

/** Recalcule moyennes et décisions pour toutes les évaluations terminées (règle >= 12). */
export async function PATCH() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!canTerminateEvaluations(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const service = new EvaluationService();
    const result = await service.recalculateAllTerminatedDecisions();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
