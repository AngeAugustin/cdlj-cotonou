import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";
import { updateEvaluationSchema } from "@/modules/evaluations/schema";

function isEvaluationManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new EvaluationService();
    const evaluation = await service.getEvaluationDetails(id);
    if (!evaluation) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    return NextResponse.json(evaluation);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const validated = updateEvaluationSchema.parse(body);

    const service = new EvaluationService();
    const updated = await service.updateEvaluation(id, validated);
    if (!updated) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new EvaluationService();
    const ok = await service.deleteEvaluation(id);
    if (!ok) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

