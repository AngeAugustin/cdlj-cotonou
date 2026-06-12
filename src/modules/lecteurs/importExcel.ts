import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { NIVEAU_SCOLAIRE_OPTIONS } from "./schema";

export const LECTEUR_IMPORT_COLUMNS = [
  { key: "nom", header: "Nom", required: true },
  { key: "prenoms", header: "Prénoms", required: true },
  { key: "dateNaissance", header: "Date de naissance", required: true },
  { key: "sexe", header: "Sexe", required: true },
  { key: "grade", header: "Grade", required: false },
  { key: "anneeAdhesion", header: "Année d'adhésion", required: false },
  { key: "niveau", header: "Niveau scolaire ou professionnel", required: true },
  { key: "details", header: "Situation professionnelle", required: false },
  { key: "contact", header: "Contact", required: false },
  { key: "contactUrgence", header: "Contact d'urgence", required: false },
  { key: "adresse", header: "Adresse", required: true },
  { key: "maux", header: "Maux particuliers", required: false },
] as const;

export type LecteurImportRow = {
  nom: string;
  prenoms: string;
  dateNaissance: string;
  sexe: "M" | "F";
  grade?: string;
  anneeAdhesion?: number;
  niveau: string;
  details?: string;
  contact?: string;
  contactUrgence?: string;
  adresse: string;
  maux?: string;
};

export type LecteurImportParseResult =
  | { ok: true; rows: LecteurImportRow[] }
  | { ok: false; error: string };

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const HEADER_MAP: Record<string, keyof LecteurImportRow> = {
  nom: "nom",
  prenoms: "prenoms",
  prenom: "prenoms",
  "date de naissance": "dateNaissance",
  "date naissance": "dateNaissance",
  sexe: "sexe",
  grade: "grade",
  "annee d'adhesion": "anneeAdhesion",
  "annee adhesion": "anneeAdhesion",
  "niveau scolaire ou professionnel": "niveau",
  niveau: "niveau",
  "situation professionnelle": "details",
  details: "details",
  contact: "contact",
  "contact d'urgence": "contactUrgence",
  "contact urgence": "contactUrgence",
  adresse: "adresse",
  "maux particuliers": "maux",
  maux: "maux",
};

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).trim();
}

export function parseExcelDate(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  const text = cellToString(value);
  if (!text) return null;

  const dmY = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (dmY) {
    const day = Number(dmY[1]);
    const month = Number(dmY[2]);
    const year = Number(dmY[3]);
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  const asDate = new Date(text);
  if (!Number.isNaN(asDate.getTime())) {
    const y = asDate.getFullYear();
    const m = String(asDate.getMonth() + 1).padStart(2, "0");
    const d = String(asDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

function parseSexe(value: unknown): "M" | "F" | null {
  const raw = cellToString(value).toUpperCase();
  if (!raw) return null;
  if (raw === "M" || raw === "MASCULIN" || raw === "H" || raw === "HOMME") return "M";
  if (raw === "F" || raw === "FEMININ" || raw === "FÉMININ" || raw === "FEMME") return "F";
  return null;
}

function parseAnnee(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const text = cellToString(value);
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function resolveNiveau(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if ((NIVEAU_SCOLAIRE_OPTIONS as readonly string[]).includes(trimmed)) return trimmed;
  const norm = normalizeHeader(trimmed);
  return NIVEAU_SCOLAIRE_OPTIONS.find((n) => normalizeHeader(n) === norm) ?? null;
}

function excelColumnLetter(colIndex1Based: number): string {
  let n = colIndex1Based;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const TEMPLATE_DATA_ROWS = 500;

function isRowEmpty(values: Record<string, unknown>): boolean {
  const keys = ["nom", "prenoms", "contact", "adresse"] as const;
  return keys.every((k) => !cellToString(values[k]));
}

export function parseLecteurImportWorkbook(buffer: ArrayBuffer): LecteurImportParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    return { ok: false, error: "Fichier Excel illisible." };
  }

  const sheetName =
    workbook.SheetNames.find((n) => normalizeHeader(n) === "lecteurs") ?? workbook.SheetNames[0];
  if (!sheetName) return { ok: false, error: "Aucune feuille trouvée dans le fichier." };

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (!matrix.length) return { ok: false, error: "Le fichier est vide." };

  const headerRow = matrix[0];
  if (!Array.isArray(headerRow)) return { ok: false, error: "En-têtes invalides." };

  const columnIndex: Partial<Record<keyof LecteurImportRow, number>> = {};
  headerRow.forEach((cell, index) => {
    const key = HEADER_MAP[normalizeHeader(cellToString(cell))];
    if (key) columnIndex[key] = index;
  });

  const requiredKeys = LECTEUR_IMPORT_COLUMNS.filter((c) => c.required).map((c) => c.key);
  const missing = requiredKeys.filter((k) => columnIndex[k] === undefined);
  if (missing.length) {
    const labels = missing
      .map((k) => LECTEUR_IMPORT_COLUMNS.find((c) => c.key === k)?.header ?? k)
      .join(", ");
    return { ok: false, error: `Colonnes obligatoires manquantes : ${labels}.` };
  }

  const rows: LecteurImportRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i];
    if (!Array.isArray(line)) continue;

    const raw: Record<string, unknown> = {};
    for (const col of LECTEUR_IMPORT_COLUMNS) {
      const idx = columnIndex[col.key];
      raw[col.key] = idx === undefined ? "" : line[idx];
    }

    if (isRowEmpty(raw)) continue;

    const dateNaissance = parseExcelDate(raw.dateNaissance);
    if (!dateNaissance) {
      return { ok: false, error: `Ligne ${i + 1} : date de naissance invalide.` };
    }

    const sexe = parseSexe(raw.sexe);
    if (!sexe) {
      return { ok: false, error: `Ligne ${i + 1} : sexe invalide (utilisez M ou F).` };
    }

    const anneeAdhesionText = cellToString(raw.anneeAdhesion);
    const anneeAdhesion = parseAnnee(raw.anneeAdhesion);
    if (anneeAdhesionText && anneeAdhesion == null) {
      return { ok: false, error: `Ligne ${i + 1} : année d'adhésion invalide.` };
    }

    const nom = cellToString(raw.nom);
    const prenoms = cellToString(raw.prenoms);
    const niveauRaw = cellToString(raw.niveau);
    const niveau = resolveNiveau(niveauRaw);
    const contact = cellToString(raw.contact);
    const contactUrgence = cellToString(raw.contactUrgence);
    const adresse = cellToString(raw.adresse);

    if (!nom || !prenoms || !niveauRaw || !adresse) {
      return { ok: false, error: `Ligne ${i + 1} : champs obligatoires incomplets.` };
    }

    if (!niveau) {
      return {
        ok: false,
        error: `Ligne ${i + 1} : niveau scolaire invalide (« ${niveauRaw} »). Choisissez une valeur de la liste.`,
      };
    }

    rows.push({
      nom,
      prenoms,
      dateNaissance,
      sexe,
      grade: cellToString(raw.grade) || undefined,
      anneeAdhesion: anneeAdhesion ?? undefined,
      niveau,
      details: cellToString(raw.details) || undefined,
      contact: contact || undefined,
      contactUrgence: contactUrgence || undefined,
      adresse,
      maux: cellToString(raw.maux) || undefined,
    });
  }

  if (!rows.length) {
    return { ok: false, error: "Aucune ligne de lecteur à importer." };
  }

  return { ok: true, rows };
}

export async function buildLecteurImportTemplateWorkbook(
  grades: Array<{ name: string; abbreviation: string }>
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  const wsRef = wb.addWorksheet("Référence");
  wsRef.getCell("A1").value = "Niveaux scolaires ou professionnels acceptés";
  NIVEAU_SCOLAIRE_OPTIONS.forEach((n, i) => {
    wsRef.getCell(`A${i + 2}`).value = n;
  });
  const niveauLastRow = NIVEAU_SCOLAIRE_OPTIONS.length + 1;

  const gradeStartRow = niveauLastRow + 2;
  wsRef.getCell(`A${gradeStartRow}`).value = "Grades (nom ou abréviation — optionnel)";
  wsRef.getCell(`A${gradeStartRow + 1}`).value = "Nom";
  wsRef.getCell(`B${gradeStartRow + 1}`).value = "Abréviation";
  grades.forEach((g, i) => {
    wsRef.getCell(`A${gradeStartRow + 2 + i}`).value = g.name;
    wsRef.getCell(`B${gradeStartRow + 2 + i}`).value = g.abbreviation;
  });
  wsRef.getColumn(1).width = 42;
  wsRef.getColumn(2).width = 16;

  const ws = wb.addWorksheet("Lecteurs");
  const headerRow = ws.addRow(LECTEUR_IMPORT_COLUMNS.map((c) => c.header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFEF3C7" },
    };
  });

  const niveauColIndex =
    LECTEUR_IMPORT_COLUMNS.findIndex((c) => c.key === "niveau") + 1;
  const niveauCol = excelColumnLetter(niveauColIndex);

  type WorksheetWithValidations = ExcelJS.Worksheet & {
    dataValidations: {
      add: (sqref: string, validation: Record<string, unknown>) => void;
    };
  };

  (ws as WorksheetWithValidations).dataValidations.add(
    `${niveauCol}2:${niveauCol}${TEMPLATE_DATA_ROWS + 1}`,
    {
      type: "list",
      allowBlank: true,
      formulae: [`'Référence'!$A$2:$A$${niveauLastRow}`],
      showErrorMessage: true,
      errorTitle: "Niveau invalide",
      error: "Sélectionnez un niveau dans la liste déroulante.",
      showInputMessage: true,
      promptTitle: "Niveau scolaire",
      prompt: "Choisissez un niveau dans la liste (onglet Référence).",
    }
  );

  ws.columns = LECTEUR_IMPORT_COLUMNS.map((c) => ({
    width: c.key === "adresse" ? 36 : c.key === "niveau" ? 34 : 18,
  }));
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const wsInstr = wb.addWorksheet("Instructions");
  wsInstr.addRows([
    ["Instructions"],
    ["1. Remplissez une ligne par lecteur dans l'onglet « Lecteurs »."],
    ["2. Le vicariat et la paroisse sont choisis lors de l'import dans l'application."],
    ["3. Date de naissance : JJ/MM/AAAA ou AAAA-MM-JJ."],
    ["4. Sexe : M (masculin) ou F (féminin)."],
    ["5. Niveau scolaire : utilisez la liste déroulante dans la colonne dédiée."],
    ["6. Grade : nom ou abréviation (voir onglet Référence), laisser vide si aucun."],
    ["7. Les photos ne sont pas importées via Excel ; complétez-les ensuite dans chaque fiche."],
  ]);
  wsInstr.getColumn(1).width = 88;

  return wb;
}

export async function downloadLecteurImportTemplate(
  grades: Array<{ name: string; abbreviation: string }>
) {
  const wb = await buildLecteurImportTemplateWorkbook(grades);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "template-import-lecteurs.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}
