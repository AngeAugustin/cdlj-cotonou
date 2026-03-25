import { z } from "zod";

export const createEvaluationSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  annee: z.coerce.number().int().min(1900).max(2100),
  gradeId: z.string().min(1, "Le grade est requis"),
  activiteId: z.string().min(1, "L'activité est requise"),
  nombreNotes: z.coerce.number().int().min(1).max(20),
});

export const updateEvaluationSchema = createEvaluationSchema.partial();

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

export const upsertEvaluationNoteSchema = z.object({
  lecteurId: z.string().min(1),
  noteIndex: z.coerce.number().int().min(1),
  valeur: z.coerce.number().min(0).max(20),
});

export type UpsertEvaluationNoteInput = z.infer<typeof upsertEvaluationNoteSchema>;

