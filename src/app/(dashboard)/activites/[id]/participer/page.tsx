"use client";

import { use as usePromise, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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

  const [activite, setActivite] = useState<Activite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingAct, setLoadingAct] = useState(true);

  const [partSubTab, setPartSubTab] = useState<"non" | "oui">("non");
  const [lecteurs, setLecteurs] = useState<LecteurRow[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [selectedPay, setSelectedPay] = useState<Record<string, boolean>>({});
  const [partLoading, setPartLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [participantsRows, setParticipantsRows] = useState<ParticipantRow[]>([]);

  const fedapayReturnHandled = useRef(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!isParoissial) {
      router.replace("/activites");
      return;
    }
    if (!activiteId) return;
    setLoadingAct(true);
    setLoadError(null);
    void fetch(`/api/activites/${encodeURIComponent(activiteId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?._id) throw new Error(data?.error ?? "Impossible de charger l’activité");
        setActivite(data as Activite);
        if (data.terminee) {
          router.replace(`/activites/${encodeURIComponent(activiteId)}`);
        }
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoadingAct(false));
  }, [status, isParoissial, activiteId, router]);

  const loadLecteursEtParticipations = useCallback(async () => {
    if (!activiteId) return;
    setPartLoading(true);
    try {
      const [lr, pr] = await Promise.all([
        fetch("/api/lecteurs"),
        fetch(`/api/activites/${encodeURIComponent(activiteId)}/participations`),
      ]);
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
  }, [activiteId]);

  useEffect(() => {
    if (!activite || activite.terminee) return;
    void loadLecteursEtParticipations();
  }, [activite, loadLecteursEtParticipations]);

  useEffect(() => {
    if (!activite || typeof window === "undefined" || fedapayReturnHandled.current) return;
    const q = new URLSearchParams(window.location.search).get("payment");
    if (q !== "return") return;
    fedapayReturnHandled.current = true;
    showToast(
      "Retour depuis FedaPay. La validation du paiement peut prendre quelques secondes ; les participants apparaîtront ensuite dans l’onglet Participants.",
      "success"
    );
    void loadLecteursEtParticipations();
    router.replace(`/activites/${encodeURIComponent(activiteId)}/participer`, { scroll: false });
  }, [activite, activiteId, loadLecteursEtParticipations, router]);

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

  const submitPayer = async () => {
    if (!activite) return;
    const ids = Object.entries(selectedPay)
      .filter(([, v]) => v)
      .map(([k]) => k);
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
        setSelectedPay({});
        const pr = await fetch(`/api/activites/${activite._id}/participations`);
        if (pr.ok) {
          const P: ParticipantRow[] = await pr.json();
          setParticipantsRows(P);
          setPartIds(P.map((x) => x.lecteur._id));
        }
        return;
      }
      if (typeof data.paymentUrl === "string" && data.paymentUrl.startsWith("http")) {
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
    downloadCsv(`participants-encours-${activite.nom.slice(0, 30)}.csv`, header, rows);
  };

  if (status === "loading" || loadingAct) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (!isParoissial) return null;

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
        <p className="text-slate-500 mt-2 text-sm">
          Enregistrez les lecteurs participants (le paiement effectif sera branché plus tard).
        </p>
      </div>

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
            <p className="text-sm text-slate-500 py-6 text-center">Tous vos lecteurs sont déjà inscrits.</p>
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
            <p className="text-sm text-slate-500 py-6 text-center">Aucun participant pour le moment.</p>
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
    </div>
  );
}
