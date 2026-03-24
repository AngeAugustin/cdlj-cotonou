import { z } from "zod";

export const createGradeSchema = z.object({
  name: z.string().min(2, "Le nom du grade doit faire au moins 2 caractères"),
  level: z.coerce.number().int().min(0, "Le niveau doit être un entier positif"),
  abbreviation: z.string().min(1, "L'abréviation est requise"),
});

export const updateGradeSchema = createGradeSchema.partial();

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
