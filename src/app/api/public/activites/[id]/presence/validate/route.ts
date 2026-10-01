import { NextResponse } from "next/server";
import { z } from "zod";
import { ActiviteService } from "@/modules/activites/service";
import {
  authorizePresenceScan,
  extractPresenceToken,
} from "@/lib/presenceAccess";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le matricule du lecteur est requis."),
  token: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`presence:validate:${ip}`, { limit: 40, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const { id } = await params;
    const service = new ActiviteService();
    const activite = await service.getActiviteWithPresenceToken(id);

    if (!activite || activite.terminee) {
      return NextResponse.json({ error: "Activité introuvable ou indisponible." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
    }

    const providedToken = extractPresenceToken(request, parsed.data.token);
    const authz = await authorizePresenceScan(
      request,
      typeof activite.presenceToken === "string" ? activite.presenceToken : null,
      providedToken
    );
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const result = await service.validatePresenceByUniqueId(id, parsed.data.uniqueId);
    if (!result) {
      return NextResponse.json(
        {
          error: "Ce lecteur ne figure pas parmi les participants de cette activité.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      message:
        result.status === "already_present"
          ? "La présence de ce lecteur avait déjà été validée."
          : "Présence validée avec succès.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
