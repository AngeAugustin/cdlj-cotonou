"use client";

import { use as usePromise, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle, Download, Loader2, AlertCircle, CheckCircle2, MapPin, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_PENDING_TIMEOUT_MS } from "@/lib/activitePayments";
import { cn } from "@/lib/utils";
import { computeMontantApplicable } from "@/modules/activites/penalites";

const PAROISSE_FILTER_ALL = "__all__";

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
  suspendue?: boolean;
};

type ParoisseOption = {
  _id: string;
  name: string;
};

type LecteurRow = {
  _id: string;
  nom: string;
  prenoms: string;
  uniqueId: string;
  dateNaissance?: string;
  gradeId?: { name?: string; abbreviation?: string } | null;
  paroisseId?: { _id?: string; name?: string } | string | null;
};

type ParticipantRow = {
  paidAt: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    dateNaissance?: string;
  };
  grade?: { name?: string; abbreviation?: string } | null;
  paroisseName?: string;
};

function refId(ref: unknown): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref !== null && "_id" in ref) return String((ref as { _id: unknown })._id);
  return "";
}

function paroisseLabel(ref: unknown): string {
  if (ref && typeof ref === "object" && ref !== null && "name" in ref) {
    const name = (ref as { name?: string }).name;
    if (name?.trim()) return name.trim();
  }
  return "—";
}

function matchesNameSearch(nom: string, prenoms: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const nomL = nom.toLowerCase();
  const prenomsL = prenoms.toLowerCase();
  return nomL.includes(q) || prenomsL.includes(q) || `${nomL} ${prenomsL}`.includes(q);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

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

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const line = (r: (string | number)[]) => r.map((x) => esc(String(x))).join(";");
  const content = [line(header), ...rows.map(line)].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TabBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
      active
        ? "bg-amber-900 text-white shadow-lg shadow-amber-900/25"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    )}
  >
    {children}
  </button>
);

export default function ParticiperActivitePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params);
  const activiteId = resolvedParams.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const roles: string[] = ((session?.user as { roles?: string[] })?.roles ?? []) as string[];
  const isVicarial = roles.includes("VICARIAL");
  const canEnroll = isVicarial;
  const needsParoissePicker = isVicarial;

  const [activite, setActivite] = useState<Activite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingAct, setLoadingAct] = useState(true);

  const [paroisses, setParoisses] = useState<ParoisseOption[]>([]);
  const [paroissesLoading, setParoissesLoading] = useState(false);
  const [paroisseFilter, setParoisseFilter] = useState(PAROISSE_FILTER_ALL);

  const [partSubTab, setPartSubTab] = useState<"non" | "oui">("non");
  const [lecteurSearch, setLecteurSearch] = useState("");
  const [lecteurs, setLecteurs] = useState<LecteurRow[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [partLoading, setPartLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [participantsRows, setParticipantsRows] = useState<ParticipantRow[]>([]);

  const fedapayReturnHandled = useRef(false);
  const paymentPollTimeoutRef = useRef<number | null>(null);
  const paymentPollDeadlineTimeoutRef = useRef<number | null>(null);

  const [paymentPolling, setPaymentPolling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const montantApplicable = useMemo(() => {
    if (!activite) return 0;
    return computeMontantApplicable(activite.montant, activite.delaiPaiement, activite.grillePenalite);
  }, [activite]);

  const participationsUrl = `/api/activites/${encodeURIComponent(activiteId)}/participations`;
  const lecteursUrl = "/api/lecteurs";

  const selectedParoisseName = useMemo(() => {
    if (paroisseFilter === PAROISSE_FILTER_ALL) return null;
    return paroisses.find((p) => p._id === paroisseFilter)?.name ?? null;
  }, [paroisses, paroisseFilter]);

  useEffect(() => {
    if (status === "loading") return;
    if (!canEnroll) {
      router.replace("/activites");
      return;
    }
    if (!activiteId) return;
    setLoadingAct(true);
    setLoadError(null);
    void fetch(`/api/activites/${encodeURIComponent(activiteId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?._id) throw new Error(data?.error ?? "Impossible de charger l'activité");
        setActivite(data as Activite);
        if (data.terminee || data.suspendue) {
          router.replace(`/activites/${encodeURIComponent(activiteId)}`);
        }
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoadingAct(false));
  }, [status, canEnroll, activiteId, router]);

  useEffect(() => {
    if (!needsParoissePicker) return;
    setParoissesLoading(true);
    void fetch("/api/paroisses")
      .then(async (res) => {
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Impossible de charger les paroisses");
        const list = Array.isArray(data)
          ? data
              .map((p: { _id?: string; name?: string }) => ({
                _id: String(p._id ?? ""),
                name: String(p.name ?? "—"),
              }))
              .filter((p: ParoisseOption) => p._id)
          : [];
        list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        setParoisses(list);
      })
      .catch((e: Error) => showToast(e.message, "error"))
      .finally(() => setParoissesLoading(false));
  }, [needsParoissePicker]);

  useEffect(() => {
    if (!needsParoissePicker || typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("paroisseId");
    if (fromUrl && paroisses.some((p) => p._id === fromUrl)) {
      setParoisseFilter(fromUrl);
    }
  }, [needsParoissePicker, paroisses]);

  const loadLecteursEtParticipations = useCallback(async () => {
    if (!activiteId) return;
    setPartLoading(true);
    try {
      const [lr, pr] = await Promise.all([fetch(lecteursUrl), fetch(participationsUrl)]);
      const L: LecteurRow[] = lr.ok ? await lr.json() : [];
      const P: ParticipantRow[] = pr.ok ? await pr.json() : [];
      setLecteurs(L);
      setParticipantsRows(P);
      setPartIds(P.map((x) => x.lecteur._id));
    } catch {
      setLecteurs([]);
      setPartIds([]);
      setParticipantsRows([]);
    } finally {
      setPartLoading(false);
    }
  }, [activiteId, lecteursUrl, participationsUrl]);

  useEffect(() => {
    if (!activite || activite.terminee || activite.suspendue) return;
    void loadLecteursEtParticipations();
  }, [activite, loadLecteursEtParticipations]);

  const buildParticiperPath = useCallback(
    (extra?: Record<string, string>) => {
      const qs = new URLSearchParams(extra ?? {});
      if (needsParoissePicker && paroisseFilter !== PAROISSE_FILTER_ALL) {
        qs.set("paroisseId", paroisseFilter);
      }
      const q = qs.toString();
      return q
        ? `/activites/${encodeURIComponent(activiteId)}/participer?${q}`
        : `/activites/${encodeURIComponent(activiteId)}/participer`;
    },
    [activiteId, needsParoissePicker, paroisseFilter]
  );

  useEffect(() => {
    if (!activite || typeof window === "undefined" || fedapayReturnHandled.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("payment") !== "return") return;

    const returnParoisseId = sp.get("paroisseId");
    if (needsParoissePicker && returnParoisseId) {
      setParoisseFilter(returnParoisseId);
    }

    let pid = sp.get("pid") ?? sp.get("paymentId");
    if (!pid) {
      try {
        pid = sessionStorage.getItem(`fedapay_pid_${activiteId}`) ?? null;
      } catch {
        pid = null;
      }
    }

    fedapayReturnHandled.current = true;

    const cleanUrl = () => {
      router.replace(buildParticiperPath(), { scroll: false });
    };

    if (!pid) {
      showToast(
        "Retour depuis FedaPay. Actualisez la page dans un instant pour voir si les participants sont inscrits.",
        "success"
      );
      void loadLecteursEtParticipations();
      cleanUrl();
      return;
    }

    try {
      sessionStorage.removeItem(`fedapay_pid_${activiteId}`);
    } catch {
      /* ignore */
    }

    setPaymentPolling(true);

    let cancelled = false;
    const POLL_MS = 2000;
    const MAX_POLL_DURATION_MS = PAYMENT_PENDING_TIMEOUT_MS;

    const stopPolling = (message: string, type: "success" | "error" = "error") => {
      if (cancelled) return;
      cancelled = true;
      setPaymentPolling(false);
      if (paymentPollTimeoutRef.current != null) {
        window.clearTimeout(paymentPollTimeoutRef.current);
        paymentPollTimeoutRef.current = null;
      }
      if (paymentPollDeadlineTimeoutRef.current != null) {
        window.clearTimeout(paymentPollDeadlineTimeoutRef.current);
        paymentPollDeadlineTimeoutRef.current = null;
      }
      showToast(message, type);
      void loadLecteursEtParticipations();
      cleanUrl();
    };

    const scheduleNext = () => {
      if (cancelled) return;
      if (paymentPollTimeoutRef.current != null) {
        window.clearTimeout(paymentPollTimeoutRef.current);
      }
      paymentPollTimeoutRef.current = window.setTimeout(() => {
        void poll();
      }, POLL_MS);
    };

    paymentPollDeadlineTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/activites/${encodeURIComponent(activiteId)}/pay/status?pid=${encodeURIComponent(pid!)}`,
            { method: "PATCH" }
          );
          const data = await res.json().catch(() => ({}));
          const st = typeof data?.status === "string" ? data.status : null;

          if (!res.ok) {
            stopPolling(typeof data?.error === "string" ? data.error : "Paiement annulé ou non finalisé.", "error");
            return;
          }

          if (st === "approved") {
            stopPolling("Paiement confirmé par FedaPay. Les participants sont inscrits.", "success");
            return;
          }

          if (st === "declined" || st === "canceled" || st === "failed" || st === "non_finalized" || st === "approved_pending_registration") {
            const msg =
              st === "declined"
                ? "Paiement refusé."
                : st === "canceled"
                  ? "Paiement annulé."
                  : st === "failed"
                    ? "Paiement en échec."
                    : st === "approved_pending_registration"
                      ? "Paiement confirmé, mais l'inscription des lecteurs est encore en cours de finalisation."
                      : "Paiement annulé ou non finalisé.";
            stopPolling(msg, "error");
            return;
          }

          stopPolling("Paiement annulé ou non finalisé.", "error");
        } catch {
          stopPolling("Paiement annulé ou non finalisé.", "error");
        }
      })();
    }, MAX_POLL_DURATION_MS);

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/activites/${encodeURIComponent(activiteId)}/pay/status?pid=${encodeURIComponent(pid!)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          stopPolling(typeof data.error === "string" ? data.error : "Erreur de vérification du paiement", "error");
          return;
        }
        const st = data.status as string;
        if (st === "approved") {
          stopPolling("Paiement confirmé par FedaPay. Les participants sont inscrits.", "success");
          return;
        }
        if (st === "declined" || st === "canceled" || st === "failed" || st === "non_finalized" || st === "approved_pending_registration") {
          const msg =
            st === "declined"
              ? "Paiement refusé."
              : st === "canceled"
                ? "Paiement annulé."
                : st === "failed"
                  ? "Paiement en échec."
                  : st === "approved_pending_registration"
                    ? "Paiement confirmé, mais l'inscription des lecteurs est encore en cours de finalisation."
                    : "Paiement annulé ou non finalisé.";
          stopPolling(msg, "error");
          return;
        }
        scheduleNext();
      } catch {
        stopPolling("Erreur réseau lors de la vérification du paiement.", "error");
      }
    };

    void poll();

    return () => {
      cancelled = true;
      setPaymentPolling(false);
      if (paymentPollTimeoutRef.current != null) {
        window.clearTimeout(paymentPollTimeoutRef.current);
        paymentPollTimeoutRef.current = null;
      }
      if (paymentPollDeadlineTimeoutRef.current != null) {
        window.clearTimeout(paymentPollDeadlineTimeoutRef.current);
        paymentPollDeadlineTimeoutRef.current = null;
      }
    };
  }, [activite, activiteId, buildParticiperPath, loadLecteursEtParticipations, needsParoissePicker, router]);

  const filteredLecteurs = useMemo(() => {
    if (paroisseFilter === PAROISSE_FILTER_ALL) return lecteurs;
    return lecteurs.filter((l) => refId(l.paroisseId) === paroisseFilter);
  }, [lecteurs, paroisseFilter]);

  const filteredParticipants = useMemo(() => {
    if (paroisseFilter === PAROISSE_FILTER_ALL) return participantsRows;
    const name = selectedParoisseName;
    if (!name) return participantsRows;
    return participantsRows.filter((p) => p.paroisseName === name);
  }, [participantsRows, paroisseFilter, selectedParoisseName]);

  const nonParticipants = useMemo(() => {
    const setP = new Set(partIds);
    return filteredLecteurs.filter((l) => !setP.has(l._id));
  }, [filteredLecteurs, partIds]);

  const orderedNonParticipants = useMemo(() => {
    const selectedSet = new Set(selectedOrder);
    const selected = selectedOrder
      .map((id) => nonParticipants.find((l) => l._id === id))
      .filter((l): l is LecteurRow => Boolean(l));
    const unselected = nonParticipants.filter((l) => !selectedSet.has(l._id));
    return [...selected, ...unselected];
  }, [nonParticipants, selectedOrder]);

  const searchedNonParticipants = useMemo(() => {
    const q = lecteurSearch.trim();
    if (!q) return orderedNonParticipants;
    return orderedNonParticipants.filter((l) => matchesNameSearch(l.nom, l.prenoms, q));
  }, [orderedNonParticipants, lecteurSearch]);

  const searchedParticipants = useMemo(() => {
    const q = lecteurSearch.trim();
    if (!q) return filteredParticipants;
    return filteredParticipants.filter((p) =>
      matchesNameSearch(p.lecteur.nom, p.lecteur.prenoms, q)
    );
  }, [filteredParticipants, lecteurSearch]);

  const hasSelectedLecteurs = selectedOrder.length > 0;

  const togglePay = (id: string) => {
    setSelectedOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const refreshParticipations = async () => {
    const pr = await fetch(participationsUrl);
    if (pr.ok) {
      const P: ParticipantRow[] = await pr.json();
      setParticipantsRows(P);
      setPartIds(P.map((x) => x.lecteur._id));
    }
  };

  const submitPayer = async () => {
    if (!activite) return;
    const nonParticipantIds = new Set(nonParticipants.map((l) => l._id));
    const ids = selectedOrder.filter((id) => nonParticipantIds.has(id));
    if (!ids.length) {
      showToast("Cochez au moins un lecteur", "error");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/activites/${activite._id}/pay/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecteurIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof data.error === "string" ? data.error : "Erreur", "error");
        return;
      }
      if (data.free) {
        showToast("Participation enregistrée (activité gratuite).");
        setSelectedOrder([]);
        await refreshParticipations();
        return;
      }
      if (data.alreadyApproved) {
        showToast("Ce paiement a déjà été confirmé. Les participants sont inscrits.");
        setSelectedOrder([]);
        await refreshParticipations();
        return;
      }
      if (typeof data.paymentUrl === "string" && data.paymentUrl.startsWith("http")) {
        if (typeof data.paymentId === "string" && data.paymentId) {
          try {
            sessionStorage.setItem(`fedapay_pid_${activite._id}`, data.paymentId);
          } catch {
            /* ignore */
          }
        }
        window.location.href = data.paymentUrl;
        return;
      }
      showToast("Réponse de paiement inattendue", "error");
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setPaying(false);
    }
  };

  const downloadCurrentParticipants = () => {
    if (!activite) return;
    const header = ["Matricule", "Nom", "Prénoms", "Paroisse", "Grade", "Âge"];
    const rows = filteredParticipants.map((p) => [
      p.lecteur.uniqueId,
      p.lecteur.nom,
      p.lecteur.prenoms,
      p.paroisseName || "—",
      p.grade?.name || p.grade?.abbreviation || "—",
      ageFromBirth(p.lecteur.dateNaissance),
    ]);
    const suffix = selectedParoisseName ? `-${selectedParoisseName.slice(0, 20)}` : "";
    downloadCsv(`participants-encours-${activite.nom.slice(0, 30)}${suffix}.csv`, header, rows);
  };

  if (status === "loading" || loadingAct) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (!canEnroll) return null;

  if (loadError || !activite) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="text-slate-700">{loadError ?? "Activité introuvable."}</p>
        <Link href="/activites" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
          Retour aux activités
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-8 pb-12">
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium",
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {paymentPolling && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm text-amber-950">
          <Loader2 className="w-5 h-5 shrink-0 animate-spin text-amber-900" />
          <span>
            Vérification du paiement auprès de FedaPay… Un message de confirmation s'affichera lorsque le statut sera
            connu.
          </span>
        </div>
      )}

      <div className="min-w-0">
        <Link
          href="/activites"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux activités
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Participer</h1>
            <p className="mt-1 text-base font-bold text-amber-900 sm:text-lg">{activite.nom}</p>
            {needsParoissePicker ? (
              <p className="text-sm text-slate-500 mt-2">
                Tous les lecteurs du vicariat sont affichés. Vous pouvez filtrer par paroisse et payer plusieurs
                paroisses en une seule transaction.
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-stretch">
            {needsParoissePicker ? (
              <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:min-w-[18rem] lg:min-w-[22rem]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtrer par paroisse</p>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-900/10">
                    <MapPin className="h-4 w-4 text-amber-900" />
                  </div>
                </div>
                {paroissesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement…
                  </div>
                ) : paroisses.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune paroisse disponible.</p>
                ) : (
                  <Select value={paroisseFilter} onValueChange={(value) => setParoisseFilter(value ?? PAROISSE_FILTER_ALL)}>
                    <SelectTrigger className="h-auto min-h-10 w-full max-w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium whitespace-normal [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal">
                      <SelectValue placeholder="Toutes les paroisses">
                        {paroisseFilter === PAROISSE_FILTER_ALL ? "Toutes les paroisses" : (selectedParoisseName ?? "")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      alignItemWithTrigger={false}
                      className="max-h-72 w-max min-w-[var(--anchor-width)] max-w-[min(24rem,calc(100vw-2rem))]"
                    >
                      <SelectItem value={PAROISSE_FILTER_ALL}>Toutes les paroisses</SelectItem>
                      {paroisses.map((p) => (
                        <SelectItem
                          key={p._id}
                          value={p._id}
                          className="items-start py-2 [&_span]:whitespace-normal [&_span]:break-words"
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}

            {activite.montant != null ? (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm sm:min-w-[11rem]">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800/80">Tarif actuel</p>
                  <p className="text-lg font-extrabold tabular-nums text-amber-950 leading-tight">
                    {montantApplicable === 0 ? "Gratuit" : formatMoney(montantApplicable)}
                  </p>
                  {montantApplicable !== activite.montant && activite.montant > 0 ? (
                    <p className="text-[10px] text-amber-800/70">Initial : {formatMoney(activite.montant)}</p>
                  ) : null}
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-900/10">
                  <Banknote className="h-5 w-5 text-amber-900" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <TabBtn active={partSubTab === "non"} onClick={() => setPartSubTab("non")}>
            Non participants
          </TabBtn>
          <TabBtn active={partSubTab === "oui"} onClick={() => setPartSubTab("oui")}>
            Participants
          </TabBtn>
        </div>
        <div className="relative w-full sm:max-w-sm sm:shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={lecteurSearch}
            onChange={(e) => setLecteurSearch(e.target.value)}
            placeholder="Rechercher par nom ou prénom…"
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm"
            aria-label="Rechercher un lecteur par nom ou prénom"
          />
        </div>
      </div>

      {partLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
        </div>
      ) : partSubTab === "non" ? (
        <div className="space-y-3">
          {nonParticipants.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {paroisseFilter !== PAROISSE_FILTER_ALL
                ? "Tous les lecteurs de cette paroisse sont déjà inscrits."
                : "Tous les lecteurs du vicariat sont déjà inscrits."}
            </p>
          ) : searchedNonParticipants.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Aucun lecteur ne correspond à votre recherche.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[min(40rem,70vh)] overflow-y-auto border border-slate-200/60 rounded-2xl p-2 sm:p-3">
              {searchedNonParticipants.map((l) => (
                <li
                  key={l._id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl min-w-0 transition-colors",
                    selectedOrder.includes(l._id)
                      ? "bg-amber-50/80 ring-1 ring-amber-200/80"
                      : "hover:bg-slate-100/60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrder.includes(l._id)}
                    onChange={() => togglePay(l._id)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-900 focus:ring-amber-900"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">
                      {l.nom} {l.prenoms}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(l.gradeId as { name?: string; abbreviation?: string })?.name ||
                        (l.gradeId as { abbreviation?: string })?.abbreviation ||
                        "—"}{" "}
                      · {ageFromBirth(l.dateNaissance)}
                      {paroisseFilter === PAROISSE_FILTER_ALL ? ` · ${paroisseLabel(l.paroisseId)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasSelectedLecteurs && (
            <Button
              type="button"
              className="w-full sm:w-auto sm:min-w-[12rem] rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold"
              disabled={paying}
              onClick={submitPayer}
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Payer"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={downloadCurrentParticipants}
              disabled={!filteredParticipants.length}
            >
              <Download className="w-4 h-4 mr-1" /> Télécharger la liste
            </Button>
          </div>
          {filteredParticipants.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {paroisseFilter !== PAROISSE_FILTER_ALL
                ? "Aucun participant pour cette paroisse pour le moment."
                : "Aucun participant pour le moment."}
            </p>
          ) : searchedParticipants.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Aucun participant ne correspond à votre recherche.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[min(40rem,70vh)] overflow-y-auto border border-slate-200/60 rounded-2xl p-2 sm:p-3">
              {searchedParticipants.map((p) => (
                <li
                  key={p.lecteur._id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 min-w-0"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {p.lecteur.nom} {p.lecteur.prenoms}
                    </p>
                    <p className="text-xs text-slate-600">
                      {p.lecteur.uniqueId}
                      {paroisseFilter === PAROISSE_FILTER_ALL && p.paroisseName ? ` · ${p.paroisseName}` : ""}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
