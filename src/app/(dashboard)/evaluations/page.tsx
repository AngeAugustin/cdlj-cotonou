"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createEvaluationSchema, updateEvaluationSchema } from "@/modules/evaluations/schema";

type EvaluationNode = {
  _id: string;
  nom: string;
  annee: number;
  nombreNotes: number;
  terminee: boolean;
  publiee: boolean;
  gradeId: { _id?: string; name: string; abbreviation: string; level: number };
  activiteId: { _id?: string; nom: string; dateDebut: string | Date; dateFin: string | Date; lieu: string; montant?: number; terminee?: boolean };
};

export default function EvaluationsPage() {
  const { data: session, status } = useSession();
  const user = session?.user as { roles?: string[] } | undefined;
  const roles: string[] = user?.roles ?? [];

  const isManager = roles.some((r) => ["DIOCESAIN", "SUPERADMIN"].includes(r));

  const getEvaluationStatus = (ev: EvaluationNode) => {
    if (ev.terminee && ev.publiee) return { label: "Terminée & publiée", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (ev.terminee) return { label: "Terminée", badge: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "En cours", badge: "bg-slate-50 text-slate-700 border-slate-200" };
  };

  const [evaluations, setEvaluations] = useState<EvaluationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return evaluations;
    return evaluations.filter((e) => {
      const gradeBlob = `${e.gradeId?.name ?? ""} ${e.gradeId?.abbreviation ?? ""}`.toLowerCase();
      const activiteBlob = `${e.activiteId?.nom ?? ""} ${e.activiteId?.lieu ?? ""}`.toLowerCase();
      const blob = `${e.nom} ${e.annee} ${gradeBlob} ${activiteBlob}`.toLowerCase();
      return blob.includes(q);
    });
  }, [evaluations, searchTerm]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/evaluations");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les évaluations");
      setEvaluations(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    void loadAll();
  }, [loadAll, status]);

  // ─────────────────────────────────────────────
  // Create / Edit modal
  // ─────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTerminee, setEditTerminee] = useState(false);
  const [fNom, setFNom] = useState("");
  const [fAnnee, setFAnnee] = useState<number | "">("");
  const [fGradeId, setFGradeId] = useState("");
  const [fActiviteId, setFActiviteId] = useState("");
  const [fNombreNotes, setFNombreNotes] = useState<number>(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState<Partial<Record<"nom" | "annee" | "gradeId" | "activiteId" | "nombreNotes", string>>>({});

  const [grades, setGrades] = useState<{ _id: string; name: string; level: number; abbreviation: string }[]>([]);
  const [activites, setActivites] = useState<{ _id: string; nom: string; dateDebut: string | Date; dateFin: string | Date; lieu: string; terminee?: boolean; montant?: number }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [rg, ra] = await Promise.all([fetch("/api/grades"), fetch("/api/activites")]);
      const gData = await rg.json().catch(() => []);
      const aData = await ra.json().catch(() => []);
      setGrades(Array.isArray(gData) ? (gData as typeof grades) : []);

      type ActiviteLite = { terminee?: boolean };
      const list = Array.isArray(aData) ? (aData as (typeof activites)[number][]) : [];
      setActivites(list.filter((a: ActiviteLite) => !a.terminee));
    } catch {
      setGrades([]);
      setActivites([]);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const openCreate = async () => {
    setEditId(null);
    setEditTerminee(false);
    setSubmitLoading(false);
    setFormFieldErrors({});
    setFNom("");
    setFAnnee(new Date().getFullYear());
    setFGradeId("");
    setFActiviteId("");
    setFNombreNotes(1);
    if (!grades.length || !activites.length) await loadOptions();
    setFormOpen(true);
  };

  const openEdit = async (e: EvaluationNode) => {
    setEditId(e._id);
    setEditTerminee(!!e.terminee);
    setSubmitLoading(false);
    setFormFieldErrors({});
    setFNom(e.nom ?? "");
    setFAnnee(e.annee);
    setFGradeId(e.gradeId?._id ?? "");
    setFActiviteId(e.activiteId?._id ?? "");
    setFNombreNotes(e.nombreNotes ?? 1);
    if (!grades.length || !activites.length) await loadOptions();
    setFormOpen(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<EvaluationNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/evaluations/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Suppression impossible");
      setDeleteTarget(null);
      await loadAll();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const inProgressEdit = !!editId && !editTerminee;
    const payload = inProgressEdit
      ? {
          // Règle: une évaluation "en cours" ne peut être éditée que sur ces 2 champs.
          activiteId: fActiviteId,
          nombreNotes: fNombreNotes,
        }
      : {
          nom: fNom.trim(),
          annee: fAnnee === "" ? undefined : Number(fAnnee),
          gradeId: fGradeId,
          activiteId: fActiviteId,
          nombreNotes: fNombreNotes,
        };

    // validation côté client
    setFormFieldErrors({});
    try {
      const parsed = inProgressEdit ? updateEvaluationSchema.safeParse(payload) : createEvaluationSchema.safeParse(payload);
      if (!parsed.success) {
        const next: typeof formFieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string") {
            // Message volontairement simple (pas de détails techniques).
            next[key as keyof typeof formFieldErrors] = "Champ requis";
          }
        }
        setFormFieldErrors(next);
        showToast("Certains champs ne sont pas remplis.", "error");
        return;
      }

      const validated = parsed.data;

      // Règle TDR: il ne peut pas y avoir deux évaluations pour la même année.
      // (Note: en édition en cours, on n'envoie pas/ni ne change `annee`.)
      if (!inProgressEdit && typeof validated.annee === "number") {
        const desiredYear = validated.annee;
        const conflict = evaluations.some((ev) => ev.annee === desiredYear && (!editId || ev._id !== editId));
        if (conflict) {
          throw new Error(`Une évaluation pour l'année ${desiredYear} existe déjà`);
        }
      }

      // Règle TDR: il ne peut pas y avoir deux évaluations avec le même nom.
      if (!inProgressEdit && typeof (validated as { nom?: unknown }).nom === "string") {
        const desiredNom = (validated as { nom: string }).nom.trim();
        const conflict = evaluations.some((ev) => ev.nom?.trim() === desiredNom && (!editId || ev._id !== editId));
        if (conflict) {
          throw new Error(`Une évaluation avec le nom "${desiredNom}" existe déjà`);
        }
      }

      setSubmitLoading(true);
      const url = editId ? `/api/evaluations/${editId}` : "/api/evaluations";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      setFormOpen(false);
      setEditId(null);
      showToast(editId ? "Évaluation modifiée" : "Évaluation créée");
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Champs invalides", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  const inProgressEdit = !!editId && !editTerminee;

  return (
    <div className="w-full space-y-8 pb-12">
      {toast ? (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${toast.type === "success" ? "bg-emerald-700" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Évaluations</h1>
          <p className="text-slate-500 mt-2 text-lg">Évaluations annuelles pour le passage de grades des lecteurs.</p>
        </div>
        {isManager ? (
          <Button onClick={openCreate} className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 transition-all">
            <Plus className="w-5 h-5 mr-2" /> Nouvelle Évaluation
          </Button>
        ) : null}
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Label className="sr-only">Recherche</Label>
          <Input
            type="text"
            placeholder="Rechercher par nom, année, grade, activité…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {loadError}
        </div>
      ) : null}

      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden relative">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            {searchTerm ? "Aucun résultat." : "Aucune évaluation enregistrée."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                  <th className="p-5 font-semibold">Évaluation</th>
                  <th className="p-5 font-semibold hidden md:table-cell">Grade</th>
                  <th className="p-5 font-semibold hidden lg:table-cell">Activité</th>
                  <th className="p-5 font-semibold hidden xl:table-cell">Statut</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filtered.map((ev) => (
                  <tr key={ev._id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-base truncate">{ev.nom}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Année <span className="font-mono font-bold text-amber-900">{ev.annee}</span> · {ev.nombreNotes} note(s)
                        </p>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 rounded-lg text-sm font-bold">
                        {ev.gradeId?.abbreviation ?? "—"}
                      </span>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ev.activiteId?.nom ?? "—"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(ev.activiteId?.dateDebut ?? new Date()), "dd/MM/yyyy", { locale: fr })} —{" "}
                          {format(new Date(ev.activiteId?.dateFin ?? new Date()), "dd/MM/yyyy", { locale: fr })}
                        </p>
                      </div>
                    </td>
                    <td className="p-5 hidden xl:table-cell">
                      {(() => {
                        const st = getEvaluationStatus(ev);
                        return (
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border text-xs font-bold whitespace-nowrap ${st.badge}`}>
                            {st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/evaluations/${ev._id}`}
                          className={buttonVariants({ variant: "ghost", size: "icon" }) + " rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50"}
                          title="Détails"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {isManager && !ev.terminee ? (
                          <button
                            type="button"
                            onClick={() => openEdit(ev)}
                            className="rounded-xl p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                            title="Modifier"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        ) : null}
                        {/* Une évaluation en cours ne peut pas être supprimée */}
                        {isManager && ev.terminee ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ev)}
                            className="rounded-xl p-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex justify-end gap-2 sm:hidden">
                        <Link href={`/evaluations/${ev._id}`} className={buttonVariants({ variant: "outline", size: "sm" }) + " rounded-lg"}>
                          Détails
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          // S'assure que le bouton "Créer/Enregistrer" n'est jamais bloqué
          // si un état de soumission précédent restait actif.
          if (!o) setSubmitLoading(false);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl sm:max-w-4xl">
          <DialogHeader>
            <div className="flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-xl text-amber-900">
                  {editId ? "Modifier l'évaluation" : "Créer une évaluation"}
                </DialogTitle>
                <DialogDescription>
                  Nom, année, grade concerné, activité (en cours) et nombre de notes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-nom">Nom de l’évaluation</Label>
                <Input
                  id="ev-nom"
                  value={fNom}
                  onChange={(e) => setFNom(e.target.value)}
                  disabled={inProgressEdit}
                  aria-invalid={!!formFieldErrors.nom}
                  className="rounded-xl mt-1.5"
                />
                {formFieldErrors.nom ? <p className="text-xs text-red-600 mt-1">{formFieldErrors.nom}</p> : null}
              </div>
              <div>
                <Label htmlFor="ev-annee">Année de l’évaluation</Label>
                <Input
                  id="ev-annee"
                  type="number"
                  value={fAnnee}
                  onChange={(e) => setFAnnee(e.target.value ? Number(e.target.value) : "")}
                  className="rounded-xl mt-1.5"
                  disabled={inProgressEdit}
                  aria-invalid={!!formFieldErrors.annee}
                />
                {formFieldErrors.annee ? <p className="text-xs text-red-600 mt-1">{formFieldErrors.annee}</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-grade">Grade concerné</Label>
                <select
                  id="ev-grade"
                  value={fGradeId}
                  onChange={(e) => setFGradeId(e.target.value)}
                  disabled={optionsLoading || inProgressEdit}
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900 ${
                    inProgressEdit ? "opacity-60 cursor-not-allowed" : ""
                  } ${formFieldErrors.gradeId ? "border-red-500 bg-red-50 focus:border-red-600" : ""}`}
                  aria-invalid={!!formFieldErrors.gradeId}
                >
                  <option value="">Sélectionner un grade…</option>
                  {grades.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.abbreviation})
                    </option>
                  ))}
                </select>
                {formFieldErrors.gradeId ? <p className="text-xs text-red-600 mt-1">{formFieldErrors.gradeId}</p> : null}
              </div>
              <div>
                <Label htmlFor="ev-act">Activité concernée</Label>
                <select
                  id="ev-act"
                  value={fActiviteId}
                  onChange={(e) => setFActiviteId(e.target.value)}
                  disabled={optionsLoading}
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900 ${
                    formFieldErrors.activiteId ? "border-red-500 bg-red-50 focus:border-red-600" : ""
                  }`}
                  aria-invalid={!!formFieldErrors.activiteId}
                >
                  <option value="">Sélectionner une activité…</option>
                  {activites.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
                {formFieldErrors.activiteId ? <p className="text-xs text-red-600 mt-1">{formFieldErrors.activiteId}</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-notes">Nombre de notes</Label>
                <Input
                  id="ev-notes"
                  type="number"
                  min={1}
                  max={20}
                  value={fNombreNotes}
                  onChange={(e) => setFNombreNotes(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className="rounded-xl mt-1.5"
                  aria-invalid={!!formFieldErrors.nombreNotes}
                />
                {formFieldErrors.nombreNotes ? <p className="text-xs text-red-600 mt-1">{formFieldErrors.nombreNotes}</p> : null}
              </div>
              <div className="flex items-end">
                <p className="text-sm text-slate-500">
                  Les notes sont saisies et validées par `DIOCESAIN` / `SUPERADMIN`.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitLoading} className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white">
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer cette évaluation ?</DialogTitle>
            <DialogDescription>Les notes et les associations seront également supprimées.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button type="button" className="rounded-xl bg-red-600 hover:bg-red-700 text-white" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
