import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { payerParticipationSchema } from "@/modules/activites/schema";

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
    const paroisseIdParam = searchParams.get("paroisseId") || undefined;

    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

    if (roles.includes("PAROISSIAL")) {
      const pid = session.user.parishId;
      if (!pid) return NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 });
      const rows = await service.listParticipantsDetail(id, pid);
      return NextResponse.json(rows);
    }

    if (isActiviteManager(roles) && paroisseIdParam) {
      const rows = await service.listParticipantsDetail(id, paroisseIdParam);
      return NextResponse.json(rows);
    }

    if (isActiviteManager(roles) && !paroisseIdParam) {
      const rows = await service.listParticipantsDetail(id);
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!roles.includes("PAROISSIAL")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pid = session.user.parishId;
    if (!pid) return NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 });

    const { id } = await params;
    const body = await request.json();
    const { lecteurIds } = payerParticipationSchema.parse(body);

    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    if (a.terminee) {
      return NextResponse.json({ error: "Cette activité est terminée" }, { status: 400 });
    }

    const count = await service.enregistrerPaiement(id, lecteurIds, pid);
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
