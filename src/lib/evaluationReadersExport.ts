import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";
import { CDLJ_LOGO_SRC } from "@/config/brand";

export type EvaluationExportMeta = {
  _id: string;
  nom: string;
  annee: number;
  nombreNotes: number;
  terminee: boolean;
  publiee: boolean;
  gradeId?: { name: string; abbreviation: string };
  activiteId?: {
    nom: string;
    dateDebut: string | Date;
    dateFin: string | Date;
    lieu?: string;
  };
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
  vicariat?: { _id?: string; name: string; abbreviation: string };
  paroisse?: { _id?: string; name: string };
  notes: Array<{ noteIndex: number; valeur?: number; validated: boolean }>;
  moyenne?: number;
  decision?: "PROMU" | "MAINTENU" | string;
};

export type EvaluationExportLayout = "by_vicariat" | "complete";

export type EvaluationExportScope = {
  filterVicariat?: string | null;
  filterParoisse?: string | null;
  layout?: EvaluationExportLayout;
};

type TableSection = {
  vicariatTitle?: string;
  paroisseTitle?: string;
  members: EvaluationReaderExportRow[];
};

type BuildTableOptions = {
  hideParoisse?: boolean;
  hideVicariat?: boolean;
  compact?: boolean;
};

const MARGIN_X = 14;
const MARGIN_BOTTOM = 14;
const FOOTER_Y_OFFSET = 10;
const BRAND_HEADER_H = 22;
const HEADER_SCOPE_WIDTH = 72;

const EXCEL_SHEET_NAME_MAX = 31;
const EXCEL_INVALID_SHEET_CHARS = /[\\/?*[\]:]/g;
const EXCEL_INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const EXCEL_RESERVED_SHEET_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

type Rgb = [number, number, number];

const PALETTE = {
  ink: [15, 23, 42] as Rgb,
  inkSoft: [51, 65, 85] as Rgb,
  muted: [100, 116, 139] as Rgb,
  faint: [148, 163, 184] as Rgb,
  line: [226, 232, 240] as Rgb,
  surface: [248, 250, 252] as Rgb,
  accent: [120, 53, 15] as Rgb,
  tableHead: [30, 41, 59] as Rgb,
  white: [255, 255, 255] as Rgb,
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

export function safeEvaluationExportFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim().slice(0, 48) || "evaluation";
}

function resolveLogoUrl(src: string) {
  if (src.startsWith("http")) return src;
  if (typeof window !== "undefined") return `${window.location.origin}${src}`;
  return src;
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function sortLabels(values: Iterable<string>) {
  return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function vicariatNameOf(row: EvaluationReaderExportRow) {
  return row.vicariat?.name ?? "—";
}

function paroisseNameOf(row: EvaluationReaderExportRow) {
  return row.paroisse?.name ?? "—";
}

export function buildEvaluationHeaderScopeLines(scope: EvaluationExportScope) {
  const lines: string[] = [];
  if (scope.filterParoisse) {
    if (scope.filterVicariat) lines.push(`Vicariat : ${scope.filterVicariat}`);
    lines.push(`Paroisse : ${scope.filterParoisse}`);
  } else if (scope.filterVicariat) {
    lines.push(`Vicariat : ${scope.filterVicariat}`);
  }
  return lines;
}

export function buildEvaluationExportScopeSuffix(scope: EvaluationExportScope) {
  const parts: string[] = [];
  if (scope.filterVicariat) parts.push(safeEvaluationExportFileName(scope.filterVicariat));
  if (scope.filterParoisse) parts.push(safeEvaluationExportFileName(scope.filterParoisse));
  if (scope.layout === "complete") parts.push("liste-complete");
  return parts.length ? `-${parts.join("-")}` : "";
}

export function buildEvaluationTableSections(
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope
): TableSection[] {
  if (scope.filterParoisse) {
    return [{ members }];
  }

  if (scope.filterVicariat) {
    const byParoisse = groupBy(members, paroisseNameOf);
    const paroisseNames = sortLabels(byParoisse.keys());
    if (paroisseNames.length <= 1) {
      return [{ vicariatTitle: scope.filterVicariat, members }];
    }
    return paroisseNames.map((paroisseName) => ({
      vicariatTitle: scope.filterVicariat ?? undefined,
      paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
      members: byParoisse.get(paroisseName) ?? [],
    }));
  }

  const byVicariat = groupBy(members, vicariatNameOf);
  const vicariatNames = sortLabels(byVicariat.keys());

  if (vicariatNames.length <= 1) {
    const vicariatTitle = vicariatNames[0] !== "—" ? vicariatNames[0] : undefined;
    const byParoisse = groupBy(members, paroisseNameOf);
    const paroisseNames = sortLabels(byParoisse.keys());

    if (paroisseNames.length <= 1) {
      return [{ vicariatTitle, members }];
    }

    return paroisseNames.map((paroisseName) => ({
      vicariatTitle,
      paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
      members: byParoisse.get(paroisseName) ?? [],
    }));
  }

  const sections: TableSection[] = [];
  for (const vicariatName of vicariatNames) {
    const vicariatMembers = byVicariat.get(vicariatName) ?? [];
    const byParoisse = groupBy(vicariatMembers, paroisseNameOf);
    const paroisseNames = sortLabels(byParoisse.keys());

    if (paroisseNames.length <= 1) {
      sections.push({
        vicariatTitle: vicariatName === "—" ? undefined : vicariatName,
        members: vicariatMembers,
      });
      continue;
    }

    for (const paroisseName of paroisseNames) {
      sections.push({
        vicariatTitle: vicariatName === "—" ? undefined : vicariatName,
        paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
        members: byParoisse.get(paroisseName) ?? [],
      });
    }
  }

  return sections;
}

function buildFlatExportTableOptions(scope: EvaluationExportScope): BuildTableOptions {
  return {
    hideParoisse: Boolean(scope.filterParoisse),
    hideVicariat: Boolean(scope.filterVicariat && !scope.filterParoisse),
  };
}

export function buildEvaluationReadersExportTable(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[],
  options: BuildTableOptions = {}
) {
  const noteHeaders = Array.from({ length: evaluation.nombreNotes }, (_, i) => `Note ${i + 1}`);
  const includeParoisse = !options.hideParoisse && members.some((row) => Boolean(row.paroisse?.name));
  const includeVicariat = !options.hideVicariat && members.some((row) => Boolean(row.vicariat?.name));
  const showResults = evaluation.terminee;

  const header = ["Matricule", "Nom", "Prénoms"];
  if (!options.compact) {
    header.push("Date de naissance", "Sexe");
    if (includeVicariat) header.push("Vicariat");
    if (includeParoisse) header.push("Paroisse");
  } else {
    if (includeParoisse) header.push("Paroisse");
    if (includeVicariat) header.push("Vicariat");
    header.push("Sexe");
  }
  header.push("Grade (évaluation)");
  header.push(...noteHeaders);
  if (showResults) header.push("Moyenne", "Décision");

  const rows = members.map((row) => {
    const notesByIndex = new Map(row.notes.map((n) => [n.noteIndex, n]));
    const noteValues = Array.from({ length: evaluation.nombreNotes }, (_, i) => {
      const slot = notesByIndex.get(i + 1);
      return formatNoteValue(slot?.valeur, slot?.validated);
    });

    const grade =
      row.lecteur.gradeIdAtEvaluation?.name ?? row.lecteur.gradeIdAtEvaluation?.abbreviation ?? "—";
    const values: (string | number)[] = [row.lecteur.uniqueId, row.lecteur.nom, row.lecteur.prenoms];

    if (!options.compact) {
      values.push(
        formatBirthDate(row.lecteur.dateNaissance),
        formatSexe(row.lecteur.sexe)
      );
      if (includeVicariat) values.push(row.vicariat?.name ?? "—");
      if (includeParoisse) values.push(row.paroisse?.name ?? "—");
    } else {
      if (includeParoisse) values.push(row.paroisse?.name ?? "—");
      if (includeVicariat) values.push(row.vicariat?.name ?? "—");
      values.push(formatSexe(row.lecteur.sexe));
    }

    values.push(grade);

    values.push(...noteValues);

    if (showResults) {
      values.push(
        row.moyenne !== undefined ? row.moyenne.toFixed(2) : "—",
        formatDecision(row.decision)
      );
    }

    return values;
  });

  return { header, rows };
}

function normalizeVicariatSheetLabel(name: string) {
  const trimmed = name.trim();
  const withoutPrefix = trimmed
    .replace(/^Vicariat Forain\s+/i, "")
    .replace(/^Vicariat\s+/i, "")
    .trim();
  return withoutPrefix || trimmed || "Vicariat";
}

function sanitizeExcelCellValue(value: string | number): string | number {
  if (typeof value !== "string") return value;
  return value.replace(EXCEL_INVALID_XML_CHARS, "");
}

function sanitizeExcelSheetName(name: string, usedNames: Set<string>) {
  let base = normalizeVicariatSheetLabel(name)
    .normalize("NFKC")
    .replace(EXCEL_INVALID_XML_CHARS, "")
    .replace(EXCEL_INVALID_SHEET_CHARS, " ")
    .replace(/[''`´]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .slice(0, EXCEL_SHEET_NAME_MAX)
    .trim()
    .replace(/^['"]+|['"]+$/g, "");

  if (!base) base = "Vicariat";
  if (EXCEL_RESERVED_SHEET_NAMES.test(base)) base = `_${base}`.slice(0, EXCEL_SHEET_NAME_MAX);

  let candidate = base;
  let index = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` (${index})`;
    const prefixMax = Math.max(1, EXCEL_SHEET_NAME_MAX - suffix.length);
    candidate = `${base.slice(0, prefixMax).trim().replace(/[-\s]+$/g, "")}${suffix}`;
    if (!candidate.trim()) candidate = `Vicariat${suffix}`.slice(0, EXCEL_SHEET_NAME_MAX);
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

export type EvaluationExcelSheet = {
  sheetName: string;
  header: string[];
  rows: (string | number)[][];
};

export function buildEvaluationExcelSheets(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope = {}
): EvaluationExcelSheet[] {
  if (members.length === 0) return [];

  const layout = scope.layout ?? "by_vicariat";
  const usedNames = new Set<string>();

  if (layout === "complete") {
    const { header, rows } = buildEvaluationReadersExportTable(
      evaluation,
      members,
      buildFlatExportTableOptions(scope)
    );
    return [
      {
        sheetName: sanitizeExcelSheetName("Lecteurs", usedNames),
        header,
        rows,
      },
    ];
  }

  const tableOptions: BuildTableOptions = {
    hideVicariat: true,
    hideParoisse: Boolean(scope.filterParoisse),
  };

  function sheetForGroup(vicariatLabel: string, group: EvaluationReaderExportRow[]): EvaluationExcelSheet {
    const { header, rows } = buildEvaluationReadersExportTable(evaluation, group, tableOptions);
    return {
      sheetName: sanitizeExcelSheetName(vicariatLabel, usedNames),
      header,
      rows,
    };
  }

  if (scope.filterParoisse) {
    const label = scope.filterVicariat ?? members.find((m) => m.vicariat?.name)?.vicariat?.name ?? "Lecteurs";
    return [sheetForGroup(label, members)];
  }

  if (scope.filterVicariat) {
    return [sheetForGroup(scope.filterVicariat, members)];
  }

  const byVicariat = groupBy(members, vicariatNameOf);
  const vicariatNames = sortLabels(byVicariat.keys());

  return vicariatNames.map((vicariatName) =>
    sheetForGroup(vicariatName === "—" ? "Sans vicariat" : vicariatName, byVicariat.get(vicariatName) ?? [])
  );
}

export function generateEvaluationReadersExcel(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope = {}
): Blob {
  const sheets = buildEvaluationExcelSheets(evaluation, members, scope);
  if (sheets.length === 0) {
    throw new Error("Aucun lecteur à exporter pour cette évaluation.");
  }

  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const rows = sheet.rows.map((row) => row.map(sanitizeExcelCellValue));
    const ws = XLSX.utils.aoa_to_sheet([sheet.header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function buildColumnStyles(header: string[], tableWidth: number): Record<number, { cellWidth: number; halign?: "center" | "left" | "right" }> {
  const weights: Record<string, number> = {
    "N°": 0.35,
    Matricule: 1.05,
    Nom: 1.15,
    Prénoms: 1.35,
    Paroisse: 1.2,
    Vicariat: 1.1,
    Sexe: 0.55,
    "Grade (évaluation)": 1,
    Moyenne: 0.7,
    Décision: 0.85,
  };
  const totalWeight = header.reduce((sum, label) => {
    if (/^Note \d+$/.test(label)) return sum + 0.55;
    return sum + (weights[label] ?? 1);
  }, 0);
  return Object.fromEntries(
    header.map((label, index) => {
      const weight = /^Note \d+$/.test(label) ? 0.55 : weights[label] ?? 1;
      return [index, { cellWidth: (tableWidth * weight) / totalWeight }];
    })
  );
}

function buildDocumentRef(evaluationId: string, generatedAt: Date) {
  const stamp = format(generatedAt, "yyyyMMdd-HHmm");
  const shortId = evaluationId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "EVAL";
  return `CDLJ-EVAL-${shortId}-${stamp}`;
}

function getLastAutoTableFinalY(doc: unknown, fallback: number) {
  return (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;
}

function evaluationSubtitle(evaluation: EvaluationExportMeta) {
  const parts = [evaluation.nom, String(evaluation.annee)];
  if (evaluation.gradeId?.abbreviation || evaluation.gradeId?.name) {
    parts.push(evaluation.gradeId.abbreviation ?? evaluation.gradeId.name);
  }
  if (evaluation.activiteId?.nom) parts.push(evaluation.activiteId.nom);
  return parts.join(" · ");
}

export async function generateEvaluationReadersPdf(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope = {}
): Promise<Blob> {
  if (members.length === 0) {
    throw new Error("Aucun lecteur à exporter pour cette évaluation.");
  }

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const generatedAt = new Date();
  const documentRef = buildDocumentRef(evaluation._id, generatedAt);
  const headerScopeLines = buildEvaluationHeaderScopeLines(scope);
  const layout = scope.layout ?? "by_vicariat";
  const isFlatLayout = layout === "complete";
  const sections = isFlatLayout ? [{ members }] : buildEvaluationTableSections(members, scope);
  const showSectionHeadings =
    !isFlatLayout && (sections.length > 1 || Boolean(sections[0]?.paroisseTitle));

  const [logoCDLJ] = await Promise.all([loadImageDataUrl(resolveLogoUrl(CDLJ_LOGO_SRC))]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_X * 2;
  const tableWidth = contentWidth;

  function drawBrandHeader() {
    doc.setFillColor(...PALETTE.white);
    doc.rect(0, 0, pageWidth, BRAND_HEADER_H, "F");

    const logoCdljSize = 14;
    let cursorX = MARGIN_X;

    if (logoCDLJ) {
      doc.addImage(logoCDLJ, "PNG", cursorX, (BRAND_HEADER_H - logoCdljSize) / 2, logoCdljSize, logoCdljSize);
      cursorX += logoCdljSize + 5;
    }

    const textX = cursorX;
    const textMaxWidth = pageWidth - MARGIN_X - textX - HEADER_SCOPE_WIDTH;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.inkSoft);
    doc.text("Aumônerie de l'Enfance Missionnaire de Cotonou", textX, 9, { maxWidth: textMaxWidth });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.accent);
    doc.text("Communauté Diocésaine des Lecteurs Juniors (CDLJ)", textX, 14.5, { maxWidth: textMaxWidth });

    if (headerScopeLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...PALETTE.inkSoft);
      headerScopeLines.forEach((line, index) => {
        doc.text(line, pageWidth - MARGIN_X, 8 + index * 4.5, { align: "right", maxWidth: HEADER_SCOPE_WIDTH });
      });
    }

    doc.setDrawColor(...PALETTE.line);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X, BRAND_HEADER_H, pageWidth - MARGIN_X, BRAND_HEADER_H);
  }

  function drawPageContext(startY: number) {
    let y = startY + 7;
    const centerX = pageWidth / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PALETTE.ink);
    doc.text("Liste des lecteurs évalués", centerX, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.inkSoft);
    const subtitleLines = doc.splitTextToSize(evaluationSubtitle(evaluation), contentWidth);
    doc.text(subtitleLines, centerX, y, { align: "center", maxWidth: contentWidth });
    y += subtitleLines.length * 4.5 + 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.muted);
    const countLabel = `${members.length} lecteur${members.length !== 1 ? "s" : ""}`;
    doc.text(countLabel, centerX, y, { align: "center" });
    y += 5;

    if (headerScopeLines.length > 0) {
      doc.setFontSize(8);
      doc.text(headerScopeLines.join(" · "), centerX, y, { align: "center", maxWidth: contentWidth });
      y += 5;
    }

    return y;
  }

  function drawVicariatBand(startY: number, vicariatTitle: string) {
    const bandHeight = 8;
    const y = startY + 4;
    const centerX = pageWidth / 2;

    doc.setFillColor(254, 243, 199);
    doc.rect(MARGIN_X, y, contentWidth, bandHeight, "F");

    doc.setDrawColor(...PALETTE.line);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN_X, y, contentWidth, bandHeight, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PALETTE.accent);
    doc.text(`Vicariat : ${vicariatTitle}`, centerX, y + bandHeight / 2 + 1.2, { align: "center" });

    return y + bandHeight + 5;
  }

  function drawParoisseHeading(startY: number, paroisseTitle: string) {
    const bandHeight = 7;
    const y = startY + 3;
    const centerX = pageWidth / 2;

    doc.setFillColor(...PALETTE.surface);
    doc.rect(MARGIN_X, y, contentWidth, bandHeight, "F");

    doc.setDrawColor(...PALETTE.line);
    doc.setLineWidth(0.15);
    doc.rect(MARGIN_X, y, contentWidth, bandHeight, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.inkSoft);
    doc.text(`Paroisse : ${paroisseTitle}`, centerX, y + bandHeight / 2 + 1, { align: "center" });

    return y + bandHeight + 3;
  }

  function startContentOnNewPage() {
    doc.addPage();
    drawBrandHeader();
    return BRAND_HEADER_H + 4;
  }

  function drawFooter(pageNumber: number, totalPages: number) {
    const footerY = pageHeight - FOOTER_Y_OFFSET;
    doc.setDrawColor(...PALETTE.line);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, footerY - 4, pageWidth - MARGIN_X, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.faint);
    doc.text(`Réf. ${documentRef}`, MARGIN_X, footerY);
    doc.text(
      `Généré le ${format(generatedAt, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - MARGIN_X, footerY, { align: "right" });
  }

  drawBrandHeader();
  let currentY = drawPageContext(BRAND_HEADER_H);
  let lastVicariatTitle: string | undefined;
  let lastParoisseTitle: string | undefined;

  for (const section of sections) {
    if (section.members.length === 0) continue;

    if (showSectionHeadings) {
      const isNewVicariat = Boolean(section.vicariatTitle && section.vicariatTitle !== lastVicariatTitle);

      if (isNewVicariat && section.vicariatTitle) {
        if (lastVicariatTitle !== undefined) {
          currentY = startContentOnNewPage();
        }
        currentY = drawVicariatBand(currentY, section.vicariatTitle);
        lastVicariatTitle = section.vicariatTitle;
        lastParoisseTitle = undefined;
      }

      if (section.paroisseTitle) {
        const isNewParoisse = section.paroisseTitle !== lastParoisseTitle;
        if (isNewParoisse && lastParoisseTitle !== undefined && !isNewVicariat) {
          currentY = startContentOnNewPage();
        }
        currentY = drawParoisseHeading(currentY, section.paroisseTitle);
        lastParoisseTitle = section.paroisseTitle;
      }
    }

    const tableOptions = isFlatLayout
      ? { ...buildFlatExportTableOptions(scope), compact: true }
      : {
          hideParoisse: Boolean(section.paroisseTitle) || Boolean(scope.filterParoisse),
          hideVicariat:
            Boolean(section.vicariatTitle && !section.paroisseTitle && sections.length === 1) ||
            Boolean(scope.filterVicariat && !scope.filterParoisse),
          compact: true,
        };

    const { header, rows } = buildEvaluationReadersExportTable(evaluation, section.members, tableOptions);
    const tableHeader = ["N°", ...header];
    const tableRows = rows.map((row, rowIndex) => [String(rowIndex + 1), ...row]);
    const columnStyles = buildColumnStyles(tableHeader, tableWidth);
    if (columnStyles[0]) columnStyles[0].halign = "center";

    autoTable(doc, {
      startY: currentY,
      head: [tableHeader],
      body: tableRows,
      tableWidth,
      styles: {
        font: "helvetica",
        fontSize: 7.2,
        cellPadding: { top: 2.2, right: 2.5, bottom: 2.2, left: 2.5 },
        textColor: PALETTE.inkSoft,
        lineColor: PALETTE.line,
        lineWidth: 0.15,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: PALETTE.tableHead,
        textColor: PALETTE.white,
        fontStyle: "bold",
        fontSize: 6.8,
        cellPadding: { top: 2.8, right: 2.5, bottom: 2.8, left: 2.5 },
      },
      alternateRowStyles: {
        fillColor: PALETTE.surface,
      },
      columnStyles,
      margin: { left: MARGIN_X, right: MARGIN_X, top: BRAND_HEADER_H + 2, bottom: MARGIN_BOTTOM },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawBrandHeader();
      },
    });

    currentY = getLastAutoTableFinalY(doc, currentY + 10);
    currentY += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.inkSoft);
  doc.text(`Total lecteurs dans ce document : ${members.length}`, MARGIN_X, currentY + 1);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(page, totalPages);
  }

  return doc.output("blob");
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
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope = {}
) {
  const blob = generateEvaluationReadersExcel(evaluation, members, scope);
  const base = safeEvaluationExportFileName(evaluation.nom);
  const scopeSuffix = buildEvaluationExportScopeSuffix(scope);
  triggerBrowserDownload(blob, `evaluation-${base}-${evaluation.annee}${scopeSuffix}.xlsx`);
}

export async function downloadEvaluationReadersPdf(
  evaluation: EvaluationExportMeta,
  members: EvaluationReaderExportRow[],
  scope: EvaluationExportScope = {}
) {
  const blob = await generateEvaluationReadersPdf(evaluation, members, scope);
  const base = safeEvaluationExportFileName(evaluation.nom);
  const scopeSuffix = buildEvaluationExportScopeSuffix(scope);
  triggerBrowserDownload(blob, `evaluation-${base}-${evaluation.annee}${scopeSuffix}.pdf`);
}
