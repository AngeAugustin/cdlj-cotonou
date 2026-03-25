import { absolutePublicUrl } from "@/lib/mediaUrl";

export type GradeRef = { _id: string; name: string; abbreviation?: string };
export type ParishRef = { _id: string; name: string };
export type VicariatRef = { _id: string; name: string; abbreviation?: string };

export type ApiLecteur = {
  _id: string;
  nom: string;
  prenoms: string;
  uniqueId: string;
  dateNaissance?: string;
  sexe: "M" | "F";
  gradeId?: GradeRef | string | null;
  anneeAdhesion: number;
  niveau: string;
  details?: string;
  contact: string;
  contactUrgence: string;
  adresse: string;
  maux?: string;
  photo?: string;
  photoIdentite?: string;
  vicariatId?: VicariatRef | string;
  paroisseId?: ParishRef | string;
};

export type ParticipationRow = {
  paidAt: string;
  activite: {
    _id: string;
    nom: string;
    dateDebut: string;
    dateFin: string;
    lieu: string;
    terminee: boolean;
    montant?: number;
  } | null;
};

export function lecteurPhotoIdentiteUrl(l: ApiLecteur | null | undefined): string | undefined {
  if (!l) return undefined;
  const main = typeof l.photoIdentite === "string" ? l.photoIdentite.trim() : "";
  if (main) return main;
  const legacy = (l as { photo_identite?: string }).photo_identite;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  return undefined;
}

export function lecteurAvatarUrl(l: ApiLecteur): string | undefined {
  const p = typeof l.photo === "string" ? l.photo.trim() : "";
  if (p) return p;
  return lecteurPhotoIdentiteUrl(l);
}

export function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "_id" in (v as object)) return String((v as { _id: unknown })._id);
  return "";
}

export function gradeLabel(l: ApiLecteur): string {
  const g = l.gradeId;
  if (g && typeof g === "object" && "name" in g) return g.name;
  return "—";
}

/** Minuit local pour le jour civil (année, mois 1–12, jour) — cohérent avec <input type="date">. */
function localMidnightCalendar(y: number, monthIndex: number, day: number): Date | null {
  const d = new Date(y, monthIndex, day);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== y || d.getMonth() !== monthIndex || d.getDate() !== day) return null;
  return d;
}

/**
 * Interprète une date de naissance pour l’affichage / l’âge.
 * Les chaînes `AAAA-MM-JJ` (champ date HTML ou préfixe d’une ISO) sont lues en **calendrier local**,
 * pas comme minuit UTC (sinon décalage d’un jour et âge faux selon le fuseau).
 */
export function parseBirthDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return localMidnightCalendar(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return localMidnightCalendar(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (ymd) {
      const y = Number(ymd[1]);
      const mo = Number(ymd[2]) - 1;
      const day = Number(ymd[3]);
      const cal = localMidnightCalendar(y, mo, day);
      if (cal) return cal;
    }
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      return localMidnightCalendar(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      const year = Number(m[3]);
      return localMidnightCalendar(year, month, day);
    }
    return null;
  }
  if (typeof value === "object" && value !== null && "$date" in value) {
    const inner = (value as { $date: unknown }).$date;
    if (typeof inner === "number" && Number.isFinite(inner)) return parseBirthDate(inner);
    return parseBirthDate(typeof inner === "string" ? inner : String(inner));
  }
  return null;
}

/**
 * Construit la Date envoyée à l’API depuis la valeur d’un `<input type="date">` (AAAA-MM-JJ),
 * en minuit **local** — même sémantique que parseBirthDate.
 */
export function dateFromDateInputString(ymd: string): Date {
  const trimmed = ymd.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) {
    const parsed = parseBirthDate(trimmed);
    return parsed ?? new Date(NaN);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = localMidnightCalendar(y, mo, day);
  return d ?? new Date(NaN);
}

/** Valeur `YYYY-MM-DD` pour un `<input type="date" />` (composantes locales du jour civil). */
export function toDateInputValue(v: string | Date | undefined): string {
  if (v == null || v === "") return "";
  const cal = typeof v === "string" ? parseBirthDate(v) : parseBirthDate(v);
  if (!cal) return "";
  const y = cal.getFullYear();
  const mo = String(cal.getMonth() + 1).padStart(2, "0");
  const day = String(cal.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Date persistée en base : midi UTC pour le jour civil (y, m, d) choisi par l’utilisateur.
 * Évite qu’un ISO `…T00:00:00.000Z` ne fasse apparaître la veille dans le préfixe AAAA-MM-JJ.
 */
export function toPersistedBirthDateUtcNoon(d: Date): Date {
  if (Number.isNaN(d.getTime())) return d;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0));
}

export function formatAgeLabel(value: unknown): string {
  const b = parseBirthDate(value);
  if (!b) return "—";
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  if (a < 0 || a > 130) return "—";
  return `${a} ans`;
}

export function ageYearsForCsv(value: unknown): string {
  const b = parseBirthDate(value);
  if (!b) return "";
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  if (a < 0 || a > 130) return "";
  return String(a);
}

/** Affichage date (naissance, activités, etc.) — préfère parseBirthDate pour tolérer plusieurs formats. */
export function formatDateFr(d: unknown): string {
  const parsed = parseBirthDate(d);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function rattachementLines(l: ApiLecteur): { vicariat: string; paroisse: string } {
  const vicariat =
    l.vicariatId && typeof l.vicariatId === "object" && "name" in l.vicariatId
      ? (l.vicariatId as VicariatRef).name
      : "—";
  const paroisse =
    l.paroisseId && typeof l.paroisseId === "object" && "name" in l.paroisseId
      ? (l.paroisseId as ParishRef).name
      : "—";
  return { vicariat, paroisse };
}

export function displayAvatarSrc(l: ApiLecteur): string | undefined {
  return absolutePublicUrl(lecteurAvatarUrl(l));
}

export function displayIdPhotoSrc(l: ApiLecteur): string | undefined {
  return absolutePublicUrl(lecteurPhotoIdentiteUrl(l));
}

export function lecteurInitials(l: ApiLecteur): string {
  return `${l.prenoms?.[0] ?? ""}${l.nom?.[0] ?? ""}`.toUpperCase() || "?";
}
