"use client";

import { use as usePromise, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle,
  Activity,
  Users,
  FileSpreadsheet,
  FileText,
  Banknote,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  generateActiviteParticipantsExcel,
  generateActiviteParticipantsPdf,
} from "@/lib/activiteParticipantsExport";
import { computeMontantApplicable } from "@/modules/activites/penalites";
import { GrillePenaliteDisplay } from "@/modules/activites/components/GrillePenaliteDisplay";
import { ActiviteStatsPanel } from "@/modules/activites/components/ActiviteStatsPanel";

type Activite = {
  _id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
  delaiPaiement: string;
  grillePenalite?: {
    dateDebut: string;
    dateFin: string;
    montantSupplementaire: number;
  }[];
  image?: string;
  terminee: boolean;
};

type ParticipantRow = {
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

type PresenceRow = {
  validatedAt: string;
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

type PaiementRow = {
  _id: string;
  createdAt?: string;
  status: string;
  gatewayStatus?: string | null;
  statusReason?: string | null;
  lastWebhookEvent?: string | null;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  fedapayReference?: string | null;
  paroisseName?: string;
  userEmail?: string;
  lecteurs?: { _id: string; nom: string; prenoms: string; uniqueId: string }[];
};

type PaiementViewFilter = "all" | "approved" | "open";

function isPaymentAnomaly(p: Pick<PaiementRow, "status" | "statusReason">) {
  return (
    p.status === "non_finalized" ||
    p.status === "approved_pending_registration" ||
    p.status === "failed" ||
    p.statusReason === "partial_refund_not_supported"
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function safeExportFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim().slice(0, 48) || "activite";
}

function formatPaidAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

function humanizePaymentAnomalyCause(p: Pick<PaiementRow, "status" | "gatewayStatus" | "statusReason" | "lastWebhookEvent">) {
  const reason = (p.statusReason ?? "").trim();
  const gatewayStatus = (p.gatewayStatus ?? "").trim();
  const lastEvent = (p.lastWebhookEvent ?? "").trim();

  if (reason === "gateway_pending_timeout") {
    return "Le paiement est resté en attente trop longtemps sans statut final exploitable côté FedaPay.";
  }
  if (reason === "missing_fedapay_transaction_id") {
    return "Le paiement local a été créé, mais aucune transaction FedaPay exploitable n’a été liée à ce dossier.";
  }
  if (reason === "fedapay_transaction_id_invalid") {
    return "FedaPay a renvoyé une transaction invalide ou incomplète lors de l’initialisation.";
  }
  if (reason === "customer_create_invalid") {
    return "La création ou la récupération du client FedaPay a échoué.";
  }
  if (reason === "partial_refund_not_supported") {
    return "FedaPay a signalé un remboursement partiel, mais ce cas n’est pas pris en charge par la politique métier actuelle.";
  }
  if (reason) {
    return reason;
  }
  if (p.status === "approved_pending_registration") {
    return gatewayStatus
      ? `FedaPay a confirmé le paiement (${gatewayStatus}), mais la finalisation locale des inscriptions n’a pas abouti.`
      : "Le paiement a été confirmé, mais la finalisation locale des inscriptions n’a pas abouti.";
  }
  if (p.status === "non_finalized") {
    return gatewayStatus
      ? `Le statut FedaPay est resté "${gatewayStatus}" sans résolution finale exploitable dans les délais.`
      : "Aucun statut final exploitable n’a été confirmé dans les délais.";
  }
  if (p.status === "failed") {
    return lastEvent
      ? `Une erreur technique est survenue pendant le traitement (${lastEvent}).`
      : "Une erreur technique est survenue pendant la préparation ou l’initialisation du paiement.";
  }
  if (gatewayStatus) {
    return `Dernier statut remonté par FedaPay : ${gatewayStatus}.`;
  }
  if (lastEvent) {
    return `Dernier événement traité : ${lastEvent}.`;
  }
  return "Cause non déterminée avec certitude. Vérifier la passerelle et les traces techniques.";
}

/** Téléchargement direct dans le dossier Téléchargements (sans ouvrir un onglet ni « Enregistrer sous »). */
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

const PARTICIPANT_FILTER_ALL = "__all__";

function buildParticipantExportScopeSuffix(selectedVicariat: string, selectedParoisse: string) {
  const parts: string[] = [];
  if (selectedVicariat !== PARTICIPANT_FILTER_ALL) parts.push(safeExportFileName(selectedVicariat));
  if (selectedParoisse !== PARTICIPANT_FILTER_ALL) parts.push(safeExportFileName(selectedParoisse));
  return parts.length ? `-${parts.join("-")}` : "";
}

export default function ActiviteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params);
  const activiteId = resolvedParams.id;
  const { data: session, status } = useSession();
  const roles: string[] = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []) as string[];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isDiocesain = isManager;
  const isSuperAdmin = roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activite, setActivite] = useState<Activite | null>(null);

  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const [confirmTermineeOpen, setConfirmTermineeOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const [tab, setTab] = useState<"infos" | "statistiques" | "participation" | "presence" | "paiements" | "anomalies">("infos");
  const [paiements, setPaiements] = useState<PaiementRow[]>([]);
  const [paiementsLoading, setPaiementsLoading] = useState(false);
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null);
  const [paiementViewFilter, setPaiementViewFilter] = useState<PaiementViewFilter>("all");
  const [finalizingPaiementId, setFinalizingPaiementId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [meData, setMeData] = useState<{ paroisseName?: string; vicariatName?: string } | null>(null);
  const [selectedVicariat, setSelectedVicariat] = useState(PARTICIPANT_FILTER_ALL);
  const [selectedParoisse, setSelectedParoisse] = useState(PARTICIPANT_FILTER_ALL);
  const [presencesLoading, setPresencesLoading] = useState(false);
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [selectedPresenceVicariat, setSelectedPresenceVicariat] = useState(PARTICIPANT_FILTER_ALL);
  const [selectedPresenceParoisse, setSelectedPresenceParoisse] = useState(PARTICIPANT_FILTER_ALL);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!activiteId) return;
    setLoading(true);
    setLoadError(null);

    void fetch(`/api/activites/${encodeURIComponent(activiteId)}`)
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (!data?._id) throw new Error(data?.error ?? "Impossible de charger l'activité");
        setActivite(data as Activite);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [status, activiteId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const tabParam = sp.get("tab");
    const paymentIdParam = sp.get("paymentId");
    if (tabParam === "paiements") setTab("paiements");
    if (paymentIdParam) setSelectedPaiementId(paymentIdParam);
  }, []);

  /** Données paroisse/vicariat de l’utilisateur paroissial (pour le PDF). */
  useEffect(() => {
    if (!isParoissial) return;
    void fetch("/api/me")
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        const paroisseName =
          data?.parishId && typeof data.parishId === "object" ? data.parishId.name : undefined;
        const vicariatName =
          data?.vicariatId && typeof data.vicariatId === "object"
            ? data.vicariatId.name
            : data?.parishId?.vicariatId && typeof data.parishId.vicariatId === "object"
              ? data.parishId.vicariatId.name
              : undefined;
        setMeData({ paroisseName, vicariatName });
      })
      .catch(() => {});
  }, [isParoissial]);

  const canSeeParticipants = isParoissial || isManager || isVicarial;
  const canSeePresence = isManager;

  const vicariatOptions = useMemo(
    () =>
      Array.from(new Set(participants.map((p) => p.vicariatName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [participants]
  );

  const paroisseOptions = useMemo(() => {
    const source =
      selectedVicariat === PARTICIPANT_FILTER_ALL
        ? participants
        : participants.filter((p) => p.vicariatName === selectedVicariat);
    return Array.from(new Set(source.map((p) => p.paroisseName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
  }, [participants, selectedVicariat]);

  const filteredParticipants = useMemo(
    () =>
      participants.filter((p) => {
        if (selectedVicariat !== PARTICIPANT_FILTER_ALL && p.vicariatName !== selectedVicariat) return false;
        if (selectedParoisse !== PARTICIPANT_FILTER_ALL && p.paroisseName !== selectedParoisse) return false;
        return true;
      }),
    [participants, selectedVicariat, selectedParoisse]
  );

  const presenceVicariatOptions = useMemo(
    () =>
      Array.from(new Set(presences.map((p) => p.vicariatName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [presences]
  );

  const presenceParoisseOptions = useMemo(() => {
    const source =
      selectedPresenceVicariat === PARTICIPANT_FILTER_ALL
        ? presences
        : presences.filter((p) => p.vicariatName === selectedPresenceVicariat);
    return Array.from(new Set(source.map((p) => p.paroisseName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
  }, [presences, selectedPresenceVicariat]);

  const filteredPresences = useMemo(
    () =>
      presences.filter((p) => {
        if (selectedPresenceVicariat !== PARTICIPANT_FILTER_ALL && p.vicariatName !== selectedPresenceVicariat) return false;
        if (selectedPresenceParoisse !== PARTICIPANT_FILTER_ALL && p.paroisseName !== selectedPresenceParoisse) return false;
        return true;
      }),
    [presences, selectedPresenceVicariat, selectedPresenceParoisse]
  );

  const refreshParticipants = useCallback(async () => {
    if (!activiteId || !canSeeParticipants) return;
    setParticipantsLoading(true);
    try {
      const r = await fetch(`/api/activites/${encodeURIComponent(activiteId)}/participations`);
      const data = await r.json().catch(() => ([]));
      setParticipants(Array.isArray(data) ? (data as ParticipantRow[]) : []);
    } catch {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [activiteId, canSeeParticipants]);

  const refreshPresences = useCallback(async () => {
    if (!activiteId || !canSeePresence) return;
    setPresencesLoading(true);
    try {
      const r = await fetch(`/api/activites/${encodeURIComponent(activiteId)}/presences`);
      const data = await r.json().catch(() => ([]));
      setPresences(Array.isArray(data) ? (data as PresenceRow[]) : []);
    } catch {
      setPresences([]);
    } finally {
      setPresencesLoading(false);
    }
  }, [activiteId, canSeePresence]);

  const refreshPaiements = useCallback(async () => {
    if (!activite || (tab !== "paiements" && tab !== "anomalies")) return;
    if (!isManager && !isVicarial && !isParoissial) return;
    setPaiementsLoading(true);
    try {
      const r = await fetch(`/api/activites/${encodeURIComponent(activite._id)}/paiements`);
      const data = await r.json().catch(() => ([]));
      setPaiements(Array.isArray(data) ? (data as PaiementRow[]) : []);
    } catch {
      setPaiements([]);
    } finally {
      setPaiementsLoading(false);
    }
  }, [activite, tab, isManager, isVicarial, isParoissial]);

  /** Liste des participants payés : paroisse pour PAROISSIAL, vicariat pour VICARIAL, activité entière pour manager. */
  useEffect(() => {
    if (!activite || !canSeeParticipants) return;
    void refreshParticipants();
  }, [activite, canSeeParticipants, refreshParticipants]);

  useEffect(() => {
    if (!activite || !canSeePresence || tab !== "presence") return;
    void refreshPresences();
  }, [activite, canSeePresence, tab, refreshPresences]);

  useEffect(() => {
    if (selectedVicariat === PARTICIPANT_FILTER_ALL) return;
    if (!vicariatOptions.includes(selectedVicariat)) {
      setSelectedVicariat(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedVicariat, vicariatOptions]);

  useEffect(() => {
    if (selectedParoisse === PARTICIPANT_FILTER_ALL) return;
    if (!paroisseOptions.includes(selectedParoisse)) {
      setSelectedParoisse(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedParoisse, paroisseOptions]);

  useEffect(() => {
    if (selectedPresenceVicariat === PARTICIPANT_FILTER_ALL) return;
    if (!presenceVicariatOptions.includes(selectedPresenceVicariat)) {
      setSelectedPresenceVicariat(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedPresenceVicariat, presenceVicariatOptions]);

  useEffect(() => {
    if (selectedPresenceParoisse === PARTICIPANT_FILTER_ALL) return;
    if (!presenceParoisseOptions.includes(selectedPresenceParoisse)) {
      setSelectedPresenceParoisse(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedPresenceParoisse, presenceParoisseOptions]);

  useEffect(() => {
    if (!activite || (tab !== "paiements" && tab !== "anomalies")) return;
    if (!isManager && !isVicarial && !isParoissial) return;
    void refreshPaiements();
  }, [activite, tab, isManager, isVicarial, isParoissial, refreshPaiements]);

  useEffect(() => {
    if (typeof window === "undefined" || paiements.length === 0) return;
    const paymentIdParam = new URLSearchParams(window.location.search).get("paymentId");
    if (paymentIdParam && paiements.some((p) => p._id === paymentIdParam)) {
      setSelectedPaiementId(paymentIdParam);
    }
  }, [paiements]);

  useEffect(() => {
    if (!selectedPaiementId) return;
    const stillSelectable = paiements.some((p) => p._id === selectedPaiementId && p.status === "approved");
    if (!stillSelectable) {
      setSelectedPaiementId(null);
    }
  }, [paiements, selectedPaiementId]);

  const montantApplicable = useMemo(() => {
    if (!activite) return 0;
    return computeMontantApplicable(activite.montant, activite.delaiPaiement, activite.grillePenalite);
  }, [activite]);

  const paiementCounts = useMemo(
    () => ({
      all: paiements.length,
      anomalies: paiements.filter(isPaymentAnomaly).length,
      approved: paiements.filter((p) => p.status === "approved").length,
      open: paiements.filter((p) => p.status === "pending").length,
      failed: paiements.filter((p) => p.status === "failed").length,
      toFinalize: paiements.filter((p) => p.status === "approved_pending_registration").length,
      nonFinalized: paiements.filter((p) => p.status === "non_finalized").length,
    }),
    [paiements]
  );

  const anomalyPaiements = useMemo(() => paiements.filter(isPaymentAnomaly), [paiements]);

  const visiblePaiements = useMemo(() => {
    if (paiementViewFilter === "approved") {
      return paiements.filter((p) => p.status === "approved");
    }
    if (paiementViewFilter === "open") {
      return paiements.filter((p) => p.status === "pending");
    }
    return paiements;
  }, [paiements, paiementViewFilter]);

  const listedPaiements = useMemo(
    () => (tab === "anomalies" && isSuperAdmin ? anomalyPaiements : visiblePaiements),
    [tab, isSuperAdmin, anomalyPaiements, visiblePaiements]
  );

  useEffect(() => {
    if (!isSuperAdmin && tab === "anomalies") {
      setTab("paiements");
    }
  }, [isSuperAdmin, tab]);

  useEffect(() => {
    if (!canSeePresence && tab === "presence") {
      setTab("infos");
    }
  }, [canSeePresence, tab]);

  useEffect(() => {
    if (!isDiocesain && tab === "statistiques") {
      setTab("infos");
    }
  }, [isDiocesain, tab]);

  useEffect(() => {
    if (!selectedPaiementId) return;
    const stillVisible = listedPaiements.some((p) => p._id === selectedPaiementId && p.status === "approved");
    if (!stillVisible) {
      setSelectedPaiementId(null);
    }
  }, [listedPaiements, selectedPaiementId]);

  const terminerActivite = async () => {
    if (!activite) return;
    setTerminating(true);
    try {
      const res = await fetch(`/api/activites/${encodeURIComponent(activite._id)}/terminer`, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur");
      }
      setActivite((prev) => (prev ? { ...prev, terminee: true } : prev));
      setConfirmTermineeOpen(false);
      showToast("Activité marquée comme terminée");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setTerminating(false);
    }
  };

  const finalizePaiementManually = async (paymentId: string) => {
    if (!activite || !isSuperAdmin) return;
    setFinalizingPaiementId(paymentId);
    try {
      const res = await fetch(
        `/api/activites/${encodeURIComponent(activite._id)}/paiements/${encodeURIComponent(paymentId)}/finalize`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "La reprise manuelle a échoué.");
      }
      showToast(typeof data?.message === "string" ? data.message : "Finalisation relancée avec succès.");
      await Promise.all([refreshPaiements(), refreshParticipants()]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "La reprise manuelle a échoué.", "error");
    } finally {
      setFinalizingPaiementId(null);
    }
  };

  const downloadParticipantsExcel = (rows: ParticipantRow[]) => {
    if (!activite || !rows.length) return;
    const blob = generateActiviteParticipantsExcel(rows, {
      filterVicariat: selectedVicariat !== PARTICIPANT_FILTER_ALL ? selectedVicariat : null,
      filterParoisse: selectedParoisse !== PARTICIPANT_FILTER_ALL ? selectedParoisse : null,
      accountVicariat: meData?.vicariatName ?? null,
      accountParoisse: meData?.paroisseName ?? null,
    });
    const base = safeExportFileName(activite.nom);
    const scopeSuffix = buildParticipantExportScopeSuffix(selectedVicariat, selectedParoisse);
    triggerBrowserDownload(blob, `participants-${base}${scopeSuffix}.xlsx`);
  };

  const downloadParticipantsPdf = async (rows: ParticipantRow[]) => {
    if (!activite || !rows.length) return;

    const blob = await generateActiviteParticipantsPdf(
      {
        id: activite._id,
        nom: activite.nom,
        dateDebut: activite.dateDebut,
        dateFin: activite.dateFin,
        lieu: activite.lieu,
        montant: activite.montant,
      },
      rows,
      {
        filterVicariat: selectedVicariat !== PARTICIPANT_FILTER_ALL ? selectedVicariat : null,
        filterParoisse: selectedParoisse !== PARTICIPANT_FILTER_ALL ? selectedParoisse : null,
        accountVicariat: meData?.vicariatName ?? null,
        accountParoisse: meData?.paroisseName ?? null,
      }
    );

    const base = safeExportFileName(activite.nom);
    const scopeSuffix = buildParticipantExportScopeSuffix(selectedVicariat, selectedParoisse);
    triggerBrowserDownload(blob, `participants-${base}${scopeSuffix}.pdf`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-red-100 shadow-xl text-red-800">
        {loadError}
      </div>
    );
  }

  if (!activite) return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
          {toast.message}
        </div>
      ) : null}

      <div className="min-h-screen pb-16">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <Button
              variant="outline"
              title="Retour à la liste"
              aria-label="Retour à la liste"
              className="inline-flex h-9 w-9 lg:h-9 lg:w-fit items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-0 lg:px-3.5 text-xs font-semibold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 group"
              onClick={() => router.push("/activites")}
            >
              <ArrowLeft className="h-3.5 w-3.5 lg:transition-transform lg:group-hover:-translate-x-0.5" />
              <span className="hidden lg:inline">Retour</span>
            </Button>

            {isManager && !activite.terminee ? (
              <Button
                type="button"
                title="Marquer comme terminée"
                aria-label="Marquer comme terminée"
                className="h-9 rounded-full bg-emerald-700 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800"
                onClick={() => setConfirmTermineeOpen(true)}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Terminer
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="relative h-28 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-32 md:w-36">
              {activite.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activite.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/80">
                  <Activity className="h-8 w-8 text-amber-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-white/20" />
              <span
                className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                  activite.terminee ? "bg-white/90 text-slate-600" : "bg-white/95 text-amber-900 shadow-sm"
                }`}
              >
                {!activite.terminee ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> : null}
                {activite.terminee ? "Terminée" : "En cours"}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 sm:p-4 md:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70">Fiche activité</p>
                <h1 className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                  {activite.nom}
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Période</p>
                    <p className="text-xs font-medium text-slate-800">
                      {format(new Date(activite.dateDebut), "d MMM yyyy", { locale: fr })}
                      <span className="mx-1 text-slate-300">→</span>
                      {format(new Date(activite.dateFin), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lieu</p>
                    <p className="truncate text-xs font-medium text-slate-800">{activite.lieu || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                  <Banknote className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tarif actuel</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {montantApplicable === 0 ? "Gratuit" : formatMoney(montantApplicable)}
                    </p>
                    {montantApplicable !== activite.montant && activite.montant > 0 ? (
                      <p className="text-[10px] text-slate-500">Initial : {formatMoney(activite.montant)}</p>
                    ) : null}
                  </div>
                </div>

                {!activite.terminee ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-2.5 py-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700/70">Délai paiement</p>
                      <p className="truncate text-xs font-medium text-amber-950">
                        {format(new Date(activite.delaiPaiement), "d MMM yyyy · HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Statut</p>
                      <p className="text-xs font-medium text-slate-600">Activité clôturée</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("infos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "infos" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Informations
          </button>
          {isDiocesain ? (
            <button
              type="button"
              onClick={() => setTab("statistiques")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "statistiques" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setTab("participation")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "participation" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Participation
          </button>
          {isManager ? (
            <button
              type="button"
              onClick={() => setTab("presence")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "presence" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Présence
            </button>
          ) : null}
          {(isManager || isVicarial || isParoissial) && (
            <button
              type="button"
              onClick={() => setTab("paiements")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "paiements" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Banknote className="w-4 h-4" />
              Paiements
            </button>
          )}
          {isSuperAdmin && (isManager || isVicarial || isParoissial) ? (
            <button
              type="button"
              onClick={() => setTab("anomalies")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "anomalies" ? "bg-white text-red-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-700" />
              Anomalies détectées
              {paiementCounts.anomalies > 0 ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-800">
                  {paiementCounts.anomalies}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>

        {tab === "paiements" || (tab === "anomalies" && isSuperAdmin) ? (
          <div className="space-y-5">
            {tab === "paiements" ? (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-amber-900" />
                      Paiements enregistrés
                    </h2>
                    {paiements.length > 0 && (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {visiblePaiements.length} / {paiements.length} transaction{paiements.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaiementViewFilter("all")}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        paiementViewFilter === "all"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Tous ({paiementCounts.all})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaiementViewFilter("open")}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        paiementViewFilter === "open"
                          ? "bg-amber-700 text-white"
                          : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                      }`}
                    >
                      En attente ({paiementCounts.open})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaiementViewFilter("approved")}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        paiementViewFilter === "approved"
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      Approuvés ({paiementCounts.approved})
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-700" />
                      Anomalies détectées
                    </h2>
                    {anomalyPaiements.length > 0 && (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {anomalyPaiements.length} transaction{anomalyPaiements.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {paiementCounts.anomalies > 0 ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-800">Anomalies de paiement détectées</p>
                      <p className="text-xs text-red-700">
                        {paiementCounts.toFinalize} à finaliser, {paiementCounts.nonFinalized} non finalisé(s),{" "}
                        {paiementCounts.failed} échec(s)
                      </p>
                    </div>
                  </div>
                ) : null}

                {paiementCounts.anomalies > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-extrabold text-slate-900">Actions recommandées</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Aide de lecture rapide pour les statuts nécessitant une surveillance opérateur.
                      </p>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-bold text-blue-800">À finaliser</p>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                            {paiementCounts.toFinalize}
                          </span>
                        </div>
                        <p className="text-xs text-blue-900">
                          Paiement confirmé côté FedaPay, mais finalisation locale incomplète.
                        </p>
                        <p className="text-xs text-blue-800 mt-2">
                          Vérifier la cause applicative puis régulariser l’inscription des lecteurs.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-bold text-red-800">Non finalisé</p>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                            {paiementCounts.nonFinalized}
                          </span>
                        </div>
                        <p className="text-xs text-red-900">
                          Aucun statut final exploitable n’a été confirmé dans les délais.
                        </p>
                        <p className="text-xs text-red-800 mt-2">
                          Contrôler l’évolution FedaPay, puis relancer un paiement si nécessaire.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-bold text-slate-800">Échec</p>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                            {paiementCounts.failed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-900">
                          Erreur technique pendant la préparation ou l’initialisation du paiement.
                        </p>
                        <p className="text-xs text-slate-700 mt-2">
                          Vérifier l’erreur enregistrée puis inviter l’utilisateur à relancer un nouveau paiement propre.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {paiementsLoading ? (
              <div className="bg-white rounded-3xl border border-slate-100 flex items-center justify-center gap-3 py-12 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                Chargement…
              </div>
            ) : paiements.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-12 text-center">
                <p className="text-sm text-slate-500">Aucun paiement enregistré pour le moment.</p>
              </div>
            ) : listedPaiements.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-12 text-center">
                <p className="text-sm text-slate-500">
                  {tab === "anomalies" && isSuperAdmin
                    ? "Aucune anomalie détectée pour cette activité."
                    : "Aucun paiement ne correspond au filtre sélectionné."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
                {/* ── Tickets list — 60% (pleine largeur si pas de panneau lecteurs) ─────────────────────────── */}
                <ul className={`space-y-5 ${tab === "anomalies" ? "w-full" : "flex-[6]"}`}>
                {listedPaiements.map((p) => {
                  const isSelectable = p.status === "approved";
                  const anomalyCause =
                    p.status === "approved_pending_registration" ||
                    p.status === "non_finalized" ||
                    p.status === "failed" ||
                    p.statusReason === "partial_refund_not_supported"
                      ? humanizePaymentAnomalyCause(p)
                      : null;
                  const s =
                    p.status === "approved"
                      ? { bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Approuvé" }
                      : p.status === "pending"
                        ? { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-400 animate-pulse", label: "En attente" }
                        : p.status === "approved_pending_registration"
                          ? { bar: "bg-blue-300", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400", label: "À finaliser" }
                        : p.status === "refunded"
                          ? { bar: "bg-violet-300", badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-400", label: "Remboursé" }
                        : p.status === "non_finalized"
                          ? { bar: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", label: "Non finalisé" }
                        : p.status === "canceled"
                          ? { bar: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", label: "Annulé" }
                          : p.status === "declined"
                            ? { bar: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", label: "Refusé" }
                            : p.status === "failed"
                              ? { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Échec" }
                              : { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: p.status };

                  const isSelected = isSelectable && selectedPaiementId === p._id;
                  return (
                    <li key={p._id}>
                      {/* ── Ticket card ─────────────────────────────────── */}
                      <div
                        onClick={isSelectable ? () => setSelectedPaiementId(isSelected ? null : p._id) : undefined}
                        className={`relative flex flex-col lg:flex-row rounded-2xl border shadow-md overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? "border-amber-300 shadow-amber-200/60 ring-2 ring-amber-200 bg-white"
                            : isSelectable
                              ? "border-slate-100 shadow-slate-200/40 bg-white hover:border-slate-200 cursor-pointer"
                              : "border-slate-100 shadow-slate-200/40 bg-white cursor-default"
                        }`}
                      >

                        {/* Status accent bar */}
                        <div className={`h-1 w-full lg:h-auto lg:w-1 lg:rounded-l-2xl shrink-0 ${s.bar}`} />

                        <div className="flex flex-col lg:flex-row flex-1 min-w-0 overflow-hidden lg:rounded-r-2xl">

                          {/* ── Main body ──────────────────────────────────── */}
                          <div className="flex-1 min-w-0 px-4 py-4 sm:px-5 space-y-3">

                            {/* Row 1: badge + date */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold leading-none border ${s.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">
                                {p.createdAt ? format(new Date(p.createdAt), "d MMM yyyy · HH:mm", { locale: fr }) : "—"}
                              </span>
                            </div>

                            {isSuperAdmin && anomalyCause ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Cause</p>
                                <p className="text-[12px] text-slate-700 leading-relaxed">{anomalyCause}</p>
                                {p.status === "approved_pending_registration" ? (
                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={finalizingPaiementId === p._id}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void finalizePaiementManually(p._id);
                                      }}
                                      className="h-8 rounded-lg border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                                    >
                                      {finalizingPaiementId === p._id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Finalisation...
                                        </>
                                      ) : (
                                        "Finaliser maintenant"
                                      )}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {/* Row 2: paroisse / email (managers uniquement) */}
                            {(isManager || isVicarial) && (p.paroisseName || p.userEmail) && (
                              <p className="text-[13px] font-bold text-slate-900 truncate">
                                {p.paroisseName ?? p.userEmail}
                              </p>
                            )}

                            {/* Row 3: formule montant */}
                            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-stretch">
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Unitaire</p>
                                <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">{formatMoney(p.montantUnitaire)}</p>
                              </div>
                              <div className="hidden sm:flex items-center text-slate-300 font-light text-base select-none px-0.5">×</div>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Lecteurs</p>
                                <p className="text-xs font-semibold text-slate-700">{p.nombreLecteurs}</p>
                              </div>
                              <div className="hidden sm:flex items-center text-slate-300 font-light text-base select-none px-0.5">=</div>
                              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">Total</p>
                                <p className="text-sm font-extrabold text-amber-900 whitespace-nowrap">{formatMoney(p.montantTotal)}</p>
                              </div>
                            </div>
                          </div>

                          {/* ── Ticket perforation ─────────────────────────── */}
                          <div className="relative hidden lg:flex flex-col items-center self-stretch w-7 shrink-0">
                            {/* Top notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-slate-100 border border-slate-200 z-10" />
                            {/* Dashed line */}
                            <div className="flex-1 w-0 border-l-2 border-dashed border-slate-200 my-1" />
                            {/* Bottom notch */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[14px] h-[14px] rounded-full bg-slate-100 border border-slate-200 z-10" />
                          </div>

                          {/* ── Stub — référence + lecteurs ────────────────── */}
                          <div className="w-full lg:w-52 shrink-0 bg-slate-50/80 px-4 py-3 lg:py-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center border-t border-slate-100 lg:border-t-0">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Réf. FedaPay</p>
                              {p.fedapayReference ? (
                                <p className="font-mono text-[11px] text-slate-700 font-semibold break-all leading-snug">{p.fedapayReference}</p>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">Aucune référence</p>
                              )}
                            </div>
                            {p.lecteurs && p.lecteurs.length > 0 && (
                              <div className="sm:min-w-[90px]">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                  Lecteurs
                                </p>
                                <p className="text-xl font-extrabold text-slate-800">{p.lecteurs.length}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                </ul>

                {/* ── Lecteurs panel — 40% ───────────────────────── */}
                {tab !== "anomalies" ? (() => {
                  // Aggregate unique lecteurs across approved paiements only
                  const approvedPaiements = paiements.filter((p) => p.status === "approved");
                  const seen = new Set<string>();
                  const allLecteurs: { _id: string; nom: string; prenoms: string; paroisseName?: string; paiementId: string }[] = [];
                  approvedPaiements.forEach((p) => {
                    (p.lecteurs ?? []).forEach((l: { _id: string; nom: string; prenoms: string }) => {
                      if (!seen.has(l._id)) {
                        seen.add(l._id);
                        allLecteurs.push({ ...l, paroisseName: p.paroisseName, paiementId: p._id });
                      }
                    });
                  });

                  // Sort: selected paiement's lecteurs first, rest after
                  const sortedLecteurs = selectedPaiementId
                    ? [
                        ...allLecteurs.filter((l) => l.paiementId === selectedPaiementId),
                        ...allLecteurs.filter((l) => l.paiementId !== selectedPaiementId),
                      ]
                    : allLecteurs;

                  const selectedCount = selectedPaiementId
                    ? allLecteurs.filter((l) => l.paiementId === selectedPaiementId).length
                    : null;

                  return (
                    <div className="lg:flex-[4] bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/30 overflow-hidden lg:sticky lg:top-4">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            Lecteurs inscrits
                          </p>
                          {selectedPaiementId && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              {selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""} · cliquez pour désélectionner
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-900 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 leading-none">
                          {allLecteurs.length}
                        </span>
                      </div>
                      {/* List */}
                      <ul className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
                        {sortedLecteurs.length === 0 ? (
                          <li className="px-5 py-6 text-center text-sm text-slate-400">Aucun lecteur trouvé.</li>
                        ) : (
                          sortedLecteurs.map((l, i) => {
                            const highlighted = selectedPaiementId && l.paiementId === selectedPaiementId;
                            return (
                              <li
                                key={l._id}
                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                  highlighted
                                    ? "bg-amber-50/70 border-l-2 border-amber-300"
                                    : "hover:bg-slate-50/60"
                                }`}
                              >
                                {/* Index bubble */}
                                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold leading-none ${
                                  highlighted
                                    ? "bg-amber-200 border border-amber-300 text-amber-900"
                                    : "bg-amber-50 border border-amber-100 text-amber-700"
                                }`}>
                                  {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[12px] font-semibold truncate leading-tight ${highlighted ? "text-amber-900" : "text-slate-800"}`}>
                                    {l.nom} {l.prenoms}
                                  </p>
                                  {(isManager || isVicarial) && l.paroisseName && (
                                    <p className="text-[10px] text-slate-400 truncate leading-tight">{l.paroisseName}</p>
                                  )}
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  );
                })() : null}
              </div>
            )}
          </div>
        ) : tab === "presence" ? (
          <div className="space-y-6">
            {canSeePresence ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Présences validées
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Liste des lecteurs dont la présence a été confirmée depuis la page publique de vérification.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    {filteredPresences.length} présence{filteredPresences.length > 1 ? "s" : ""}
                  </span>
                </div>

                {presences.length > 0 ? (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Vicariat</p>
                      <Select
                        value={selectedPresenceVicariat}
                        onValueChange={(value) => {
                          setSelectedPresenceVicariat(value ?? PARTICIPANT_FILTER_ALL);
                          setSelectedPresenceParoisse(PARTICIPANT_FILTER_ALL);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>
                            {selectedPresenceVicariat === PARTICIPANT_FILTER_ALL
                              ? "Tous les vicariats"
                              : selectedPresenceVicariat}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Tous les vicariats</SelectItem>
                          {presenceVicariatOptions.map((vicariat) => (
                            <SelectItem key={vicariat} value={vicariat}>
                              {vicariat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Paroisse</p>
                      <Select
                        value={selectedPresenceParoisse}
                        onValueChange={(value) => setSelectedPresenceParoisse(value ?? PARTICIPANT_FILTER_ALL)}
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>
                            {selectedPresenceParoisse === PARTICIPANT_FILTER_ALL
                              ? "Toutes les paroisses"
                              : selectedPresenceParoisse}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Toutes les paroisses</SelectItem>
                          {presenceParoisseOptions.map((paroisse) => (
                            <SelectItem key={paroisse} value={paroisse}>
                              {paroisse}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}

                {presencesLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                ) : presences.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune présence validée sur cette activité pour le moment.</p>
                ) : filteredPresences.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune présence ne correspond aux filtres sélectionnés.</p>
                ) : (
                  <ul className="max-h-[28rem] overflow-y-auto space-y-2 text-sm">
                    {filteredPresences.map((presence) => (
                      <li
                        key={presence.lecteur._id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {presence.lecteur.nom} {presence.lecteur.prenoms}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {presence.paroisseName ?? "—"}
                            {presence.vicariatName ? ` • ${presence.vicariatName}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {presence.grade?.name || presence.grade?.abbreviation || "Grade non renseigné"}
                          </p>
                          <p className="mt-2 text-xs font-medium text-emerald-800">
                            Validée le {formatPaidAt(presence.validatedAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-slate-500">{presence.lecteur.uniqueId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : tab === "infos" ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-5">Résumé de l’activité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Période</p>
                <p className="text-sm font-semibold text-slate-800">
                  {format(new Date(activite.dateDebut), "PPP", { locale: fr })} — {format(new Date(activite.dateFin), "PPP", { locale: fr })}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Lieu</p>
                <p className="text-sm font-semibold text-slate-800">{activite.lieu}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Délai de paiement</p>
                <p className="text-sm font-semibold text-slate-800">
                  {format(new Date(activite.delaiPaiement), "PPPp", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Tarification et pénalités</h3>
              <GrillePenaliteDisplay
                montantInitial={activite.montant}
                delaiPaiement={activite.delaiPaiement}
                grille={activite.grillePenalite}
              />
            </div>
          </div>
        ) : tab === "statistiques" && isDiocesain ? (
          <ActiviteStatsPanel
            activiteId={activiteId}
            montantInitial={activite.montant}
            delaiPaiement={activite.delaiPaiement}
            grillePenalite={activite.grillePenalite}
          />
        ) : (
          <div className="space-y-6">
            {canSeeParticipants ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Participants
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!participantsLoading ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        {participants.length} participant{participants.length > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => downloadParticipantsExcel(filteredParticipants)}
                      disabled={!filteredParticipants.length || participantsLoading}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => void downloadParticipantsPdf(filteredParticipants)}
                      disabled={!filteredParticipants.length || participantsLoading}
                    >
                      <FileText className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </div>
                </div>
                {isManager && participants.length > 0 ? (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Vicariat</p>
                      <Select
                        value={selectedVicariat}
                        onValueChange={(value) => {
                          setSelectedVicariat(value ?? PARTICIPANT_FILTER_ALL);
                          setSelectedParoisse(PARTICIPANT_FILTER_ALL);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>{selectedVicariat === PARTICIPANT_FILTER_ALL ? "Tous les vicariats" : selectedVicariat}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Tous les vicariats</SelectItem>
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
                      <Select value={selectedParoisse} onValueChange={(value) => setSelectedParoisse(value ?? PARTICIPANT_FILTER_ALL)}>
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>{selectedParoisse === PARTICIPANT_FILTER_ALL ? "Toutes les paroisses" : selectedParoisse}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Toutes les paroisses</SelectItem>
                          {paroisseOptions.map((paroisse) => (
                            <SelectItem key={paroisse} value={paroisse}>
                              {paroisse}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : isVicarial && participants.length > 0 ? (
                  <div className="mb-4 max-w-md">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Paroisse</p>
                    <Select value={selectedParoisse} onValueChange={(value) => setSelectedParoisse(value ?? PARTICIPANT_FILTER_ALL)}>
                      <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                        <SelectValue>{selectedParoisse === PARTICIPANT_FILTER_ALL ? "Toutes les paroisses" : selectedParoisse}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PARTICIPANT_FILTER_ALL}>Toutes les paroisses</SelectItem>
                        {paroisseOptions.map((paroisse) => (
                          <SelectItem key={paroisse} value={paroisse}>
                            {paroisse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {participantsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
                ) : participants.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {isManager
                      ? "Aucune participation payée sur cette activité pour le moment."
                      : isVicarial
                        ? "Aucune participation payée dans votre vicariat sur cette activité pour le moment."
                        : "Aucune participation payée pour votre paroisse sur cette activité pour le moment."}
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
                          {(isManager || isVicarial) && (p.paroisseName || p.vicariatName) ? (
                            <p className="text-xs text-slate-500">
                              {p.paroisseName ?? "—"}
                              {isManager && p.vicariatName ? ` • ${p.vicariatName}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-slate-500 shrink-0">{p.lecteur.uniqueId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={confirmTermineeOpen} onOpenChange={setConfirmTermineeOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer cette activité comme terminée ?</DialogTitle>
            <DialogDescription>
              Une fois terminée, elle basculera dans la section des activités passées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" disabled={terminating} onClick={() => setConfirmTermineeOpen(false)}>
              Annuler
            </Button>
            <Button type="button" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white" disabled={terminating} onClick={() => void terminerActivite()}>
              {terminating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

