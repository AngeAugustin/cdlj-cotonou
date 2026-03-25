import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";

function isAssembleeManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!isAssembleeManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new AssembleeGeneraleService();
    const result = await service.marquerTerminee(id);

    if (!result) return NextResponse.json({ error: "Assemblée générale introuvable" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

