import { z } from "zod";

export const createAssembleeGeneraleSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  date: z.string().min(1, "La date est requise"),
  lieu: z.string().min(1, "Le lieu est requis"),
  image: z.string().optional(),
});

export const updateAssembleeGeneraleSchema = createAssembleeGeneraleSchema.partial();

export type CreateAssembleeGeneraleInput = z.infer<typeof createAssembleeGeneraleSchema>;
export type UpdateAssembleeGeneraleInput = z.infer<typeof updateAssembleeGeneraleSchema>;

export const upsertAssembleeRapportSchema = z.object({
  fileUrl: z.string().min(1),
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
  // Utilisé uniquement si le rapport n'est associé à aucun vicariat
  // (ex: mention "DIOCESAIN" pour qu'il soit visible par tous).
  vicariatMention: z.string().optional(),
});

export type UpsertAssembleeRapportInput = z.infer<typeof upsertAssembleeRapportSchema>;

