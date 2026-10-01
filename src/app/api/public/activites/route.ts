import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { canViewActivites } from "@/lib/rolePermissions";
import { presenceTokensEqual } from "@/lib/presenceAccess";

/**
 * Liste les activités ouvertes pour le scan de présence.
 * - Staff authentifié : toutes les activités ouvertes
 * - Anonyme : uniquement l’activité dont le token est fourni (?token=&id= ou header)
 */
export async function GET(request: Request) {
  try {
    const service = new ActiviteService();
    const session = await getServerSession(authOptions);
    const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];

    if (session?.user && canViewActivites(roles)) {
      const activites = await service.listOpenActivitesForPresence();
      return NextResponse.json(activites);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || searchParams.get("a")?.trim();
    const token =
      searchParams.get("token")?.trim() ||
      searchParams.get("t")?.trim() ||
      request.headers.get("x-presence-token")?.trim() ||
      "";

    if (!id || !token) {
      return NextResponse.json(
        {
          error:
            "Accès refusé. Connectez-vous ou ouvrez le lien / QR officiel de l’activité (?a=&t=).",
        },
        { status: 401 }
      );
    }

    const activite = await service.getActiviteWithPresenceToken(id);
    if (!activite || activite.terminee) {
      return NextResponse.json({ error: "Activité introuvable ou indisponible." }, { status: 404 });
    }

    const stored = typeof activite.presenceToken === "string" ? activite.presenceToken : "";
    if (!stored || !presenceTokensEqual(stored, token)) {
      return NextResponse.json({ error: "Jeton de présence invalide." }, { status: 401 });
    }

    return NextResponse.json([
      {
        _id: String(activite._id),
        nom: activite.nom,
        dateDebut: activite.dateDebut,
        dateFin: activite.dateFin,
        lieu: activite.lieu,
      },
    ]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
