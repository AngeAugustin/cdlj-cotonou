import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";

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
    const { searchParams } = new URL(_request.url);
    const vicariatId = searchParams.get("vicariatId") ?? undefined;
    const paroisseId = searchParams.get("paroisseId") ?? undefined;

    const service = new EvaluationService();
    const result = await service.getEvaluationReaders(id, { vicariatId: vicariatId || undefined, paroisseId: paroisseId || undefined });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

