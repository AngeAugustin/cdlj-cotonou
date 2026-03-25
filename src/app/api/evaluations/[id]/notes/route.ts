import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";
import { upsertEvaluationNoteSchema } from "@/modules/evaluations/schema";

function isEvaluationManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const evaluationId = (await params).id;
    const body = await request.json();
    const validated = upsertEvaluationNoteSchema.parse(body);

    const service = new EvaluationService();
    const result = await service.upsertNote(evaluationId, validated);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

