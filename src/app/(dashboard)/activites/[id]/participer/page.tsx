"use client";

import { use as usePromise, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_PENDING_TIMEOUT_MS } from "@/lib/activitePayments";
import { cn } from "@/lib/utils";

type Activite = {
  _id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
  delaiPaiement: string;
  numeroPaiement?: string;
  image?: string;
  terminee: boolean;
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
};

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
  const isParoissial = roles.includes("PAROISSIAL");
  const isVicarial = roles.includes("VICARIAL");
  const canEnroll = isParoissial || isVicarial;
  const needsParoissePicker = isVicarial && !isParoissial;

  const [activite, setActivite] = useState<Activite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingAct, setLoadingAct] = useState(true);

  const [paroisses, setParoisses] = useState<ParoisseOption[]>([]);
  const [paroissesLoading, setParoissesLoading] = useState(false);
  const [selectedParoisseId, setSelectedParoisseId] = useState("");

  const [partSubTab, setPartSubTab] = useState<"non" | "oui">("non");
  const [lecteurs, setLecteurs] = useState<LecteurRow[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [selectedPay, setSelectedPay] = useState<Record<string, boolean>>({});
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

  const activeParoisseId = needsParoissePicker ? selectedParoisseId : null;

  const participationsUrl = useMemo(() => {
    const base = `/api/activites/${encodeURIComponent(activiteId)}/participations`;
    if (activeParoisseId) {
      return `${base}?paroisseId=${encodeURIComponent(activeParoisseId)}`;
    }
    return base;
  }, [activiteId, activeParoisseId]);

  const lecteursUrl = useMemo(() => {
    if (activeParoisseId) {
      return `/api/lecteurs?paroisseId=${encodeURIComponent(activeParoisseId)}`;
    }
    return "/api/lecteurs";
  }, [activeParoisseId]);

  const selectedParoisseName = useMemo(
    () => paroisses.find((p) => p._id === selectedParoisseId)?.name ?? null,
    [paroisses, selectedParoisseId]
  );

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
        if (data.terminee) {
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
      setSelectedParoisseId(fromUrl);
    }
  }, [needsParoissePicker, paroisses]);

  const loadLecteursEtParticipations = useCallback(async () => {
    if (!activiteId) return;
    if (needsParoissePicker && !selectedParoisseId) {
      setLecteurs([]);
      setPartIds([]);
      setParticipantsRows([]);
      return;
    }
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
  }, [activiteId, needsParoissePicker, selectedParoisseId, lecteursUrl, participationsUrl]);

  useEffect(() => {
    if (!activite || activite.terminee) return;
    void loadLecteursEtParticipations();
  }, [activite, loadLecteursEtParticipations]);

  useEffect(() => {
    setSelectedPay({});
  }, [selectedParoisseId]);

  const buildParticiperPath = useCallback(
    (extra?: Record<string, string>) => {
      const qs = new URLSearchParams(extra ?? {});
      if (needsParoissePicker && selectedParoisseId) {
        qs.set("paroisseId", selectedParoisseId);
      }
      const q = qs.toString();
      return q
        ? `/activites/${encodeURIComponent(activiteId)}/participer?${q}`
        : `/activites/${encodeURIComponent(activiteId)}/participer`;
    },
    [activiteId, needsParoissePicker, selectedParoisseId]
  );

  useEffect(() => {
    if (!activite || typeof window === "undefined" || fedapayReturnHandled.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("payment") !== "return") return;

    const returnParoisseId = sp.get("paroisseId");
    if (needsParoissePicker && returnParoisseId) {
      setSelectedParoisseId(returnParoisseId);
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

  const nonParticipants = useMemo(() => {
    const setP = new Set(partIds);
    return lecteurs.filter((l) => !setP.has(l._id));
  }, [lecteurs, partIds]);

  const hasSelectedLecteurs = useMemo(
    () => Object.values(selectedPay).some(Boolean),
    [selectedPay]
  );

  const togglePay = (id: string) => {
    setSelectedPay((s) => ({ ...s, [id]: !s[id] }));
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
    if (needsParoissePicker && !selectedParoisseId) {
      showToast("Sélectionnez une paroisse", "error");
      return;
    }
    const ids = Object.entries(selectedPay)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) {
      showToast("Cochez au moins un lecteur", "error");
      return;
    }
    setPaying(true);
    try {
      const payload: { lecteurIds: string[]; paroisseId?: string } = { lecteurIds: ids };
      if (needsParoissePicker) payload.paroisseId = selectedParoisseId;

      const res = await fetch(`/api/activites/${activite._id}/pay/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof data.error === "string" ? data.error : "Erreur", "error");
        return;
      }
      if (data.free) {
        showToast("Participation enregistrée (activité gratuite).");
        setSelectedPay({});
        await refreshParticipations();
        return;
      }
      if (data.alreadyApproved) {
        showToast("Ce paiement a déjà été confirmé. Les participants sont inscrits.");
        setSelectedPay({});
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
    const header = ["Matricule", "Nom", "Prénoms", "Grade", "Âge"];
    const rows = participantsRows.map((p) => [
      p.lecteur.uniqueId,
      p.lecteur.nom,
      p.lecteur.prenoms,
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Participer</h1>
        <p className="text-slate-600 mt-1 font-medium">{activite.nom}</p>
        {needsParoissePicker ? (
          <p className="text-sm text-slate-500 mt-2">
            Inscrivez les lecteurs par paroisse. Chaque paroisse fait l'objet d'un paiement distinct.
          </p>
        ) : null}
      </div>

      {needsParoissePicker ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Paroisse</p>
          {paroissesLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          ) : paroisses.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune paroisse rattachée à votre vicariat.</p>
          ) : (
            <Select
              value={selectedParoisseId}
              onValueChange={(value) => setSelectedParoisseId(value ?? "")}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 justify-between">
                <SelectValue>
                  {selectedParoisseName || "Choisir une paroisse"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paroisses.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : null}

      {(activite.numeroPaiement?.trim() || activite.montant != null) && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-800 grid gap-3 sm:grid-cols-2 sm:gap-8 sm:items-start w-full">
          <p>
            <span className="font-semibold text-slate-900">Montant : </span>
            {formatMoney(activite.montant)}
          </p>
          {activite.numeroPaiement?.trim() ? (
            <p className="min-w-0">
              <span className="font-semibold text-slate-900">Numéro de paiement : </span>
              <span className="font-mono break-all">{activite.numeroPaiement}</span>
            </p>
          ) : null}
        </div>
      )}

      {needsParoissePicker && !selectedParoisseId ? (
        <p className="text-sm text-slate-500 py-8 text-center rounded-2xl border border-dashed border-slate-200">
          Sélectionnez une paroisse pour afficher les lecteurs et gérer les participations.
        </p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <TabBtn active={partSubTab === "non"} onClick={() => setPartSubTab("non")}>
              Non participants
            </TabBtn>
            <TabBtn active={partSubTab === "oui"} onClick={() => setPartSubTab("oui")}>
              Participants
            </TabBtn>
          </div>

          {partLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
            </div>
          ) : partSubTab === "non" ? (
            <div className="space-y-3">
              {nonParticipants.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  {needsParoissePicker
                    ? "Tous les lecteurs de cette paroisse sont déjà inscrits."
                    : "Tous vos lecteurs sont déjà inscrits."}
                </p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[min(40rem,70vh)] overflow-y-auto border border-slate-200/60 rounded-2xl p-2 sm:p-3">
                  {nonParticipants.map((l) => (
                    <li key={l._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/60 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!selectedPay[l._id]}
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
                  disabled={!participantsRows.length}
                >
                  <Download className="w-4 h-4 mr-1" /> Télécharger la liste
                </Button>
              </div>
              {participantsRows.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  {needsParoissePicker
                    ? "Aucun participant pour cette paroisse pour le moment."
                    : "Aucun participant pour le moment."}
                </p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[min(40rem,70vh)] overflow-y-auto border border-slate-200/60 rounded-2xl p-2 sm:p-3">
                  {participantsRows.map((p) => (
                    <li
                      key={p.lecteur._id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {p.lecteur.nom} {p.lecteur.prenoms}
                        </p>
                        <p className="text-xs text-slate-600">{p.lecteur.uniqueId}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
