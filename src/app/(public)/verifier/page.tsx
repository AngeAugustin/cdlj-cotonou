"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Camera, CheckCircle2, Loader2, QrCode, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

type ActiviteOption = {
  _id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
};

type PresenceParticipant = {
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
  };
  grade?: { name?: string; abbreviation?: string } | null;
  paroisseName?: string | null;
  vicariatName?: string | null;
  alreadyPresent: boolean;
  validatedAt?: string | null;
  paidAt?: string;
};

type ScanFeedback = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  participant?: PresenceParticipant | null;
  validatedAt?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
}

function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy", { locale: fr });
}

function formatActivityOptionLabel(activite: ActiviteOption) {
  const start = formatDateOnly(activite.dateDebut);
  const end = formatDateOnly(activite.dateFin);
  return `${activite.nom} · ${start} - ${end}`;
}

export default function VerifierPresencePage() {
  const [activites, setActivites] = useState<ActiviteOption[]>([]);
  const [loadingActivites, setLoadingActivites] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedActiviteId, setSelectedActiviteId] = useState("");
  const [scannerPaused, setScannerPaused] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [processingScan, setProcessingScan] = useState(false);
  const [confirmingPresence, setConfirmingPresence] = useState(false);
  const [pendingParticipant, setPendingParticipant] = useState<PresenceParticipant | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [toast, setToast] = useState<ScanFeedback | null>(null);
  const [manualUniqueId, setManualUniqueId] = useState("");
  const [scannerSessionKey, setScannerSessionKey] = useState(0);
  const resumeTimerRef = useRef<number | null>(null);

  const selectedActivite = useMemo(
    () => activites.find((activite) => activite._id === selectedActiviteId) ?? null,
    [activites, selectedActiviteId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadActivites() {
      setLoadingActivites(true);
      setLoadingError(null);
      try {
        const response = await fetch("/api/public/activites");
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Impossible de charger les activités.");
        }

        if (!cancelled) {
          setActivites(Array.isArray(data) ? (data as ActiviteOption[]) : []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadingError(error instanceof Error ? error.message : "Impossible de charger les activités.");
          setActivites([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingActivites(false);
        }
      }
    }

    void loadActivites();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  function clearResumeTimer() {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }

  function restartScanner(options?: { clearFeedback?: boolean; delayMs?: number }) {
    const { clearFeedback = false, delayMs = 0 } = options ?? {};

    clearResumeTimer();

    const resume = () => {
      resumeTimerRef.current = null;
      setPendingParticipant(null);
      setConfirmOpen(false);
      if (clearFeedback) setFeedback(null);
      setProcessingScan(false);
      setConfirmingPresence(false);
      setScanError(null);
      setManualUniqueId("");
      setScannerSessionKey((current) => current + 1);
      setScannerPaused(!selectedActiviteId);
    };

    if (delayMs > 0) {
      resumeTimerRef.current = window.setTimeout(resume, delayMs);
      return;
    }

    resume();
  }

  function resetScannerSession() {
    setToast(null);
    restartScanner({ clearFeedback: true });
  }

  function handleActivityChange(value: string | null) {
    const nextValue = value ?? "";
    clearResumeTimer();
    setSelectedActiviteId(nextValue);
    setPendingParticipant(null);
    setConfirmOpen(false);
    setFeedback(null);
    setToast(null);
    setScanError(null);
    setProcessingScan(false);
    setConfirmingPresence(false);
    setManualUniqueId("");
    setScannerSessionKey((current) => current + 1);
    setScannerPaused(!nextValue);
  }

  async function handleDetectedUniqueId(rawValue: string) {
    if (!selectedActiviteId || processingScan || confirmingPresence || confirmOpen) return;

    clearResumeTimer();
    const uniqueId = rawValue.trim();
    if (!uniqueId) return;

    setScannerPaused(true);
    setProcessingScan(true);
    setScanError(null);
    setPendingParticipant(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/public/activites/${encodeURIComponent(selectedActiviteId)}/presence/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback({
          type: "error",
          title: "Lecteur non trouvé",
          message:
            typeof data?.message === "string"
              ? data.message
              : typeof data?.error === "string"
                ? data.error
                : "Impossible de vérifier ce QR code pour cette activité.",
        });
        restartScanner({ delayMs: 1200 });
        return;
      }

      const participant = data?.participant as PresenceParticipant | undefined;
      if (!participant) {
        setFeedback({
          type: "error",
          title: "Réponse invalide",
          message: "La vérification du lecteur a échoué.",
        });
        restartScanner({ delayMs: 1200 });
        return;
      }

      if (participant.alreadyPresent) {
        setFeedback({
          type: "info",
          title: "Présence déjà validée",
          message: typeof data?.message === "string" ? data.message : "La présence a déjà été enregistrée.",
          participant,
          validatedAt: participant.validatedAt ?? null,
        });
        restartScanner({ delayMs: 1500 });
        return;
      }

      setPendingParticipant(participant);
      setConfirmOpen(true);
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        title: "Erreur réseau",
        message: error instanceof Error ? error.message : "La vérification a échoué.",
      });
      restartScanner({ delayMs: 1200 });
    } finally {
      setManualUniqueId("");
      setProcessingScan(false);
    }
  }

  async function confirmPresence() {
    if (!selectedActiviteId || !pendingParticipant) return;

    setConfirmingPresence(true);
    try {
      const response = await fetch(`/api/public/activites/${encodeURIComponent(selectedActiviteId)}/presence/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: pendingParticipant.lecteur.uniqueId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "La validation de présence a échoué.");
      }

      const participant = (data?.participant as PresenceParticipant | undefined) ?? pendingParticipant;
      const nextFeedback = {
        type: data?.status === "already_present" ? "info" : "success",
        title: data?.status === "already_present" ? "Présence déjà validée" : "Présence enregistrée",
        message:
          typeof data?.message === "string"
            ? data.message
            : data?.status === "already_present"
              ? "La présence de ce lecteur était déjà validée."
              : "La présence de ce lecteur a été enregistrée avec succès.",
        participant,
        validatedAt: typeof data?.validatedAt === "string" ? data.validatedAt : participant.validatedAt ?? null,
      } satisfies ScanFeedback;
      setFeedback(nextFeedback);
      setToast(
        nextFeedback.type === "success"
          ? {
              ...nextFeedback,
              title: "Lecteur validé",
              message: `${participant.lecteur.nom} ${participant.lecteur.prenoms} a été validé.`,
            }
          : nextFeedback
      );
      setPendingParticipant(null);
      setConfirmOpen(false);
      restartScanner({ delayMs: 1200 });
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        title: "Validation impossible",
        message: error instanceof Error ? error.message : "La validation de présence a échoué.",
        participant: pendingParticipant,
      });
      restartScanner({ delayMs: 1200 });
    } finally {
      setConfirmingPresence(false);
    }
  }

  return (
    <div className="relative overflow-hidden bg-slate-50">
      {toast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-50 max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-950"
                : toast.type === "info"
                  ? "border-amber-200 bg-amber-50/95 text-amber-950"
                  : "border-red-200 bg-red-50/95 text-red-950"
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    toast.type === "info" ? "text-amber-700" : "text-red-600"
                  }`}
                />
              )}
              <div className="min-w-0">
                <p className="font-bold">{toast.title}</p>
                <p className="mt-1 text-sm">{toast.message}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute left-0 right-0 top-0 h-[28rem] bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950" />
      <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
      <div className="absolute -right-10 top-20 h-72 w-72 rounded-full bg-white/10 blur-[110px]" />

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
            <UserCheck className="h-4 w-4" />
            Vérification des présences
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Scanner une carte lecteur</h1>
          <p className="mt-4 text-sm leading-7 text-amber-50/90 sm:text-base">
            Choisissez l’activité concernée, scannez le QR code présent sur la carte du lecteur puis confirmez sa
            présence.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-900">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Page publique Vérifier</h2>
                <p className="text-sm text-slate-500">Cette page peut être utilisée sans connexion.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Activité</p>
                <Select value={selectedActiviteId} onValueChange={handleActivityChange} disabled={loadingActivites}>
                  <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white px-4">
                    <SelectValue>
                      {selectedActivite ? selectedActivite.nom : "Choisir une activité"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activites.map((activite) => (
                      <SelectItem key={activite._id} value={activite._id}>
                        {formatActivityOptionLabel(activite)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingActivites ? (
                  <p className="mt-2 text-sm text-slate-500">Chargement des activités...</p>
                ) : loadingError ? (
                  <p className="mt-2 text-sm text-red-600">{loadingError}</p>
                ) : activites.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Aucune activité disponible pour la vérification.</p>
                ) : null}
              </div>

              {selectedActivite ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-bold text-slate-900">{selectedActivite.nom}</p>
                  <p className="mt-1">
                    {format(new Date(selectedActivite.dateDebut), "PPP", { locale: fr })} au{" "}
                    {format(new Date(selectedActivite.dateFin), "PPP", { locale: fr })} · {selectedActivite.lieu}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4" />
                  Lecteur QR code
                </div>
                {processingScan ? (
                  <div className="flex items-center gap-2 text-xs text-amber-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Vérification...
                  </div>
                ) : null}
              </div>

              <div className="relative aspect-square w-full bg-slate-950">
                {!selectedActiviteId ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
                    <QrCode className="h-12 w-12 text-amber-300/90" />
                    <p className="max-w-sm text-sm leading-6">
                      Sélectionnez d’abord une activité pour activer le lecteur et commencer la vérification.
                    </p>
                  </div>
                ) : (
                  <Scanner
                    key={scannerSessionKey}
                    paused={scannerPaused}
                    allowMultiple={false}
                    sound={false}
                    scanDelay={1000}
                    constraints={{ facingMode: { ideal: "environment" } }}
                    onScan={(detectedCodes) => {
                      const firstCode = detectedCodes[0]?.rawValue;
                      if (firstCode) {
                        void handleDetectedUniqueId(firstCode);
                      }
                    }}
                    onError={(error) => {
                      setScannerPaused(true);
                      setScanError(error instanceof Error ? error.message : "Impossible d’accéder à la caméra.");
                    }}
                  />
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Saisie manuelle</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Si la caméra est bloquée, saisissez le `uniqueId` du lecteur pour effectuer la même vérification.
                  </p>
                </div>
              </div>

              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleDetectedUniqueId(manualUniqueId);
                }}
              >
                <Input
                  value={manualUniqueId}
                  onChange={(event) => setManualUniqueId(event.target.value)}
                  placeholder="Ex: CDLJ-00125"
                  className="h-11 rounded-xl border-slate-200 bg-white px-4"
                  disabled={!selectedActiviteId || processingScan || confirmingPresence}
                />
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
                  disabled={!selectedActiviteId || !manualUniqueId.trim() || processingScan || confirmingPresence}
                >
                  {processingScan ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vérifier le matricule"}
                </Button>
              </form>

              <p className="mt-3 text-xs text-slate-500">
                En développement, utilisez `https://localhost:3000/verifier`. Le script `npm run dev` lance maintenant
                automatiquement l’application en HTTPS.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={resetScannerSession}
                disabled={!selectedActiviteId}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reprendre un scan
              </Button>
            </div>

            {scanError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {scanError}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60">
              <h2 className="text-lg font-extrabold text-slate-900">Mode d’emploi</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>1. Choisir l’activité concernée.</li>
                <li>2. Autoriser l’accès à la caméra si le navigateur le demande.</li>
                <li>3. Présenter le QR code de la carte du lecteur devant la caméra.</li>
                <li>4. Vérifier les informations affichées puis cliquer sur OK pour confirmer la présence.</li>
              </ol>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60">
              <h2 className="text-lg font-extrabold text-slate-900">Dernier résultat</h2>
              {!feedback ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                  Aucun lecteur scanné pour le moment.
                </div>
              ) : (
                <div
                  className={`mt-4 rounded-2xl border px-5 py-4 ${
                    feedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50"
                      : feedback.type === "info"
                        ? "border-amber-200 bg-amber-50"
                        : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle
                        className={`mt-0.5 h-5 w-5 shrink-0 ${
                          feedback.type === "info" ? "text-amber-700" : "text-red-600"
                        }`}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{feedback.title}</p>
                      <p className="mt-1 text-sm text-slate-700">{feedback.message}</p>
                    </div>
                  </div>

                  {feedback.participant ? (
                    <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-700">
                      <p className="font-bold text-slate-900">
                        {feedback.participant.lecteur.nom} {feedback.participant.lecteur.prenoms}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{feedback.participant.lecteur.uniqueId}</p>
                      <p className="mt-2">
                        {feedback.participant.grade?.name ||
                          feedback.participant.grade?.abbreviation ||
                          "Grade non renseigné"}
                      </p>
                      <p className="mt-1">
                        {feedback.participant.paroisseName || "Paroisse inconnue"}
                        {feedback.participant.vicariatName ? ` · ${feedback.participant.vicariatName}` : ""}
                      </p>
                      {feedback.validatedAt ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Présence validée le {formatDateTime(feedback.validatedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && !confirmingPresence) {
            restartScanner();
          }
        }}
      >
        <DialogContent className="rounded-[1.75rem] border-0 p-0 sm:max-w-lg" showCloseButton={!confirmingPresence}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Confirmer la présence</DialogTitle>
            <DialogDescription>
              Vérifiez que la carte correspond bien au lecteur identifié avant de valider sa présence.
            </DialogDescription>
          </DialogHeader>

          {pendingParticipant ? (
            <div className="px-6 pb-2">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-slate-700">
                <p className="font-bold text-slate-900">
                  {pendingParticipant.lecteur.nom} {pendingParticipant.lecteur.prenoms}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">{pendingParticipant.lecteur.uniqueId}</p>
                <p className="mt-3">
                  {pendingParticipant.grade?.name ||
                    pendingParticipant.grade?.abbreviation ||
                    "Grade non renseigné"}
                </p>
                <p className="mt-1">
                  {pendingParticipant.paroisseName || "Paroisse inconnue"}
                  {pendingParticipant.vicariatName ? ` · ${pendingParticipant.vicariatName}` : ""}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="rounded-b-[1.75rem] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={confirmingPresence}
              onClick={() => {
                setConfirmOpen(false);
                setPendingParticipant(null);
                restartScanner();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              disabled={confirmingPresence}
              onClick={() => void confirmPresence()}
            >
              {confirmingPresence ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
