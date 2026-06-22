import type { ApiLecteur } from "@/modules/lecteurs/lecteurViewUtils";
import {
  displayAvatarSrc,
  displayIdPhotoSrc,
} from "@/modules/lecteurs/lecteurViewUtils";
import {
  LECTEUR_CARTE_MM_H,
  LECTEUR_CARTE_MM_W,
} from "@/modules/lecteurs/components/LecteurCarteMembre";
import { LECTEUR_CARTE_SIGNATURE_SRC } from "@/config/brand";
import { absolutePublicUrl } from "@/lib/mediaUrl";

export const PARTICIPANT_CARDS_PDF_FORMAT = "a4" as const;
export const PARTICIPANT_CARDS_PDF_ORIENTATION = "landscape" as const;
export const PARTICIPANT_CARDS_CAPTURE_BATCH_SIZE = 12;
/** Suffisant pour l’impression carte (~510 CSS px × 2). */
export const PARTICIPANT_CARDS_BULK_PIXEL_RATIO = 2;
/** Agrandissement sur page A4 (taille réelle ID-1 × facteur). */
export const PARTICIPANT_CARDS_PDF_SCALE = 1.22;

const BRAND_LOGO_URLS = [
  "https://i.postimg.cc/zGGW7CSV/EM.png",
  "https://i.postimg.cc/BnnDpTc2/CDLJ.png",
  absolutePublicUrl(LECTEUR_CARTE_SIGNATURE_SRC) ?? LECTEUR_CARTE_SIGNATURE_SRC,
].filter(Boolean);

let exportModulesPromise: Promise<{
  jsPDF: typeof import("jspdf").jsPDF;
  toCanvas: typeof import("html-to-image").toCanvas;
}> | null = null;

function loadExportModules() {
  if (!exportModulesPromise) {
    exportModulesPromise = Promise.all([import("jspdf"), import("html-to-image")]).then(
      ([jspdf, htmlToImage]) => ({
        jsPDF: jspdf.jsPDF,
        toCanvas: htmlToImage.toCanvas,
      })
    );
  }
  return exportModulesPromise;
}

function preloadUrl(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export async function preloadParticipantCardAssets(lecteurs: ApiLecteur[]) {
  const photoUrls = new Set<string>();
  for (const lecteur of lecteurs) {
    const src = displayIdPhotoSrc(lecteur) ?? displayAvatarSrc(lecteur);
    if (src) photoUrls.add(src);
  }
  await Promise.all([...BRAND_LOGO_URLS, ...photoUrls].map(preloadUrl));
}

export async function waitForImagesInContainer(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export async function captureLecteurCartePng(
  root: HTMLElement,
  opts?: { pixelRatio?: number; skipImageWait?: boolean }
) {
  if (!opts?.skipImageWait) {
    await waitForImagesInContainer(root);
  }

  const { toCanvas } = await loadExportModules();

  const canvas = await toCanvas(root, {
    pixelRatio: opts?.pixelRatio ?? PARTICIPANT_CARDS_BULK_PIXEL_RATIO,
    backgroundColor: "#ffffff",
    fetchRequestInit: { mode: "cors" },
    cacheBust: false,
  });

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function centeredCardRect(pageWidth: number, pageHeight: number) {
  const w = LECTEUR_CARTE_MM_W * PARTICIPANT_CARDS_PDF_SCALE;
  const h = LECTEUR_CARTE_MM_H * PARTICIPANT_CARDS_PDF_SCALE;
  return {
    x: (pageWidth - w) / 2,
    y: (pageHeight - h) / 2,
    w,
    h,
  };
}

type JsPdfDoc = Awaited<ReturnType<typeof createParticipantCardsPdfDocument>>;

export async function createParticipantCardsPdfDocument() {
  const { jsPDF } = await loadExportModules();
  return new jsPDF({
    orientation: PARTICIPANT_CARDS_PDF_ORIENTATION,
    unit: "mm",
    format: PARTICIPANT_CARDS_PDF_FORMAT,
  });
}

export function appendCenteredCardToPdf(
  pdf: JsPdfDoc,
  imgData: string,
  options?: { newPage?: boolean }
) {
  if (options?.newPage) {
    pdf.addPage(PARTICIPANT_CARDS_PDF_FORMAT, PARTICIPANT_CARDS_PDF_ORIENTATION);
  }
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { x, y, w, h } = centeredCardRect(pageWidth, pageHeight);
  const format = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
  pdf.addImage(imgData, format, x, y, w, h, undefined, "FAST");
}

export async function generateParticipantCardsPdfFromElements(
  cardRoots: HTMLElement[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  if (cardRoots.length === 0) {
    throw new Error("Aucun participant à exporter.");
  }

  const pdf = await createParticipantCardsPdfDocument();

  for (let index = 0; index < cardRoots.length; index += 1) {
    onProgress?.(index + 1, cardRoots.length);
    const imgData = await captureLecteurCartePng(cardRoots[index], {
      pixelRatio: PARTICIPANT_CARDS_BULK_PIXEL_RATIO,
      skipImageWait: true,
    });
    appendCenteredCardToPdf(pdf, imgData, { newPage: index > 0 });
  }

  return pdf.output("blob");
}
