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
    const payload = await service.getPublicLecteurResultForYear(parsed.data.uniqueId);

    if (!payload) {
      return NextResponse.json(
        {
          found: false,
          message: "Aucun lecteur trouvé avec ce numéro.",
        },
        { status: 404 }
      );
    }

    if (!payload.result) {
      return NextResponse.json({
        found: true,
        lecteur: payload.lecteur,
        result: null,
        message: "Aucun résultat publié pour l'année en cours.",
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
