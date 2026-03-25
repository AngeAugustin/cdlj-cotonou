"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Calendar,
  MapPin,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Role = string;

type Assemblee = {
  _id: string;
  nom: string;
  date: string | Date;
  lieu: string;
  image?: string;
  terminee: boolean;
};

type Rapport = {
  _id?: string;
  assembleeId: string;
  vicariatId?: string | null;
  vicariatMention?: string;
  fileUrl: string;
  originalName?: string;
  mimeType?: string;
  createdAt?: string;
  vicariat?: {
    name?: string;
    abbreviation?: string;
  };
};

export default function AssembleeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params);
  const assembleeId = resolvedParams.id;
  const { data: session, status } = useSession();
  const user = session?.user as { roles?: Role[]; vicariatId?: string | null } | undefined;
  const roles: Role[] = user?.roles ?? [];

  const isManager = roles.some((r) => ["DIOCESAIN", "SUPERADMIN"].includes(r));
  const isVicarial = roles.includes("VICARIAL");

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assemblee, setAssemblee] = useState<Assemblee | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  // Manager: rapports associés
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reports, setReports] = useState<Rapport[]>([]);

  // Upload
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVicariatId, setUploadVicariatId] = useState<string>("");

  const [vicariats, setVicariats] = useState<{ _id: string; name: string; abbreviation?: string }[]>([]);
  const [vicariatsLoading, setVicariatsLoading] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  /** Rapport ciblé quand l’upload sert à remplacer (même clé assemblee + vicariat côté API). */
  const [reportToReplace, setReportToReplace] = useState<Rapport | null>(null);

  const [confirmTermineeOpen, setConfirmTermineeOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const canUpload = useMemo(() => !assemblee?.terminee, [assemblee?.terminee]);

  const canReplaceReport = (r: Rapport) => {
    if (!canUpload) return false;
    if (isManager) return true;
    if (isVicarial && user?.vicariatId && r.vicariatId) {
      return String(r.vicariatId) === String(user.vicariatId);
    }
    return false;
  };

  const openReplaceReport = (r: Rapport) => {
    setReportToReplace(r);
    setUploadFile(null);
    if (isManager) {
      setUploadVicariatId(r.vicariatId ? String(r.vicariatId) : "");
    } else {
      setUploadVicariatId("");
    }
    setUploadOpen(true);
  };

  const closeUploadDialog = () => {
    setUploadOpen(false);
    setReportToReplace(null);
    setUploadFile(null);
    setUploadVicariatId("");
  };

  const [tab, setTab] = useState<"infos" | "rapports">("infos");

  useEffect(() => {
    if (status === "loading") return;
    if (!assembleeId) return;
    setLoading(true);
    setLoadError(null);

    void fetch(`/api/assemblees/${encodeURIComponent(assembleeId)}`)
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (!data?._id) throw new Error(data?.error ?? "Impossible de charger l'assemblée");
        setAssemblee(data as Assemblee);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [status, assembleeId]);

  useEffect(() => {
    if (!assembleeId) return;

    if (isManager || isVicarial) {
      setReportsLoading(true);
      setReports([]);
      void fetch(`/api/assemblees/${encodeURIComponent(assembleeId)}/rapport`)
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (Array.isArray(data?.rapports)) setReports(data.rapports as Rapport[]);
        })
        .catch(() => {})
        .finally(() => setReportsLoading(false));
    }
  }, [assembleeId, isManager, isVicarial]);

  useEffect(() => {
    if (!uploadOpen || !isManager) return;
    setVicariatsLoading(true);
    void fetch("/api/vicariats")
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (Array.isArray(data)) setVicariats(data);
      })
      .catch(() => {})
      .finally(() => setVicariatsLoading(false));
  }, [uploadOpen, isManager]);

  const submitUploadReport = async () => {
    if (!assemblee) return;
    if (!uploadFile) return showToast("Sélectionnez un fichier de rapport", "error");
    if (!canUpload) return showToast("Cette assemblée est terminée : upload interdit", "error");

    setUploadingReport(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);

      if (isManager && uploadVicariatId.trim().length > 0) {
        fd.append("vicariatId", uploadVicariatId.trim());
      }

      const res = await fetch(`/api/assemblees/${encodeURIComponent(assemblee._id)}/rapport`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload impossible");

      showToast(reportToReplace ? "Rapport remplacé" : "Rapport envoyé");
      closeUploadDialog();

      // Rafraîchit la section rapports selon le rôle courant
      if (isManager || isVicarial) {
        setReportsLoading(true);
        setReports([]);
        void fetch(`/api/assemblees/${encodeURIComponent(assemblee._id)}/rapport`)
          .then((r) => r.json().catch(() => ({})))
          .then((d) => {
            if (Array.isArray(d?.rapports)) setReports(d.rapports as Rapport[]);
          })
          .catch(() => {})
          .finally(() => setReportsLoading(false));
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setUploadingReport(false);
    }
  };

  const terminerAssemblee = async () => {
    if (!assemblee) return;
    try {
      setTerminating(true);
      await fetch(`/api/assemblees/${encodeURIComponent(assemblee._id)}/terminer`, { method: "PATCH" });
      showToast("Assemblée marquée comme terminée");
      // Recharge l’assemblée et rafraîchit (utile pour bloquer l’upload)
      void fetch(`/api/assemblees/${encodeURIComponent(assemblee._id)}`)
        .then((r) => r.json().catch(() => ({})))
        .then((d) => setAssemblee(d as Assemblee))
        .catch(() => {});
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setTerminating(false);
    }
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

  if (!assemblee) return null;

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
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-amber-50/80 via-white/60 to-slate-50/40 border border-slate-200/60 shadow-sm">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/10 blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-amber-100/30 blur-[60px]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="rounded-2xl w-fit"
                onClick={() => router.push("/assemblees")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </Button>

              {(isManager || isVicarial) && !assemblee.terminee ? (
                <div className="flex gap-3 flex-wrap justify-end">
                  <Button
                    type="button"
                    className="rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-semibold"
                    onClick={() => {
                      setReportToReplace(null);
                      setUploadVicariatId("");
                      setUploadFile(null);
                      setUploadOpen(true);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Soumettre rapport
                  </Button>
                  {isManager ? (
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
              ) : null}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-amber-700/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                  Fiche Assemblée Générale
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
                  {assemblee.nom}
                </h1>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${
                        assemblee.terminee
                          ? "bg-slate-50 text-slate-500 border-slate-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${assemblee.terminee ? "text-slate-500" : "text-green-700"}`} />
                      {assemblee.terminee ? "Terminée" : "En cours"}
                    </span>

                    <span className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-amber-700" />
                      {assemblee.terminee ? "Upload bloqué" : "Upload autorisé"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-900/60" />
                    {format(new Date(assemblee.date), "PPP p", { locale: fr })}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-900/60" />
                    {assemblee.lieu}
                  </p>
                </div>
              </div>

              <div className="lg:w-[320px] lg:shrink-0">
                <div className="rounded-3xl border border-slate-200/60 bg-white p-3 shadow-sm">
                  {assemblee.image ? (
                    <img
                      src={assemblee.image}
                      alt=""
                      className="w-full object-cover rounded-2xl max-h-64 mx-auto"
                    />
                  ) : (
                    <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center text-amber-900/40 font-bold">
                      AG
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-8">
          {([
            { key: "infos", label: "Informations", icon: Calendar },
            { key: "rapports", label: "Rapports", icon: FileText },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key
                  ? "bg-white text-amber-900 shadow-sm shadow-slate-200/60"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {tab === "infos" ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6 min-w-0">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-900/10">
                    <FileText className="w-4 h-4 text-amber-900" />
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Résumé de l’assemblée</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {format(new Date(assemblee.date), "PPP p", { locale: fr })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Lieu</p>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{assemblee.lieu}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Statut</p>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {assemblee.terminee ? "Terminée" : "En cours"} —{" "}
                      {assemblee.terminee ? "soumission des rapports bloquée" : "soumission possible"}
                    </p>
                  </div>
                </div>

                {/* Bouton "Marquer comme terminée" supprimé de la section Résumé (onglet Informations) */}
              </div>

              {isManager ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/80 p-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-900/10">
                      <FileText className="w-4 h-4 text-amber-900" />
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Rapports associés</h2>
                  </div>
                  {reportsLoading ? (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                      Chargement…
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {reports.length} rapport(s) associé(s) à cette assemblée.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rapports (manager + vicarial) */}
            {isManager || isVicarial ? (
              <div className="rounded-2xl border border-slate-100 p-4 bg-white lg:col-span-2">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" /> Rapports associés
                </h2>

                {reportsLoading ? (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                    Chargement des rapports…
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun rapport n’est encore disponible.</p>
                ) : (
                  <ul className="space-y-2">
                    {reports.map((r) => (
                      <li
                        key={r._id ?? `${r.vicariatId ?? r.vicariatMention}-${r.fileUrl}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {r.vicariatMention ? r.vicariatMention : r.vicariat?.abbreviation ?? "Vicariat"}
                            {r.vicariatMention ? null : (
                              <span className="text-slate-500 font-normal">({r.vicariat?.name ?? "—"})</span>
                            )}
                          </p>
                          {r.originalName ? (
                            <p className="text-xs text-slate-500 truncate">Fichier : {r.originalName}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl shrink-0")}
                          >
                            <Download className="w-4 h-4 mr-2" /> Télécharger
                          </a>
                          {canReplaceReport(r) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="rounded-xl shrink-0"
                              onClick={() => openReplaceReport(r)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Remplacer
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {/* Lecture seule */}
            {!isManager && !isVicarial ? (
              <div className="rounded-2xl border border-slate-100 p-4 bg-white lg:col-span-2">
                Vous n’avez pas les droits d’accès à cette page.
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Dialog
        open={uploadOpen}
        onOpenChange={(o) => {
          if (!o) closeUploadDialog();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{reportToReplace ? "Remplacer le rapport" : "Soumettre un rapport"}</DialogTitle>
            <DialogDescription>
              {reportToReplace
                ? "Le nouveau fichier remplacera le document actuellement enregistré pour cette entrée."
                : "Envoyez un fichier PDF ou Word."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fichier de rapport</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-1.5"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? <p className="text-xs text-slate-500 mt-2 truncate">Sélectionné : {uploadFile.name}</p> : null}
            </div>

            {isManager ? (
              <div>
                <Label>Vicariat (optionnel)</Label>
                <select
                  value={uploadVicariatId}
                  onChange={(e) => setUploadVicariatId(e.target.value)}
                  disabled={!!reportToReplace}
                  className="w-full rounded-xl mt-1.5 border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Non précisé (DIOCESAIN)</option>
                  {vicariatsLoading ? <option value="" disabled>Chargement…</option> : null}
                  {vicariats.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.abbreviation ? `${v.abbreviation} - ${v.name}` : v.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {reportToReplace ? (
                    <>Le vicariat ne peut pas être modifié lors d’un remplacement.</>
                  ) : (
                    <>
                      Si laissé vide, le rapport sera associé à la mention <span className="font-semibold">DIOCESAIN</span>.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            <div className="pt-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeUploadDialog}>
                Annuler
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white"
                disabled={uploadingReport}
                onClick={() => void submitUploadReport()}
              >
                {uploadingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : reportToReplace ? (
                  "Remplacer"
                ) : (
                  "Envoyer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation : marquer comme terminée */}
      <Dialog
        open={confirmTermineeOpen}
        onOpenChange={(o) => {
          if (!o) setConfirmTermineeOpen(false);
        }}
      >
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer cette assemblée comme terminée ?</DialogTitle>
            <DialogDescription>
              Une fois terminée, la soumission des rapports sera bloquée pour les vicariats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={terminating}
              onClick={() => setConfirmTermineeOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={terminating}
              onClick={() => {
                setConfirmTermineeOpen(false);
                void terminerAssemblee();
              }}
            >
              {terminating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

