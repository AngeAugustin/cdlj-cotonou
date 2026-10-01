import { NextResponse } from "next/server";
import { z } from "zod";
import { EvaluationService } from "@/modules/evaluations/service";
import connectToDatabase from "@/lib/mongoose";
import { Lecteur } from "@/modules/lecteurs/model";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le numéro lecteur est requis."),
});

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`resultats:get:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
    }

    const service = new EvaluationService();
    const payload = await service.getPublicLecteurResultForYear(parsed.data.uniqueId);

    if (!payload) {
      return NextResponse.json(
        { found: false, message: "Aucun lecteur trouvé avec ce numéro." },
        { status: 404 }
      );
    }

    if (!payload.result) {
      return NextResponse.json({
        found: true,
        lecteur: { uniqueId: payload.lecteur.uniqueId },
        result: null,
        message: "Aucun résultat publié pour l'année en cours.",
      });
    }

    await connectToDatabase();
    const lecteur = await Lecteur.findOne({ uniqueId: parsed.data.uniqueId.trim().toUpperCase() })
      .select("_id")
      .lean();
    if (!lecteur) {
      return NextResponse.json(
        { found: false, message: "Aucun lecteur trouvé avec ce numéro." },
        { status: 404 }
      );
    }

    const paid = await service.hasApprovedResultConsultationPayment(
      String(lecteur._id),
      payload.result.annee
    );

    if (!paid) {
      return NextResponse.json({
        found: true,
        lecteur: { uniqueId: payload.lecteur.uniqueId },
        result: null,
        paymentRequired: true,
        message: "Le paiement de consultation est requis pour afficher le résultat.",
      });
    }

    return NextResponse.json({
      found: true,
      lecteur: payload.lecteur,
      result: payload.result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
