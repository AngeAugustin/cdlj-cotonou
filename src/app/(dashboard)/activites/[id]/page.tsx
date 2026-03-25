"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
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
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

type StatsPayload = {
  totalLecteurs: number;
  totalParticipants: number;
  byParoisse: {
    paroisseId: string;
    paroisseName: string;
    vicariatName?: string;
    count: number;
  }[];
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

export default function ActiviteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params);
  const activiteId = resolvedParams.id;
  const { data: session, status } = useSession();
  const roles: string[] = ((session?.user as any)?.roles ?? []) as string[];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activite, setActivite] = useState<Activite | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const [confirmTermineeOpen, setConfirmTermineeOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const [tab, setTab] = useState<"infos" | "participation">("infos");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    if (!activite) return;
    if (!(isManager || isVicarial)) return;
    setStatsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/stats`)
      .then((r) => r.json().catch(() => ({})))
      .then((data) => setStats(data as StatsPayload))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [activite, isManager, isVicarial]);

  useEffect(() => {
    if (!activite || !activite.terminee || !isParoissial) return;
    setParticipantsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/participations`)
      .then((r) => r.json().catch(() => ([])))
      .then((data) => setParticipants(Array.isArray(data) ? (data as ParticipantRow[]) : []))
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  }, [activite, isParoissial]);

  const participationRate = useMemo(() => {
    if (!stats || !stats.totalLecteurs) return 0;
    return Math.round((stats.totalParticipants / stats.totalLecteurs) * 100);
  }, [stats]);

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

  const downloadParticipants = () => {
    if (!activite || !participants.length) return;
    const header = ["Matricule", "Nom", "Prénoms", "Grade", "Âge"];
    const rows = participants.map((p) => [
      p.lecteur.uniqueId,
      p.lecteur.nom,
      p.lecteur.prenoms,
      p.grade?.name || p.grade?.abbreviation || "—",
      ageFromBirth(p.lecteur.dateNaissance),
    ]);
    downloadCsv(`participants-${activite.nom.slice(0, 30)}.csv`, header, rows);
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
        <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-amber-50/80 via-white/60 to-slate-50/40 border border-slate-200/60 shadow-sm">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/10 blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-amber-100/30 blur-[60px]" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition-all hover:bg-white hover:text-slate-800 group"
                onClick={() => router.push("/activites")}
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Retour à la liste
              </Button>

              {isManager && !activite.terminee ? (
                <Button
                  type="button"
                  className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                  onClick={() => setConfirmTermineeOpen(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme terminée
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-amber-700/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Fiche Activité</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {activite.nom}
                </h1>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${
                        activite.terminee
                          ? "bg-slate-50 text-slate-500 border-slate-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${activite.terminee ? "text-slate-500" : "text-green-700"}`} />
                      {activite.terminee ? "Terminée" : "En cours"}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                      {formatMoney(activite.montant)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-900/60" />
                    {format(new Date(activite.dateDebut), "PPP", { locale: fr })} — {format(new Date(activite.dateFin), "PPP", { locale: fr })}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-900/60" />
                    {activite.lieu}
                  </p>
                </div>
              </div>

              <div className="lg:w-[200px] lg:shrink-0">
                <div className="rounded-3xl border border-slate-200/60 bg-white p-3 shadow-sm">
                  {activite.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activite.image} alt="" className="w-full object-cover rounded-2xl max-h-40 mx-auto" />
                  ) : (
                    <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center">
                      <Activity className="w-14 h-14 text-amber-900/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-8">
          <button
            onClick={() => setTab("infos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "infos" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Informations
          </button>
          <button
            onClick={() => setTab("participation")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "participation" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Participation
          </button>
        </div>

        {tab === "infos" ? (
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
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Montant</p>
                <p className="text-sm font-semibold text-slate-800">{formatMoney(activite.montant)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Délai de paiement</p>
                <p className="text-sm font-semibold text-slate-800">
                  {format(new Date(activite.delaiPaiement), "PPPp", { locale: fr })}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Numéro de paiement</p>
                <p className="text-sm font-semibold text-slate-800">{activite.numeroPaiement?.trim() || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(isManager || isVicarial) ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" /> Participation par paroisse
                </h2>
                {statsLoading ? (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                    Chargement des statistiques…
                  </div>
                ) : stats ? (
                  <>
                    <p className="text-sm text-slate-600 mb-3">
                      <span className="font-semibold text-amber-900">{stats.totalParticipants}</span> participant(s) sur{" "}
                      <span className="font-semibold">{stats.totalLecteurs}</span> lecteur(s) ({participationRate}%).
                    </p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="p-3 font-semibold text-slate-700">Paroisse</th>
                            {isManager ? <th className="p-3 font-semibold text-slate-700">Vicariat</th> : null}
                            <th className="p-3 font-semibold text-slate-700 text-right">Participants</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stats.byParoisse.length === 0 ? (
                            <tr>
                              <td colSpan={isManager ? 3 : 2} className="p-4 text-slate-500 text-center">
                                Aucune participation enregistrée
                              </td>
                            </tr>
                          ) : (
                            stats.byParoisse.map((row) => (
                              <tr key={row.paroisseId} className="hover:bg-amber-50/40">
                                <td className="p-3">{row.paroisseName}</td>
                                {isManager ? <td className="p-3 text-slate-600">{row.vicariatName ?? "—"}</td> : null}
                                <td className="p-3 text-right font-semibold text-amber-900">{row.count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Statistiques indisponibles.</p>
                )}
              </div>
            ) : null}

            {isParoissial && activite.terminee ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Lecteurs ayant participé
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl shrink-0"
                    onClick={downloadParticipants}
                    disabled={!participants.length || participantsLoading}
                  >
                    <Download className="w-4 h-4 mr-1" /> Télécharger
                  </Button>
                </div>
                {participantsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
                ) : participants.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun participant enregistré pour votre paroisse.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto space-y-2 text-sm">
                    {participants.map((p) => (
                      <li key={p.lecteur._id} className="flex justify-between gap-2 py-2 border-b border-slate-50">
                        <span className="font-medium text-slate-900">
                          {p.lecteur.nom} {p.lecteur.prenoms}
                        </span>
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

