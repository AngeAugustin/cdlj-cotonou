"use client";

import { useCallback, useRef, useState } from "react";
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
  gradeLabel,
  lecteurInitials,
  rattachementLines,
} from "@/modules/lecteurs/lecteurViewUtils";
import { cn } from "@/lib/utils";

/** Dimensions cible ISO ID-1 (mm) — le PDF utilise cette taille page. */
const CARD_MM_W = 85.6;
const CARD_MM_H = 53.98;

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

function LecteurCarteFace({ lecteur, className }: { lecteur: ApiLecteur; className?: string }) {
  const photoSrc = displayIdPhotoSrc(lecteur) ?? displayAvatarSrc(lecteur);
  const initials = lecteurInitials(lecteur);
  const grade = gradeLabel(lecteur);
  const { paroisse, vicariat } = rattachementLines(lecteur);
  const year = new Date().getFullYear();

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

        {/* Ligne principale : moitié gauche | moitié droite (50/50) */}
        <div className="flex gap-0 flex-1 min-h-0">

          {/* ── Moitié gauche (50%) : photo | champs + Rattachement en bas ── */}
          <div className="flex flex-col gap-0 pr-3" style={{ flex: "0 0 50%", overflow: "visible" }}>

            {/* Photo + champs côte à côte */}
            <div className="flex gap-3" style={{ flex: "0 0 auto" }}>

              {/* Matricule + photo */}
              <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: 104 }}>
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

              {/* Champs identité — même hauteur que la photo, alignés sur elle */}
              <div className="flex flex-col justify-between" style={{ height: 116, marginTop: 14, overflow: "visible" }}>
                {(
                  [
                    { label: "Nom :",        value: lecteur.nom.toUpperCase(), bold: true },
                    { label: "Prénom(s) :", value: lecteur.prenoms, bold: false },
                    { label: "Né(e) le :",  value: formatDateFr(lecteur.dateNaissance), bold: false },
                    { label: "Adhésion :",  value: String(lecteur.anneeAdhesion), bold: false },
                    { label: "Sexe :",      value: lecteur.sexe === "M" ? "Masculin" : "Féminin", bold: false },
                    { label: "Contact :",   value: lecteur.contact, bold: false },
                  ] as { label: string; value: string; bold: boolean }[]
                ).map(({ label, value, bold }) => (
                  <div key={label} className="flex items-baseline gap-1 leading-none">
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500" style={{ width: 66 }}>
                      {label}
                    </span>
                    <span className={cn("text-[11px] text-slate-900 whitespace-nowrap", bold ? "font-extrabold" : "font-semibold")}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Rattachement — sous la photo et les champs ── */}
            <div className="mt-6 pt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 mb-1">
                Rattachement{" "}
                <span className="inline-block border-b border-slate-300 align-middle ml-1 w-24" />
              </p>
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">Vicariat :</span>
                  <span className="text-[11px] font-semibold text-slate-900 whitespace-nowrap">{vicariat || "—"}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">Paroisse :</span>
                  <span className="text-[11px] font-semibold text-slate-900 whitespace-nowrap">{paroisse || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Moitié droite (50%) : séparateur + badge + QR + signatures ── */}
          <div className="flex flex-col items-center gap-2.5 pl-3" style={{ flex: "0 0 50%" }}>

            {/* Badge grade (sans label) */}
            {grade !== "—" && (
              <div className="rounded-full bg-amber-100 border border-amber-300 px-4 py-1 text-center">
                <p className="text-[10px] font-extrabold text-amber-900 leading-tight">{grade}</p>
              </div>
            )}

            {/* QR code de l'identifiant */}
            <div className="rounded-md border border-slate-200 bg-white p-1 shadow-sm">
              <QRCodeCanvas
                value={lecteur.uniqueId}
                size={110}
                level="M"
                bgColor="#ffffff"
                fgColor="#1e293b"
              />
            </div>

            {/* Signatures horizontales avec séparateur vertical */}
            <div className="mt-auto w-full flex items-end gap-0">
              {/* Aumônier */}
              <div className="flex-1 text-center px-1">
                <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Aumônier</p>
                <div className="border-b border-slate-500 mx-1" />
              </div>
              {/* Séparateur vertical */}
              <div className="w-px bg-slate-300 self-stretch mx-0.5" />
              {/* Coordonnateur */}
              <div className="flex-1 text-center px-1">
                <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Coordonnateur</p>
                <div className="border-b border-slate-500 mx-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export function LecteurCarteMembre({
  lecteur,
  showHelperText = true,
}: {
  lecteur: ApiLecteur;
  /** Texte d’aide sous le bouton (désactivé quand le bouton est dans la barre du haut). */
  showHelperText?: boolean;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <div className="flex w-fit max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-fit shrink-0 rounded-full border-amber-200/80 bg-white/90 font-bold text-amber-900 shadow-sm hover:bg-amber-50"
          onClick={() => setOpen(true)}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Télécharger la carte
        </Button>
        {showHelperText ? (
          <p className="text-sm text-slate-500">
            Ouvre un aperçu de la carte ; vous pourrez l’enregistrer en PDF depuis le modal.
          </p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left">
            <DialogTitle className="text-lg font-extrabold text-slate-900">Carte de lecteur</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Aperçu au format carte bancaire (ISO ID-1). Le PDF reprend cette représentation à l’identique.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-8">
            <div
              ref={captureRef}
              id="lecteur-carte-capture"
              className="rounded-2xl shadow-2xl shadow-slate-900/25"
            >
              <LecteurCarteFace lecteur={lecteur} />
            </div>
          </div>

          <DialogFooter className="-mx-0 -mb-0 rounded-b-3xl border-t border-slate-100 bg-white px-4 py-4 sm:justify-center">
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
