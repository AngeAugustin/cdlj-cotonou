import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";

function isActiviteManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user?.roles ?? [];
    if (!isActiviteManager(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const service = new ActiviteService();
    const activite = await service.getActivite(id);

    if (!activite) {
      return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    }

    const rows = await service.listValidatedPresencesDetail(id);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
