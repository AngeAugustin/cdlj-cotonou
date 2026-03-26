import { NextResponse } from "next/server";
import { z } from "zod";
import { ActiviteService } from "@/modules/activites/service";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le matricule du lecteur est requis."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ActiviteService();
    const activite = await service.getActivite(id);

    if (!activite || activite.terminee) {
      return NextResponse.json({ error: "Activité introuvable ou indisponible." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
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
