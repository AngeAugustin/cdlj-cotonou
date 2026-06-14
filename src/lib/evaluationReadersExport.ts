import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

export type EvaluationExportMeta = {
  _id: string;
  nom: string;
  annee: number;
  nombreNotes: number;
  terminee: boolean;
  publiee: boolean;
};

export type EvaluationReaderExportRow = {
  _id: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    sexe: "M" | "F";
    dateNaissance?: string;
    anneeAdhesion?: number;
    niveau?: string;
    details?: string;
    contact?: string;
    contactUrgence?: string;
    adresse?: string;
    maux?: string;
    gradeIdAtEvaluation?: { name: string; abbreviation: string };
  };
  vicariat?: { name: string; abbreviation: string };
  paroisse?: { name: string };
  notes: Array<{ noteIndex: number; valeur?: number; validated: boolean }>;
  moyenne?: number;
  decision?: "PROMU" | "MAINTENU" | string;
};

function formatBirthDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy", { locale: fr });
}

function formatSexe(sexe: "M" | "F") {
  return sexe === "M" ? "M" : sexe === "F" ? "F" : String(sexe);
}

function formatDecision(d?: string) {
  if (!d) return "—";
  if (d === "PROMU") return "Promu";
  if (d === "MAINTENU") return "Maintenu";
  return String(d);
}

function formatNoteValue(valeur?: number, validated?: boolean) {
  if (!validated || valeur === undefined) return "—";
  return valeur.toFixed(1);
}

function safeExportFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim().slice(0, 48) || "evaluation";
}

export function buildEvaluationReadersExportTable(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[]
) {
  const noteHeaders = Array.from({ length: evaluation.nombreNotes }, (_, i) => `Note ${i + 1}`);
  const header = [
    "Matricule",
    "Nom",
    "Prénoms",
    "Date de naissance",
    "Sexe",
    "Vicariat",
    "Paroisse",
    "Grade (évaluation)",
    "Année d'adhésion",
    "Niveau scolaire ou professionnel",
    "Situation professionnelle",
    "Contact",
    "Contact d'urgence",
    "Adresse",
    "Maux particuliers",
    ...noteHeaders,
    "Moyenne",
    "Décision",
  ];

  const rows = members.map((row) => {
    const notesByIndex = new Map(row.notes.map((n) => [n.noteIndex, n]));
    const noteValues = Array.from({ length: evaluation.nombreNotes }, (_, i) => {
      const slot = notesByIndex.get(i + 1);
      return formatNoteValue(slot?.valeur, slot?.validated);
    });

    return [
      row.lecteur.uniqueId,
      row.lecteur.nom,
      row.lecteur.prenoms,
      formatBirthDate(row.lecteur.dateNaissance),
      formatSexe(row.lecteur.sexe),
      row.vicariat?.name ?? "—",
      row.paroisse?.name ?? "—",
      row.lecteur.gradeIdAtEvaluation?.name ?? row.lecteur.gradeIdAtEvaluation?.abbreviation ?? "—",
      row.lecteur.anneeAdhesion ?? "—",
      row.lecteur.niveau ?? "—",
      row.lecteur.details ?? "—",
      row.lecteur.contact ?? "—",
      row.lecteur.contactUrgence ?? "—",
      row.lecteur.adresse ?? "—",
      row.lecteur.maux ?? "—",
      ...noteValues,
      row.moyenne !== undefined ? row.moyenne.toFixed(2) : "—",
      formatDecision(row.decision),
    ];
  });

  return { header, rows };
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadEvaluationReadersExcel(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[]
) {
  if (!members.length) {
    throw new Error("Aucun lecteur à exporter pour cette évaluation.");
  }

  const { header, rows } = buildEvaluationReadersExportTable(evaluation, members);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lecteurs");
  const base = safeExportFileName(evaluation.nom);
  const filename = `evaluation-${base}-${evaluation.annee}.xlsx`;
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, filename);
}
