import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

  const accountVicariat = scope.accountVicariat ?? participants.find((p) => p.vicariatName)?.vicariatName ?? null;
  if (accountVicariat) {
    return [`Vicariat : ${accountVicariat}`];
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
      vicariatNames[0] !== "—"
        ? vicariatNames[0]
        : scope.accountVicariat ?? participants.find((p) => p.vicariatName)?.vicariatName ?? undefined;

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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PALETTE.ink);
    doc.text("Liste des participants", MARGIN_X, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.inkSoft);
    const activityLines = doc.splitTextToSize(activite.nom, contentWidth);
    doc.text(activityLines, MARGIN_X, y);

    return y + activityLines.length * 4.5 + 4;
  }

  function drawSectionHeading(startY: number, section: TableSection) {
    let y = startY + 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.inkSoft);

    if (section.vicariatTitle) {
      doc.text(`Vicariat : ${section.vicariatTitle}`, MARGIN_X, y);
      y += 4.5;
    }
    if (section.paroisseTitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...PALETTE.muted);
      doc.text(`Paroisse : ${section.paroisseTitle}`, MARGIN_X, y);
      y += 4.5;
    }

    return y + 1;
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

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (section.participants.length === 0) continue;

    if (showSectionHeadings) {
      currentY = drawSectionHeading(currentY, section);
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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.muted);
    doc.text(
      `${section.participants.length} participant${section.participants.length !== 1 ? "s" : ""} dans ce tableau`,
      MARGIN_X,
      currentY + 4
    );
    currentY += 9;
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
