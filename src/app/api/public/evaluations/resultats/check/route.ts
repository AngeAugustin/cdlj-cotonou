import { NextResponse } from "next/server";
import { z } from "zod";
import { EvaluationService } from "@/modules/evaluations/service";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le numéro lecteur est requis."),
});

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`resultats:check:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
    }

    const service = new EvaluationService();
    const check = await service.checkPublicResultConsultation(parsed.data.uniqueId);

    if (!check) {
      return NextResponse.json(
        { found: false, message: "Aucun lecteur trouvé avec ce numéro." },
        { status: 404 }
      );
    }

    // Avant paiement : ne pas exposer nom / paroisse / vicariat.
    const lecteurPublic = check.paid
      ? check.lecteur
      : { uniqueId: check.lecteur.uniqueId };

    if (!check.hasResult) {
      return NextResponse.json({
        found: true,
        lecteur: lecteurPublic,
        hasResult: false,
        paid: false,
        message: "Aucun résultat publié pour l'année en cours.",
      });
    }

    return NextResponse.json({
      found: true,
      lecteur: lecteurPublic,
      hasResult: true,
      paid: check.paid,
      montant: check.montant,
      evaluationId: check.evaluationId,
      annee: check.annee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
