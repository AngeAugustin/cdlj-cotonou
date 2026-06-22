import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import {
  assertParoisseInVicariat,
  listParoisseIdsForVicariat,
} from "@/lib/activiteEnrollmentScope";
import { isDioceseScopeReader } from "@/lib/rolePermissions";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";

type ParticipantScope = {
  paroisseId?: string;
  paroisseIds?: string[];
  forCards?: boolean;
};

function serializeParticipantRows(rows: unknown[], forCards: boolean) {
  if (!forCards) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const r = row as Record<string, unknown>;
    const lecteur = r.lecteur;
    return {
      ...r,
      lecteur: lecteur ? serializeLecteur(lecteur) : lecteur,
    };
  });
}

async function listScopedParticipants(service: ActiviteService, activiteId: string, scope: ParticipantScope) {
  const rows = await service.listParticipantsDetail(activiteId, scope);
  return serializeParticipantRows(rows as unknown[], Boolean(scope.forCards));
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
    const forCards = searchParams.get("cards") === "1";

    if (forCards && !roles.includes("VICARIAL") && !isDioceseScopeReader(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

    const cardScope = forCards ? { forCards: true as const } : {};

    if (roles.includes("PAROISSIAL")) {
      const pid = session.user.parishId;
      if (!pid) return NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 });
      const rows = await listScopedParticipants(service, id, { paroisseId: pid, ...cardScope });
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
        const rows = await listScopedParticipants(service, id, { paroisseId: paroisseIdParam, ...cardScope });
        return NextResponse.json(rows);
      }

      const paroisseIds = await listParoisseIdsForVicariat(vid);
      const rows = await listScopedParticipants(service, id, { paroisseIds, ...cardScope });
      return NextResponse.json(rows);
    }

    if (isDioceseScopeReader(roles) && paroisseIdParam) {
      const rows = await listScopedParticipants(service, id, { paroisseId: paroisseIdParam, ...cardScope });
      return NextResponse.json(rows);
    }

    if (isDioceseScopeReader(roles) && !paroisseIdParam) {
      const rows = await listScopedParticipants(service, id, cardScope);
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
    { error: "Utilisez l'endpoint de paiement pour inscrire des lecteurs" },
    { status: 405 }
  );
}
