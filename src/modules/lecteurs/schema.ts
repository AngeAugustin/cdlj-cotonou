import { z } from "zod";

/** Accepte une URL http(s) ou un chemin d’app public (ex. `/uploads/…` renvoyé par l’API upload). */
function isValidImageRef(s: string): boolean {
  if (s.startsWith("/") && s.length > 1 && !s.includes("..")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null || v === "") return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  })
  .refine((v) => v === undefined || isValidImageRef(v), {
    message: "URL ou chemin d’image invalide",
  });

export const createLecteurSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Les prénoms doivent contenir au moins 2 caractères"),
  dateNaissance: z.coerce.date(),
  sexe: z.enum(["M", "F"]),
  gradeId: z
    .string()
    .optional()
    .transform((v) => (v && v.length >= 24 ? v : undefined)),
  anneeAdhesion: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  niveau: z.string().min(1, "Le niveau est requis"),
  details: z.string().optional(),
  contact: z.string().min(8, "Numéro de contact invalide"),
  contactUrgence: z.string().min(8, "Numéro de contact d'urgence invalide"),
  adresse: z.string().min(5, "L'adresse est requise"),
  maux: z.string().optional(),
  photo: optionalUrl,
  photoIdentite: optionalUrl,
  vicariatId: z.string().min(24, "ID du vicariat invalide"),
  paroisseId: z.string().min(24, "ID de la paroisse invalide"),
});

export const updateLecteurSchema = createLecteurSchema.partial();
export type CreateLecteurInput = z.infer<typeof createLecteurSchema>;
export type UpdateLecteurInput = z.infer<typeof updateLecteurSchema>;
