"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CreditCard, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LecteurCarteFace } from "@/modules/lecteurs/components/LecteurCarteMembre";
import type { ApiLecteur } from "@/modules/lecteurs/lecteurViewUtils";
import {
  PARTICIPANT_CARDS_CAPTURE_BATCH_SIZE,
  appendCenteredCardToPdf,
  captureLecteurCartePng,
  createParticipantCardsPdfDocument,
  preloadParticipantCardAssets,
  waitForImagesInContainer,
} from "@/lib/activiteParticipantCardsExport";

const FILTER_ALL = "__all__";

type ParticipantCardRow = {
  paidAt: string;
  paroisseName?: string;
  vicariatName?: string;
  lecteur: ApiLecteur;
};

function safeExportFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim().slice(0, 48) || "activite";
}

function buildScopeSuffix(selectedVicariat: string, selectedParoisse: string) {
  const parts: string[] = [];
  if (selectedVicariat !== FILTER_ALL) parts.push(safeExportFileName(selectedVicariat));
  if (selectedParoisse !== FILTER_ALL) parts.push(safeExportFileName(selectedParoisse));
  return parts.length ? `-${parts.join("-")}` : "";
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

function nextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

type ActiviteCartesParticipantsPanelProps = {
  activiteId: string;
  activiteNom: string;
  canFilterVicariat: boolean;
};

export function ActiviteCartesParticipantsPanel({
  activiteId,
  activiteNom,
  canFilterVicariat,
}: ActiviteCartesParticipantsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantCardRow[]>([]);
  const [selectedVicariat, setSelectedVicariat] = useState(FILTER_ALL);
  const [selectedParoisse, setSelectedParoisse] = useState(FILTER_ALL);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [captureBatch, setCaptureBatch] = useState<ApiLecteur[] | null>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/activites/${encodeURIComponent(activiteId)}/participations?cards=1`);
      const data = await r.json().catch(() => ([]));
      setParticipants(Array.isArray(data) ? (data as ParticipantCardRow[]) : []);
    } catch {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [activiteId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const vicariatOptions = useMemo(
    () =>
      Array.from(new Set(participants.map((p) => p.vicariatName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [participants]
  );

  const paroisseOptions = useMemo(() => {
    const source =
      selectedVicariat === FILTER_ALL
        ? participants
        : participants.filter((p) => p.vicariatName === selectedVicariat);
    return Array.from(new Set(source.map((p) => p.paroisseName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
  }, [participants, selectedVicariat]);

  const filteredParticipants = useMemo(
    () =>
      participants.filter((p) => {
        if (selectedVicariat !== FILTER_ALL && p.vicariatName !== selectedVicariat) return false;
        if (selectedParoisse !== FILTER_ALL && p.paroisseName !== selectedParoisse) return false;
        return true;
      }),
    [participants, selectedVicariat, selectedParoisse]
  );

  useEffect(() => {
    if (selectedVicariat === FILTER_ALL) return;
    if (!vicariatOptions.includes(selectedVicariat)) {
      setSelectedVicariat(FILTER_ALL);
    }
  }, [selectedVicariat, vicariatOptions]);

  useEffect(() => {
    if (selectedParoisse === FILTER_ALL) return;
    if (!paroisseOptions.includes(selectedParoisse)) {
      setSelectedParoisse(FILTER_ALL);
    }
  }, [selectedParoisse, paroisseOptions]);

  const mountCaptureBatch = useCallback(async (batch: ApiLecteur[]) => {
    flushSync(() => setCaptureBatch(batch));
    await nextFrame();
    const container = captureContainerRef.current;
    if (!container) throw new Error("Capture indisponible");
    await waitForImagesInContainer(container);
    return Array.from(container.querySelectorAll<HTMLElement>("[data-card-capture]"));
  }, []);

  const clearCaptureBatch = useCallback(() => {
    flushSync(() => setCaptureBatch(null));
  }, []);

  const downloadCardsPdf = async () => {
    if (!filteredParticipants.length || generating) return;
    const lecteurs = filteredParticipants.map((p) => p.lecteur);

    setGenerating(true);
    setProgress({ current: 0, total: lecteurs.length });

    try {
      await preloadParticipantCardAssets(lecteurs);
      const pdf = await createParticipantCardsPdfDocument();

      for (let batchStart = 0; batchStart < lecteurs.length; batchStart += PARTICIPANT_CARDS_CAPTURE_BATCH_SIZE) {
        const batch = lecteurs.slice(batchStart, batchStart + PARTICIPANT_CARDS_CAPTURE_BATCH_SIZE);
        const cardRoots = await mountCaptureBatch(batch);

        if (cardRoots.length !== batch.length) {
          throw new Error("Préparation des cartes incomplète");
        }

        for (let index = 0; index < cardRoots.length; index += 1) {
          const globalIndex = batchStart + index;
          setProgress({ current: globalIndex + 1, total: lecteurs.length });
          const imgData = await captureLecteurCartePng(cardRoots[index], { skipImageWait: true });
          appendCenteredCardToPdf(pdf, imgData, { newPage: globalIndex > 0 });
        }

        clearCaptureBatch();
      }

      const base = safeExportFileName(activiteNom);
      const scopeSuffix = buildScopeSuffix(selectedVicariat, selectedParoisse);
      triggerBrowserDownload(pdf.output("blob"), `cartes-participants-${base}${scopeSuffix}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Impossible de générer le PDF des cartes. Réessayez.");
    } finally {
      clearCaptureBatch();
      setProgress(null);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Cartes participants
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Téléchargez un PDF avec une carte membre par participant inscrit et payé.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!loading ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                {filteredParticipants.length} carte{filteredParticipants.length > 1 ? "s" : ""}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-amber-900 hover:bg-amber-950 text-white"
              onClick={() => void downloadCardsPdf()}
              disabled={!filteredParticipants.length || loading || generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              {generating && progress
                ? `Génération ${progress.current}/${progress.total}…`
                : "Télécharger les cartes (PDF)"}
            </Button>
          </div>
        </div>

        {canFilterVicariat && participants.length > 0 ? (
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Vicariat</p>
              <Select
                value={selectedVicariat}
                onValueChange={(value) => {
                  setSelectedVicariat(value ?? FILTER_ALL);
                  setSelectedParoisse(FILTER_ALL);
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                  <SelectValue>
                    {selectedVicariat === FILTER_ALL ? "Tous les vicariats" : selectedVicariat}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Tous les vicariats</SelectItem>
                  {vicariatOptions.map((vicariat) => (
                    <SelectItem key={vicariat} value={vicariat}>
                      {vicariat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Paroisse</p>
              <Select value={selectedParoisse} onValueChange={(value) => setSelectedParoisse(value ?? FILTER_ALL)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                  <SelectValue>
                    {selectedParoisse === FILTER_ALL ? "Toutes les paroisses" : selectedParoisse}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Toutes les paroisses</SelectItem>
                  {paroisseOptions.map((paroisse) => (
                    <SelectItem key={paroisse} value={paroisse}>
                      {paroisse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : !canFilterVicariat && participants.length > 0 ? (
          <div className="mb-4 max-w-md">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Paroisse</p>
            <Select value={selectedParoisse} onValueChange={(value) => setSelectedParoisse(value ?? FILTER_ALL)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                <SelectValue>{selectedParoisse === FILTER_ALL ? "Toutes les paroisses" : selectedParoisse}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Toutes les paroisses</SelectItem>
                {paroisseOptions.map((paroisse) => (
                  <SelectItem key={paroisse} value={paroisse}>
                    {paroisse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
          </div>
        ) : participants.length === 0 ? (
          <p className="text-sm text-slate-500">
            {canFilterVicariat
              ? "Aucune participation payée sur cette activité pour le moment."
              : "Aucune participation payée dans votre vicariat sur cette activité pour le moment."}
          </p>
        ) : filteredParticipants.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun participant ne correspond aux filtres sélectionnés.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto space-y-2 text-sm">
            {filteredParticipants.map((p) => (
              <li key={p.lecteur._id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {p.lecteur.nom} {p.lecteur.prenoms}
                  </p>
                  {p.paroisseName ? (
                    <p className="text-xs text-slate-500">{p.paroisseName}</p>
                  ) : null}
                </div>
                <span className="text-slate-500 shrink-0 font-mono text-xs">{p.lecteur.uniqueId}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={captureContainerRef}
        className="pointer-events-none fixed left-[-9999px] top-0"
        aria-hidden
      >
        {captureBatch?.map((lecteur) => (
          <div key={lecteur._id} data-card-capture>
            <LecteurCarteFace lecteur={lecteur} />
          </div>
        ))}
      </div>
    </div>
  );
}
