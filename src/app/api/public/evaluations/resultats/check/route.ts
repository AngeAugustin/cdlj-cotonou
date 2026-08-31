import { NextResponse } from "next/server";
import { z } from "zod";
import { EvaluationService } from "@/modules/evaluations/service";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le numéro lecteur est requis."),
});

export async function POST(request: Request) {
  try {
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

    if (!check.hasResult) {
      return NextResponse.json({
        found: true,
        lecteur: check.lecteur,
        hasResult: false,
        paid: false,
        message: "Aucun résultat publié pour l'année en cours.",
      });
    }

    return NextResponse.json({
      found: true,
      lecteur: check.lecteur,
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
