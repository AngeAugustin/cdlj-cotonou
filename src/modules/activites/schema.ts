import { z } from "zod";
import { validateGrillePenalite } from "./penalites";

export const palierPenaliteSchema = z.object({
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  montantSupplementaire: z.coerce.number().min(0, "Montant invalide"),
});

const activiteBaseSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  dateDebut: z.string().min(1),
  dateFin: z.string().min(1),
  lieu: z.string().min(1, "Le lieu est requis"),
  montant: z.coerce.number().min(0),
  delaiPaiement: z.string().min(1),
  grillePenalite: z.array(palierPenaliteSchema).optional().default([]),
  image: z.string().optional(),
});

export const createActiviteSchema = activiteBaseSchema.superRefine((data, ctx) => {
  const err = validateGrillePenalite(data.delaiPaiement, data.grillePenalite ?? []);
  if (err) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ["grillePenalite"] });
  }
});

export const updateActiviteSchema = activiteBaseSchema.partial();

export type CreateActiviteInput = z.infer<typeof createActiviteSchema>;
export type UpdateActiviteInput = z.infer<typeof updateActiviteSchema>;

export const payerParticipationSchema = z.object({
  lecteurIds: z.array(z.string().min(1)).min(1, "Sélectionnez au moins un lecteur"),
  paroisseId: z.string().min(1, "Sélectionnez une paroisse"),
});
