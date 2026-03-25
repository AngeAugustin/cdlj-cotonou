import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";
import { createEvaluationSchema } from "@/modules/evaluations/schema";

function isEvaluationManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const service = new EvaluationService();
    return NextResponse.json(await service.getEvaluations());
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = session.user.roles ?? [];
    if (!isEvaluationManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const validated = createEvaluationSchema.parse(body);

    const service = new EvaluationService();
    const created = await service.createEvaluation(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

