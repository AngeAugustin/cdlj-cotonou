import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import {
  assertParoisseInVicariat,
  listParoisseIdsForVicariat,
} from "@/lib/activiteEnrollmentScope";

function isActiviteManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: {
        roles?: string[];
        parishId?: string;
        vicariatId?: string;
      };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paroisseIdParam = searchParams.get("paroisseId") || undefined;

    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

    if (roles.includes("PAROISSIAL")) {
      const pid = session.user.parishId;
      if (!pid) return NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 });
      const rows = await service.listParticipantsDetail(id, { paroisseId: pid });
      return NextResponse.json(rows);
    }

    if (roles.includes("VICARIAL")) {
      const vid = session.user.vicariatId;
      if (!vid) return NextResponse.json({ error: "Vicariat non défini pour ce compte" }, { status: 400 });

      if (paroisseIdParam) {
        const inScope = await assertParoisseInVicariat(paroisseIdParam, vid);
        if (!inScope) {
          return NextResponse.json({ error: "Cette paroisse n'appartient pas à votre vicariat" }, { status: 403 });
        }
        const rows = await service.listParticipantsDetail(id, { paroisseId: paroisseIdParam });
        return NextResponse.json(rows);
      }

      const paroisseIds = await listParoisseIdsForVicariat(vid);
      const rows = await service.listParticipantsDetail(id, { paroisseIds });
      return NextResponse.json(rows);
    }

    if (isActiviteManager(roles) && paroisseIdParam) {
      const rows = await service.listParticipantsDetail(id, { paroisseId: paroisseIdParam });
      return NextResponse.json(rows);
    }

    if (isActiviteManager(roles) && !paroisseIdParam) {
      const rows = await service.listParticipantsDetail(id);
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Utilisez le paiement FedaPay : POST /api/activites/[id]/pay/init depuis la page Participer.",
    },
    { status: 403 }
  );
}
