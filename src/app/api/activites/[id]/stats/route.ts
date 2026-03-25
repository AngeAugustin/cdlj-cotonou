import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";

function isActiviteManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const vicariatFilter = searchParams.get("vicariatId") || undefined;

    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

    if (roles.includes("VICARIAL")) {
      const vid = session.user.vicariatId;
      if (!vid) return NextResponse.json({ error: "Vicariat non défini pour ce compte" }, { status: 400 });
      const stats = await service.getStats(id, vid);
      return NextResponse.json(stats);
    }

    if (isActiviteManager(roles)) {
      const stats = await service.getStats(id, vicariatFilter ?? null);
      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
