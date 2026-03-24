import { z } from "zod";

export const createLecteurSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Les prénoms doivent contenir au moins 2 caractères"),
  dateNaissance: z.coerce.date(),
  sexe: z.enum(["M", "F"]),
  gradeId: z.string().optional(),
  anneeAdhesion: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  niveau: z.string().min(1, "Le niveau est requis"),
  details: z.string().optional(),
  contact: z.string().min(8, "Numéro de contact invalide"),
  contactUrgence: z.string().min(8, "Numéro de contact d'urgence invalide"),
  adresse: z.string().min(5, "L'adresse est requise"),
  maux: z.string().optional(),
  photo: z.string().url().optional(),
  vicariatId: z.string().min(24, "ID du vicariat invalide"),
  paroisseId: z.string().min(24, "ID de la paroisse invalide"),
});

export const updateLecteurSchema = createLecteurSchema.partial();
export type CreateLecteurInput = z.infer<typeof createLecteurSchema>;
export type UpdateLecteurInput = z.infer<typeof updateLecteurSchema>;
