import { z } from "zod";

export const createActiviteSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  dateDebut: z.string().min(1),
  dateFin: z.string().min(1),
  lieu: z.string().min(1, "Le lieu est requis"),
  montant: z.coerce.number().min(0),
  delaiPaiement: z.string().min(1),
  numeroPaiement: z.string().min(1, "Le numéro de paiement est requis"),
  image: z.string().optional(),
});

export const updateActiviteSchema = createActiviteSchema.partial();

export type CreateActiviteInput = z.infer<typeof createActiviteSchema>;
export type UpdateActiviteInput = z.infer<typeof updateActiviteSchema>;

export const payerParticipationSchema = z.object({
  lecteurIds: z.array(z.string().min(1)).min(1, "Sélectionnez au moins un lecteur"),
});
