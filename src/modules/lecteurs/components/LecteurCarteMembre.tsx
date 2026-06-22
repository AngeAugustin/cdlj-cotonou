"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CreditCard, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type ApiLecteur,
  displayAvatarSrc,
  displayIdPhotoSrc,
  formatDateFr,
  lecteurInitials,
  rattachementLines,
} from "@/modules/lecteurs/lecteurViewUtils";
import { cn } from "@/lib/utils";
import { LECTEUR_CARTE_SIGNATURE_SRC } from "@/config/brand";

/** Dimensions cible ISO ID-1 (mm) — le PDF utilise cette taille page. */
export const LECTEUR_CARTE_MM_W = 85.6;
export const LECTEUR_CARTE_MM_H = 53.98;

const CARD_MM_W = LECTEUR_CARTE_MM_W;
const CARD_MM_H = LECTEUR_CARTE_MM_H;

const BARCODE_L = [2,1,3,1,2,3,1,2,1,3,2,1,3,1,2,1,2,3,1,2,1,3,1,2];
const BARCODE_R = [1,3,2,1,3,1,2,3,1,2,1,3,2,1,3,1,2,1,3,2,1,3,1,2];

function BarcodeStrip({ bars, className }: { bars: number[]; className?: string }) {
  return (
    <div className={cn("flex items-end gap-[1.5px]", className)}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="bg-slate-800 rounded-[0.5px]"
          style={{ width: 1.5, height: h === 1 ? 7 : h === 2 ? 10 : 13 }}
        />
      ))}
    </div>
  );
}

export function LecteurCarteFace({ lecteur, className }: { lecteur: ApiLecteur; className?: string }) {
  const photoSrc = displayIdPhotoSrc(lecteur) ?? displayAvatarSrc(lecteur);
  const initials = lecteurInitials(lecteur);
  const { paroisse, vicariat } = rattachementLines(lecteur);

  return (
    <div
      className={cn(
        "relative flex flex-col h-[320px] w-[510px] overflow-hidden rounded-xl bg-white border border-slate-200 shadow-2xl select-none",
        className
      )}
    >
      {/* ── Motif de sécurité en filigrane ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018] z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -55deg, #92400e 0px, #92400e 1px,
            transparent 1px, transparent 11px
          )`,
        }}
      />

      {/* ══════════════════════════════════════
          EN-TÊTE — logos + noms d'organisation
      ══════════════════════════════════════ */}
      <div className="relative z-10 flex items-center gap-3 px-4 bg-white border-b border-slate-100"
           style={{ height: 66 }}>

        {/* Logo gauche : Aumônerie / EM */}
        <img
          src="https://i.postimg.cc/zGGW7CSV/EM.png"
          alt="EM"
          crossOrigin="anonymous"
          className="shrink-0 h-12 w-12 object-contain"
        />

        {/* Textes centraux */}
        <div className="flex-1 min-w-0 text-center">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em] leading-tight truncate">
            Communauté Diocésaine des Lecteurs Juniors
          </p>
          <div className="my-1 h-px bg-slate-200" />
          <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-[0.08em] leading-tight truncate">
            Carte de Lecteur
          </p>
        </div>

        {/* Logo droit : CDLJ */}
        <img
          src="https://i.postimg.cc/BnnDpTc2/CDLJ.png"
          alt="CDLJ"
          crossOrigin="anonymous"
          className="shrink-0 h-12 w-12 object-contain"
        />
      </div>

      {/* Tricolore symbolique (3 bandes fines) */}
      <div className="flex z-10 shrink-0" style={{ height: 4 }}>
        <div className="flex-1 bg-amber-500" />
        <div className="flex-1 bg-slate-200" />
        <div className="flex-1 bg-amber-800" />
      </div>

      {/* ══════════════════════════════════════
          CORPS PRINCIPAL
      ══════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col flex-1 px-4 pt-2.5 pb-2.5 gap-0 min-h-0">

        {/* Ligne principale */}
        <div className="flex min-h-0 flex-1 gap-0">

          {/* Colonne gauche : identité + rattachement */}
          <div className="flex min-w-0 flex-1 flex-col pr-1">

            {/* Photo + champs identité — zone élargie vers le QR */}
            <div className="flex min-w-0 gap-2">

              {/* Matricule + photo */}
              <div className="flex shrink-0 flex-col items-center gap-1" style={{ width: 98 }}>
                <p className="font-mono text-[10px] font-extrabold tracking-widest text-amber-900 text-center leading-none">
                  {lecteur.uniqueId}
                </p>
                <div className="overflow-hidden rounded-md border-2 border-slate-300 bg-slate-100 shadow-inner w-full" style={{ height: 116 }}>
                  {photoSrc ? (
                    <img src={photoSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-black text-4xl text-slate-400">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              {/* Champs identité */}
              <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ height: 116, marginTop: 14 }}>
                {(
                  [
                    { label: "Nom :",        value: lecteur.nom.toUpperCase(), bold: true },
                    { label: "Prénom(s) :", value: lecteur.prenoms, bold: false },
                    { label: "Né(e) le :",  value: formatDateFr(lecteur.dateNaissance), bold: false },
                    { label: "Adhésion :",  value: lecteur.anneeAdhesion != null ? String(lecteur.anneeAdhesion) : "", bold: false },
                    { label: "Sexe :",      value: lecteur.sexe === "M" ? "Masculin" : "Féminin", bold: false },
                    { label: "Contact :",   value: lecteur.contact ?? "", bold: false },
                  ] as { label: string; value: string; bold: boolean }[]
                ).map(({ label, value, bold }) => (
                  <div key={label} className="flex min-w-0 items-baseline gap-1 leading-none">
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500" style={{ width: 58 }}>
                      {label}
                    </span>
                    <span className={cn("min-w-0 text-[11px] leading-none text-slate-900 whitespace-nowrap", bold ? "font-extrabold" : "font-semibold")}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Rattachement — sous la photo et les champs ── */}
            <div className="mt-6 min-w-0 overflow-hidden pt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 mb-1">
                Rattachement{" "}
                <span className="inline-block border-b border-slate-300 align-middle ml-1 w-24" />
              </p>
              <div className="flex flex-col gap-[4px]">
                <div className="flex min-w-0 items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">Vicariat :</span>
                  <span className="min-w-0 truncate text-[11px] font-semibold text-slate-900">{vicariat || "—"}</span>
                </div>
                <div className="flex min-w-0 items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">Paroisse :</span>
                  <span className="min-w-0 truncate text-[11px] font-semibold text-slate-900">{paroisse || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : QR + signature (inchangée) */}
          <div
            className="relative z-20 flex w-[118px] shrink-0 flex-col items-center overflow-hidden pl-1"
          >

            {/* QR code de l'identifiant */}
            <div className="shrink-0 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
              <QRCodeCanvas
                value={lecteur.uniqueId}
                size={110}
                level="M"
                bgColor="#ffffff"
                fgColor="#1e293b"
              />
            </div>

            {/* Signatures officielles — hauteur et position fixes dans la colonne droite */}
            <div className="mt-auto flex h-[108px] w-full shrink-0 overflow-hidden">
              <img
                src={LECTEUR_CARTE_SIGNATURE_SRC}
                alt=""
                crossOrigin="anonymous"
                draggable={false}
                className="h-full w-full origin-[28%_center] scale-[1.14] object-contain object-[28%_center] mix-blend-screen"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

type LecteurCarteContextValue = {
  downloadPdf: () => Promise<void>;
  pdfLoading: boolean;
};

const LecteurCarteContext = createContext<LecteurCarteContextValue | null>(null);

function useLecteurCarte() {
  const ctx = useContext(LecteurCarteContext);
  if (!ctx) throw new Error("Composant carte lecteur utilisé hors LecteurCarteProvider");
  return ctx;
}

function useLecteurCartePdf(lecteur: ApiLecteur) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const downloadPdf = useCallback(async () => {
    const el = captureRef.current;
    if (!el) return;
    setPdfLoading(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const imgData = await toPng(el, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        fetchRequestInit: { mode: "cors" },
      });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [CARD_MM_W, CARD_MM_H],
      });
      pdf.addImage(imgData, "PNG", 0, 0, CARD_MM_W, CARD_MM_H, undefined, "MEDIUM");
      pdf.save(`carte-lecteur-${lecteur.uniqueId}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Impossible de générer le PDF. Réessayez.");
    } finally {
      setPdfLoading(false);
    }
  }, [lecteur.uniqueId]);

  const hiddenCapture = (
    <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0" aria-hidden>
      <div ref={captureRef}>
        <LecteurCarteFace lecteur={lecteur} />
      </div>
    </div>
  );

  return { downloadPdf, pdfLoading, hiddenCapture };
}

/** Enveloppe la fiche : capture PDF + actions de téléchargement. */
export function LecteurCarteProvider({
  lecteur,
  children,
}: {
  lecteur: ApiLecteur;
  children: React.ReactNode;
}) {
  const { downloadPdf, pdfLoading, hiddenCapture } = useLecteurCartePdf(lecteur);

  return (
    <LecteurCarteContext.Provider value={{ downloadPdf, pdfLoading }}>
      {hiddenCapture}
      {children}
    </LecteurCarteContext.Provider>
  );
}

/** Icône de téléchargement PDF (barre du haut). */
export function LecteurCarteDownloadIcon() {
  const { downloadPdf, pdfLoading } = useLecteurCarte();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={pdfLoading}
      onClick={() => void downloadPdf()}
      title="Télécharger la carte en PDF"
      aria-label="Télécharger la carte en PDF"
      className="h-10 w-10 shrink-0 rounded-full border border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:bg-white hover:text-slate-800"
    >
      {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </Button>
  );
}

/** Aperçu réduit de la carte (colonne droite du hero). */
export function LecteurCarteInlinePreview({ lecteur }: { lecteur: ApiLecteur }) {
  return (
    <div className="flex w-full flex-col items-center lg:max-w-[367px] lg:items-end lg:shrink-0">
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/60
                   h-[186px] w-[296px] sm:h-[208px] sm:w-[332px] lg:h-[230px] lg:w-[367px]"
      >
        <div className="absolute left-0 top-0 origin-top-left scale-[0.58] sm:scale-[0.65] lg:scale-[0.72]">
          <LecteurCarteFace lecteur={lecteur} />
        </div>
      </div>
    </div>
  );
}

export function LecteurCarteMembre({
  lecteur,
  showHelperText = true,
  layout = "inline",
}: {
  lecteur: ApiLecteur;
  /** Texte d’aide sous le bouton (mode modal uniquement). */
  showHelperText?: boolean;
  /** inline : carte visible dans la page · modal : aperçu via boîte de dialogue */
  layout?: "inline" | "modal";
}) {
  const [open, setOpen] = useState(false);
  const { downloadPdf, pdfLoading, hiddenCapture } = useLecteurCartePdf(lecteur);

  if (layout === "inline") {
    return (
      <LecteurCarteProvider lecteur={lecteur}>
        <LecteurCarteInlinePreview lecteur={lecteur} />
      </LecteurCarteProvider>
    );
  }

  return (
    <>
      {hiddenCapture}
      <div className="flex w-fit max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-11 shrink-0 rounded-full border-amber-200/80 bg-white/90 font-bold text-amber-900 shadow-sm hover:bg-amber-50 lg:w-fit"
          onClick={() => setOpen(true)}
          title="Télécharger la carte"
          aria-label="Télécharger la carte"
        >
          <CreditCard className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">Télécharger la carte</span>
        </Button>
        {showHelperText ? (
          <p className="text-sm text-slate-500">
            Ouvre un aperçu de la carte ; vous pourrez l’enregistrer en PDF depuis le modal.
          </p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-4xl lg:max-w-5xl gap-0 overflow-hidden rounded-3xl p-0"
          showCloseButton
        >
          <DialogHeader className="border-b border-slate-100 px-4 py-3 text-left sm:px-5 sm:py-4">
            <DialogTitle className="text-base font-extrabold text-slate-900 sm:text-lg">Carte de lecteur</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 sm:text-sm">
              Aperçu au format carte bancaire (ISO ID-1). Le PDF reprend cette représentation à l’identique.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gradient-to-b from-slate-50 to-slate-100/80 px-2 py-4 sm:px-4 sm:py-8">
            <div className="w-full overflow-x-auto">
              <div className="mx-auto w-[510px] min-w-[510px] rounded-2xl shadow-2xl shadow-slate-900/25">
                <LecteurCarteFace lecteur={lecteur} />
              </div>
            </div>
          </div>

          <DialogFooter className="-mx-0 -mb-0 rounded-b-3xl border-t border-slate-100 bg-white px-4 py-3 sm:justify-center sm:py-4">
            <Button
              type="button"
              className="h-11 w-full max-w-sm rounded-xl bg-amber-900 font-bold hover:bg-amber-950 sm:w-auto"
              disabled={pdfLoading}
              onClick={() => void downloadPdf()}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Télécharger (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
