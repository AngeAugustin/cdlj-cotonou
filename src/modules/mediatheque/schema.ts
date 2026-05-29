import { z } from "zod";
import { MEDIATHEQUE_CATEGORIES } from "./constants";

const categoryEnum = z.enum(MEDIATHEQUE_CATEGORIES);

export const createMediathequeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  categorie: categoryEnum,
  mois: z.number().int().min(1).max(12),
  annee: z.number().int().min(2000).max(2100),
  coverImage: z.string().optional(),
  hostingLink: z.string().url("Lien d'hébergement invalide"),
  published: z.boolean().default(false),
});

export const updateMediathequeSchema = createMediathequeSchema.partial();

export type CreateMediathequeInput = z.infer<typeof createMediathequeSchema>;
export type UpdateMediathequeInput = z.infer<typeof updateMediathequeSchema>;
