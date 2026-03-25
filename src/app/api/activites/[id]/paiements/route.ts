import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";

function isManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string; vicariatId?: string };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const { id: activiteId } = await params;

    const service = new ActiviteService();
    const activite = await service.getActivite(activiteId);
    if (!activite) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

    let rows;

    if (roles.includes("PAROISSIAL")) {
      const pid = session.user.parishId;
      if (!pid) return NextResponse.json({ error: "Paroisse non définie" }, { status: 400 });
      rows = await service.listPaiementsForActivite(activiteId, { paroisseId: pid });
    } else if (roles.includes("VICARIAL")) {
      const vid = session.user.vicariatId;
      if (!vid) return NextResponse.json({ error: "Vicariat non défini" }, { status: 400 });
      await connectToDatabase();
      const plist = await Paroisse.find({ vicariatId: vid }).select("_id").lean();
      const paroisseIds = plist.map((p) => p._id.toString());
      rows = await service.listPaiementsForActivite(activiteId, { paroisseIds });
    } else if (isManager(roles)) {
      rows = await service.listPaiementsForActivite(activiteId);
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
