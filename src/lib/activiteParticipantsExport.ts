import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";
import { CDLJ_LOGO_SRC } from "@/config/brand";

export type ParticipantExportRow = {
  paidAt: string;
  paroisseName?: string;
  vicariatName?: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    dateNaissance?: string;
  };
  grade?: { name?: string; abbreviation?: string } | null;
};

export type ActiviteExportMeta = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
};

export type ParticipantExportScope = {
  filterVicariat?: string | null;
  filterParoisse?: string | null;
  accountVicariat?: string | null;
  accountParoisse?: string | null;
};

type TableSection = {
  vicariatTitle?: string;
  paroisseTitle?: string;
  participants: ParticipantExportRow[];
};

type BuildTableOptions = {
  hideParoisse?: boolean;
  hideVicariat?: boolean;
};

const MARGIN_X = 14;
const MARGIN_BOTTOM = 14;
const FOOTER_Y_OFFSET = 10;
const BRAND_HEADER_H = 22;
const HEADER_SCOPE_WIDTH = 72;

function resolveLogoUrl(src: string) {
  if (src.startsWith("http")) return src;
  if (typeof window !== "undefined") return `${window.location.origin}${src}`;
  return src;
}

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

function ageFromBirth(iso?: string) {
  if (!iso) return "—";
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return "—";
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return `${a} ans`;
}

function formatPaidAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
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

function resolveVicariatName(scope: ParticipantExportScope, participants: ParticipantExportRow[]) {
  return (
    scope.filterVicariat ??
    scope.accountVicariat ??
    participants.find((p) => p.vicariatName)?.vicariatName ??
    null
  );
}

export function buildHeaderScopeLines(scope: ParticipantExportScope, participants: ParticipantExportRow[]) {
  if (scope.filterParoisse) {
    const vicariat = resolveVicariatName(scope, participants);
    const lines: string[] = [];
    if (vicariat) lines.push(`Vicariat : ${vicariat}`);
    lines.push(`Paroisse : ${scope.filterParoisse}`);
    return lines;
  }

  if (scope.filterVicariat) {
    return [`Vicariat : ${scope.filterVicariat}`];
  }

  if (scope.accountParoisse) {
    const vicariat = resolveVicariatName(scope, participants);
    const lines: string[] = [];
    if (vicariat) lines.push(`Vicariat : ${vicariat}`);
    lines.push(`Paroisse : ${scope.accountParoisse}`);
    return lines;
  }

  if (scope.accountVicariat) {
    return [`Vicariat : ${scope.accountVicariat}`];
  }

  return [];
}

export function buildParticipantTableSections(
  participants: ParticipantExportRow[],
  scope: ParticipantExportScope
): TableSection[] {
  if (scope.filterParoisse) {
    return [{ participants }];
  }

  if (scope.filterVicariat) {
    const byParoisse = groupBy(participants, (p) => p.paroisseName ?? "—");
    const paroisseNames = sortLabels(byParoisse.keys());
    if (paroisseNames.length <= 1) {
      return [{ vicariatTitle: scope.filterVicariat, participants }];
    }
    return paroisseNames.map((paroisseName) => ({
      vicariatTitle: scope.filterVicariat ?? undefined,
      paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
      participants: byParoisse.get(paroisseName) ?? [],
    }));
  }

  const byVicariat = groupBy(participants, (p) => p.vicariatName ?? "—");
  const vicariatNames = sortLabels(byVicariat.keys());

  if (vicariatNames.length <= 1) {
    const vicariatTitle =
      scope.filterVicariat ??
      scope.accountVicariat ??
      (scope.filterParoisse || scope.accountParoisse
        ? vicariatNames[0] !== "—"
          ? vicariatNames[0]
          : undefined
        : undefined);

    const byParoisse = groupBy(participants, (p) => p.paroisseName ?? "—");
    const paroisseNames = sortLabels(byParoisse.keys());

    if (paroisseNames.length <= 1) {
      return [{ vicariatTitle, participants }];
    }

    return paroisseNames.map((paroisseName) => ({
      vicariatTitle,
      paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
      participants: byParoisse.get(paroisseName) ?? [],
    }));
  }

  const sections: TableSection[] = [];
  for (const vicariatName of vicariatNames) {
    const vicariatParticipants = byVicariat.get(vicariatName) ?? [];
    const byParoisse = groupBy(vicariatParticipants, (p) => p.paroisseName ?? "—");
    const paroisseNames = sortLabels(byParoisse.keys());

    if (paroisseNames.length <= 1) {
      sections.push({
        vicariatTitle: vicariatName === "—" ? undefined : vicariatName,
        participants: vicariatParticipants,
      });
      continue;
    }

    for (const paroisseName of paroisseNames) {
      sections.push({
        vicariatTitle: vicariatName === "—" ? undefined : vicariatName,
        paroisseTitle: paroisseName === "—" ? undefined : paroisseName,
        participants: byParoisse.get(paroisseName) ?? [],
      });
    }
  }

  return sections;
}

export function buildParticipantExportTable(
  participants: ParticipantExportRow[],
  options: BuildTableOptions = {}
) {
  const includeParoisse = !options.hideParoisse && participants.some((p) => Boolean(p.paroisseName));
  const includeVicariat = !options.hideVicariat && participants.some((p) => Boolean(p.vicariatName));
  const header = [
    "Matricule",
    "Nom",
    "Prénoms",
    ...(includeParoisse ? ["Paroisse"] : []),
    ...(includeVicariat ? ["Vicariat"] : []),
    "Grade",
    "Âge",
    "Date de paiement",
  ];
  const rows = participants.map((p) => [
    p.lecteur.uniqueId,
    p.lecteur.nom,
    p.lecteur.prenoms,
    ...(includeParoisse ? [p.paroisseName || "—"] : []),
    ...(includeVicariat ? [p.vicariatName || "—"] : []),
    p.grade?.name || p.grade?.abbreviation || "—",
    ageFromBirth(p.lecteur.dateNaissance),
    formatPaidAt(p.paidAt),
  ]);
  return { header, rows };
}

const EXCEL_SHEET_NAME_MAX = 31;
const EXCEL_INVALID_SHEET_CHARS = /[\\/?*[\]:]/g;
const EXCEL_INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const EXCEL_RESERVED_SHEET_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

function sanitizeExcelCellValue(value: string | number): string | number {
  if (typeof value !== "string") return value;
  return value.replace(EXCEL_INVALID_XML_CHARS, "");
}

function normalizeVicariatSheetLabel(name: string) {
  const trimmed = name.trim();
  const withoutPrefix = trimmed
    .replace(/^Vicariat Forain\s+/i, "")
    .replace(/^Vicariat\s+/i, "")
    .trim();
  return withoutPrefix || trimmed || "Vicariat";
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

export type ParticipantExcelSheet = {
  sheetName: string;
  header: string[];
  rows: (string | number)[][];
};

export function buildParticipantExcelSheets(
  participants: ParticipantExportRow[],
  scope: ParticipantExportScope = {}
): ParticipantExcelSheet[] {
  if (participants.length === 0) return [];

  const usedNames = new Set<string>();

  function sheetForGroup(vicariatLabel: string, group: ParticipantExportRow[]): ParticipantExcelSheet {
    const { header, rows } = buildParticipantExportTable(group, { hideVicariat: true });
    return {
      sheetName: sanitizeExcelSheetName(vicariatLabel, usedNames),
      header,
      rows,
    };
  }

  if (scope.filterParoisse || scope.accountParoisse) {
    const label =
      resolveVicariatName(scope, participants) ??
      participants.find((p) => p.vicariatName)?.vicariatName ??
      "Participants";
    return [sheetForGroup(label, participants)];
  }

  if (scope.filterVicariat || scope.accountVicariat) {
    const label = scope.filterVicariat ?? scope.accountVicariat ?? "Participants";
    return [sheetForGroup(label, participants)];
  }

  const byVicariat = groupBy(participants, (p) => p.vicariatName ?? "—");
  const vicariatNames = sortLabels(byVicariat.keys());

  return vicariatNames.map((vicariatName) =>
    sheetForGroup(
      vicariatName === "—" ? "Sans vicariat" : vicariatName,
      byVicariat.get(vicariatName) ?? []
    )
  );
}

export function generateActiviteParticipantsExcel(
  participants: ParticipantExportRow[],
  scope: ParticipantExportScope = {}
): Blob {
  const sheets = buildParticipantExcelSheets(participants, scope);
  if (sheets.length === 0) {
    throw new Error("Aucun participant à exporter.");
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
    Nom: 1.25,
    Prénoms: 1.45,
    Paroisse: 1.35,
    Vicariat: 1.25,
    Grade: 1,
    Âge: 0.55,
    "Date de paiement": 1.35,
  };
  const totalWeight = header.reduce((sum, label) => sum + (weights[label] ?? 1), 0);
  return Object.fromEntries(
    header.map((label, index) => [index, { cellWidth: (tableWidth * (weights[label] ?? 1)) / totalWeight }])
  );
}

function buildDocumentRef(activiteId: string, generatedAt: Date) {
  const stamp = format(generatedAt, "yyyyMMdd-HHmm");
  const shortId = activiteId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "ACT";
  return `CDLJ-PART-${shortId}-${stamp}`;
}

function getLastAutoTableFinalY(doc: unknown, fallback: number) {
  return (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;
}

export async function generateActiviteParticipantsPdf(
  activite: ActiviteExportMeta,
  participants: ParticipantExportRow[],
  scope: ParticipantExportScope = {}
): Promise<Blob> {
  if (participants.length === 0) {
    throw new Error("Aucun participant à exporter.");
  }

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const generatedAt = new Date();
  const documentRef = buildDocumentRef(activite.id, generatedAt);
  const headerScopeLines = buildHeaderScopeLines(scope, participants);
  const sections = buildParticipantTableSections(participants, scope);
  const showSectionHeadings = sections.length > 1 || Boolean(sections[0]?.paroisseTitle);

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
    doc.text("Liste des participants", centerX, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.inkSoft);
    const activityLines = doc.splitTextToSize(activite.nom, contentWidth);
    doc.text(activityLines, centerX, y, { align: "center", maxWidth: contentWidth });
    y += activityLines.length * 4.5 + 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.muted);
    const countLabel = `${participants.length} participant${participants.length !== 1 ? "s" : ""} inscrit${participants.length !== 1 ? "s" : ""}`;
    doc.text(countLabel, centerX, y, { align: "center" });

    return y + 5;
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

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (section.participants.length === 0) continue;

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

    const hideParoisse = Boolean(section.paroisseTitle) || Boolean(scope.filterParoisse);
    const hideVicariat =
      Boolean(section.vicariatTitle && !section.paroisseTitle && sections.length === 1) ||
      Boolean(scope.filterVicariat && !scope.filterParoisse);

    const { header, rows } = buildParticipantExportTable(section.participants, { hideParoisse, hideVicariat });
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
        fontSize: 7.5,
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
        fontSize: 7.2,
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
  doc.text(`Total inscrits dans ce document : ${participants.length}`, MARGIN_X, currentY + 1);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(page, totalPages);
  }

  return doc.output("blob");
}
