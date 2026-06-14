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

export const NIVEAU_SCOLAIRE_OPTIONS = [
  "CI",
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Doctorat",
] as const;

export type NiveauScolaire = (typeof NIVEAU_SCOLAIRE_OPTIONS)[number];

const emptyToUndefined = (v: unknown) => {
  if (v == null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  if (typeof v === "number" && Number.isNaN(v)) return undefined;
  return v;
};

export const optionalAnneeAdhesionField = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional()
);

export const optionalPhoneField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((v) => v.length >= 8, { message: "Numéro de contact invalide" })
    .optional()
);

export const optionalUrgencePhoneField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((v) => v.length >= 8, { message: "Numéro de contact d'urgence invalide" })
    .optional()
);

export const optionalNiveauField = z.preprocess(
  emptyToUndefined,
  z.enum(NIVEAU_SCOLAIRE_OPTIONS, { message: "Niveau invalide" }).optional()
);

export const optionalAdresseField = z.preprocess(
  emptyToUndefined,
  z.string().min(5, "L'adresse doit contenir au moins 5 caractères").optional()
);

export const createLecteurSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Les prénoms doivent contenir au moins 2 caractères"),
  dateNaissance: z.coerce.date(),
  sexe: z.enum(["M", "F"]),
  gradeId: z.string().min(24, "Le grade est requis"),
  anneeAdhesion: optionalAnneeAdhesionField,
  niveau: optionalNiveauField,
  details: z.string().optional(),
  contact: optionalPhoneField,
  contactUrgence: optionalUrgencePhoneField,
  adresse: optionalAdresseField,
  maux: z.string().optional(),
  photo: optionalUrl,
  photoIdentite: optionalUrl,
  vicariatId: z.string().min(24, "ID du vicariat invalide"),
  paroisseId: z.string().min(24, "ID de la paroisse invalide"),
});

export const updateLecteurSchema = createLecteurSchema.partial();

/** Validation d'une ligne Excel avant création en base. */
export const lecteurImportRowSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  dateNaissance: z.string().min(1),
  sexe: z.enum(["M", "F"]),
  grade: z.string().min(1, "Le grade est requis"),
  anneeAdhesion: optionalAnneeAdhesionField,
  niveau: optionalNiveauField,
  details: z.string().optional(),
  contact: optionalPhoneField,
  contactUrgence: optionalUrgencePhoneField,
  adresse: optionalAdresseField,
  maux: z.string().optional(),
});

export type CreateLecteurInput = z.infer<typeof createLecteurSchema>;
export type UpdateLecteurInput = z.infer<typeof updateLecteurSchema>;
export type LecteurImportRowInput = z.infer<typeof lecteurImportRowSchema>;
