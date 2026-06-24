import { format, parseISO } from "date-fns";
import { CDLJ_LOGO_SRC } from "@/config/brand";
import type { ActiviteExportMeta } from "@/lib/activiteParticipantsExport";

export type ActiviteStatsTarifRow = {
  label: string;
  period: string;
  montant: number;
  count: number;
  lecteurs: number;
};

export type ActiviteStatsVicariatRow = {
  vicariatId: string;
  vicariatName: string;
  count: number;
};

export type ActiviteStatsParoisseRow = {
  paroisseId: string;
  paroisseName: string;
  vicariatId: string;
  vicariatName: string;
  count: number;
};

export type ActiviteStatsPaymentDayRow = {
  date: string;
  montant: number;
  participations: number;
};

export type ActiviteStatsExportData = {
  totalParticipants: number;
  totalMontant: number;
  byVicariat: ActiviteStatsVicariatRow[];
  byParoisse: ActiviteStatsParoisseRow[];
  paymentsByDay: ActiviteStatsPaymentDayRow[];
};

const MARGIN_X = 14;
const MARGIN_BOTTOM = 14;
const FOOTER_Y_OFFSET = 10;
const BRAND_HEADER_H = 22;

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

function resolveLogoUrl(src: string) {
  if (src.startsWith("http")) return src;
  if (typeof window !== "undefined") return `${window.location.origin}${src}`;
  return src;
}

function formatMoney(n: number) {
  const value = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${value} FCFA`;
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/→/g, " -> ")
    .replace(/—/g, "-")
    .replace(/·/g, " - ")
    .replace(/[''`´]/g, "'")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTarifAmount(montantInitial: number, montant: number) {
  if (montantInitial === 0 && montant === 0) return "Gratuit";
  return formatMoney(montant);
}

function participationShare(count: number, total: number) {
  if (total <= 0) return "0 %";
  return `${Math.round((count / total) * 100)} %`;
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

function buildDocumentRef(activiteId: string, generatedAt: Date) {
  const stamp = format(generatedAt, "yyyyMMdd-HHmm");
  const shortId = activiteId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "ACT";
  return `CDLJ-STAT-${shortId}-${stamp}`;
}

function getLastAutoTableFinalY(doc: unknown, fallback: number) {
  return (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;
}

function buildColumnStyles(
  header: string[],
  tableWidth: number,
  weights: Record<string, number>
): Record<number, { cellWidth: number; halign?: "center" | "left" | "right" }> {
  const totalWeight = header.reduce((sum, label) => sum + (weights[label] ?? 1), 0);
  return Object.fromEntries(
    header.map((label, index) => [
      index,
      {
        cellWidth: (tableWidth * (weights[label] ?? 1)) / totalWeight,
        halign: label === "Paiements" || label === "Lecteurs" || label === "Participations" || label === "Part" ? "center" as const : undefined,
      },
    ])
  );
}

export async function generateActiviteStatsPdf(
  activite: ActiviteExportMeta,
  stats: ActiviteStatsExportData,
  tarifBreakdown: ActiviteStatsTarifRow[],
  montantInitial: number
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const generatedAt = new Date();
  const documentRef = buildDocumentRef(activite.id, generatedAt);
  const [logoCDLJ] = await Promise.all([loadImageDataUrl(resolveLogoUrl(CDLJ_LOGO_SRC))]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_X * 2;
  const tableWidth = contentWidth;

  const tableStyles = {
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: { top: 2.2, right: 2.5, bottom: 2.2, left: 2.5 },
      textColor: PALETTE.inkSoft,
      lineColor: PALETTE.line,
      lineWidth: 0.15,
      overflow: "linebreak" as const,
      valign: "middle" as const,
    },
    headStyles: {
      fillColor: PALETTE.tableHead,
      textColor: PALETTE.white,
      fontStyle: "bold" as const,
      fontSize: 7.2,
      cellPadding: { top: 2.8, right: 2.5, bottom: 2.8, left: 2.5 },
    },
    alternateRowStyles: {
      fillColor: PALETTE.surface,
    },
    margin: { left: MARGIN_X, right: MARGIN_X, top: BRAND_HEADER_H + 2, bottom: MARGIN_BOTTOM },
  };

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
    const textMaxWidth = pageWidth - MARGIN_X - textX;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.inkSoft);
    doc.text("Aumônerie de l'Enfance Missionnaire de Cotonou", textX, 9, { maxWidth: textMaxWidth });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.accent);
    doc.text("Communauté Diocésaine des Lecteurs Juniors (CDLJ)", textX, 14.5, { maxWidth: textMaxWidth });

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
    doc.text("Statistiques de l'activité", centerX, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.inkSoft);
    const activityLines = doc.splitTextToSize(sanitizePdfText(activite.nom), contentWidth);
    doc.text(activityLines, centerX, y, { align: "center", maxWidth: contentWidth });
    y += activityLines.length * 4.5 + 3;

    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.muted);
    doc.text(
      `${stats.totalParticipants} participant${stats.totalParticipants !== 1 ? "s" : ""} inscrit${stats.totalParticipants !== 1 ? "s" : ""}`,
      centerX,
      y,
      { align: "center" }
    );
    y += 4.5;
    doc.text(`Montant total collecté : ${formatMoney(stats.totalMontant)}`, centerX, y, { align: "center" });

    return y + 6;
  }

  function drawSectionTitle(startY: number, title: string) {
    const y = startY + 5;
    const centerX = pageWidth / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PALETTE.ink);
    doc.text(title, centerX, y, { align: "center" });

    return y + 6;
  }

  function drawVicariatBand(startY: number, vicariatTitle: string, count: number) {
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
    doc.text(`Vicariat : ${sanitizePdfText(vicariatTitle)} - ${count} participation${count !== 1 ? "s" : ""}`, centerX, y + bandHeight / 2 + 1.2, {
      align: "center",
      maxWidth: contentWidth - 4,
    });

    return y + bandHeight + 4;
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
      `Généré le ${format(generatedAt, "dd/MM/yyyy 'a' HH:mm")}`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - MARGIN_X, footerY, { align: "right" });
  }

  function renderTable(startY: number, head: string[], body: (string | number)[][], columnWeights: Record<string, number>) {
    const columnStyles = buildColumnStyles(head, tableWidth, columnWeights);
    const safeBody = body.map((row) =>
      row.map((cell) => (typeof cell === "string" ? sanitizePdfText(cell) : cell))
    );
    autoTable(doc, {
      startY,
      head: [head],
      body: safeBody,
      tableWidth,
      columnStyles,
      ...tableStyles,
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawBrandHeader();
      },
    });
    return getLastAutoTableFinalY(doc, startY + 10) + 4;
  }

  drawBrandHeader();
  let currentY = drawPageContext(BRAND_HEADER_H);

  if (tarifBreakdown.length > 0) {
    currentY = drawSectionTitle(currentY, "Répartition par tarif");
    currentY = renderTable(
      currentY,
      ["Tarif", "Période", "Montant unitaire", "Paiements", "Lecteurs"],
      tarifBreakdown.map((row) => [
        row.label,
        row.period,
        formatTarifAmount(montantInitial, row.montant),
        String(row.count),
        String(row.lecteurs),
      ]),
      { Tarif: 1.1, Période: 1.6, "Montant unitaire": 1.1, Paiements: 0.7, Lecteurs: 0.7 }
    );
  }

  if (stats.byVicariat.length > 0) {
    currentY = drawSectionTitle(currentY, "Participation par vicariat et paroisse");

    for (let index = 0; index < stats.byVicariat.length; index += 1) {
      const vicariat = stats.byVicariat[index];
      if (index > 0) currentY = startContentOnNewPage();

      currentY = drawVicariatBand(currentY, vicariat.vicariatName, vicariat.count);

      const paroisses = stats.byParoisse
        .filter((row) => row.vicariatId === vicariat.vicariatId)
        .sort((a, b) => b.count - a.count || a.paroisseName.localeCompare(b.paroisseName, "fr"));

      if (paroisses.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...PALETTE.muted);
        doc.text("Aucune participation confirmée dans ce vicariat.", MARGIN_X, currentY + 2);
        currentY += 8;
        continue;
      }

      currentY = renderTable(
        currentY,
        ["Paroisse", "Participations", "Part"],
        paroisses.map((row) => [
          row.paroisseName,
          String(row.count),
          participationShare(row.count, vicariat.count),
        ]),
        { Paroisse: 1.8, Participations: 0.8, Part: 0.6 }
      );
    }
  }

  if (stats.paymentsByDay.length > 0) {
    if (currentY > pageHeight - 50) currentY = startContentOnNewPage();
    else currentY = drawSectionTitle(currentY, "Évolution des paiements");

    let montantCumule = 0;
    const paymentRows = [...stats.paymentsByDay]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => {
        montantCumule += row.montant;
        let dateLabel = row.date;
        try {
          dateLabel = format(parseISO(row.date), "dd/MM/yyyy");
        } catch {
          /* keep raw */
        }
        return [
          dateLabel,
          row.montant > 0 ? formatMoney(row.montant) : "-",
          String(row.participations),
          formatMoney(montantCumule),
        ];
      });

    currentY = renderTable(
      currentY,
      ["Date", "Montant du jour", "Participations", "Cumul"],
      paymentRows,
      { Date: 1, "Montant du jour": 1.2, Participations: 0.9, Cumul: 1.1 }
    );
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(page, totalPages);
  }

  return doc.output("blob");
}
