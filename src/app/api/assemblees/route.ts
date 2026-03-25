import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";
import { createAssembleeGeneraleSchema } from "@/modules/assemblees/schema";

function isAssembleeManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

function canViewAssemblees(roles: string[]) {
  return roles.includes("VICARIAL") || roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!canViewAssemblees(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const service = new AssembleeGeneraleService();
    return NextResponse.json(await service.getAssemblees());
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

    const roles: string[] = session.user.roles ?? [];
    if (!isAssembleeManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const validated = createAssembleeGeneraleSchema.parse(body);

    const service = new AssembleeGeneraleService();
    const result = await service.createAssemblee(validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

