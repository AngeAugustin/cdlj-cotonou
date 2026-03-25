"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Search,
  Download,
  UserPlus,
  FileEdit,
  Trash2,
  Eye,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LecteurForm, type LecteurFormInitial } from "@/modules/lecteurs/components/LecteurForm";
import {
  type ApiLecteur,
  type ParishRef,
  type VicariatRef,
  ageYearsForCsv,
  displayAvatarSrc,
  formatAgeLabel,
  gradeLabel,
  lecteurInitials,
  rattachementLines,
  refId,
} from "@/modules/lecteurs/lecteurViewUtils";

export type { ApiLecteur } from "@/modules/lecteurs/lecteurViewUtils";

export default function LecteursPage() {
  const { data: session, status } = useSession();
  const user = session?.user as { roles?: string[]; parishId?: string; vicariatId?: string } | undefined;
  const roles: string[] = user?.roles ?? [];

  const [list, setList] = useState<ApiLecteur[]>([]);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiLecteur | null>(null);
  const [editGradeLocked, setEditGradeLocked] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ApiLecteur | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = roles.some((r) => ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"].includes(r));
  const userIsParoissial = roles.includes("PAROISSIAL");
  const userIsVicarial = roles.includes("VICARIAL");

  const [vicariatsOpts, setVicariatsOpts] = useState<{ _id: string; name: string }[]>([]);
  const [paroissesOpts, setParoissesOpts] = useState<{ _id: string; name: string; vicariatId: string }[]>([]);

  /** Référence stable : évite de relancer `form.reset` dans LecteurForm à chaque rendu du parent. */
  const lockParishVicariatForEdit = useMemo(() => {
    if (!editTarget) return undefined;
    if (!userIsParoissial && !userIsVicarial) return undefined;
    return {
      paroisseId: refId(editTarget.paroisseId),
      vicariatId: refId(editTarget.vicariatId),
      paroisseName:
        editTarget.paroisseId && typeof editTarget.paroisseId === "object" && "name" in editTarget.paroisseId
          ? (editTarget.paroisseId as ParishRef).name
          : undefined,
      vicariatName:
        editTarget.vicariatId && typeof editTarget.vicariatId === "object" && "name" in editTarget.vicariatId
          ? (editTarget.vicariatId as VicariatRef).name
          : undefined,
    };
  }, [editTarget, userIsParoissial, userIsVicarial]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/lecteurs");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les lecteurs");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    fetch("/api/grades")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGrades(data.map((g: { _id: string; name: string }) => ({ _id: String(g._id), name: g.name })));
      })
      .catch(() => setGrades([]));
  }, []);

  useEffect(() => {
    if (roles.includes("PAROISSIAL")) return;
    Promise.all([fetch("/api/vicariats"), fetch("/api/paroisses")])
      .then(async ([rv, rp]) => {
        const vj = await rv.json().catch(() => []);
        const pj = await rp.json().catch(() => []);
        if (Array.isArray(vj)) setVicariatsOpts(vj.map((x: { _id: string; name: string }) => ({ _id: String(x._id), name: x.name })));
        if (Array.isArray(pj))
          setParoissesOpts(
            pj.map((x: any) => ({
              _id: String(x._id),
              name: String(x.name),
              vicariatId: x.vicariatId ? String(x.vicariatId) : x.vicariat?._id ? String(x.vicariat._id) : "",
            }))
          );
      })
      .catch(() => {
        setVicariatsOpts([]);
        setParoissesOpts([]);
      });
  }, [roles]);

  useEffect(() => {
    let cancelled = false;

    async function loadConcernedFlag() {
      if (!editOpen || !editTarget) {
        setEditGradeLocked(false);
        return;
      }

      try {
        const res = await fetch(`/api/lecteurs/${editTarget._id}/evaluations/concerned`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setEditGradeLocked(!!data?.hasEvaluations);
      } catch {
        if (cancelled) return;
        setEditGradeLocked(false);
      }
    }

    void loadConcernedFlag();
    return () => {
      cancelled = true;
    };
  }, [editOpen, editTarget?._id]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return list.filter((l) => {
      const gId = refId(l.gradeId);
      if (gradeFilter && gId !== gradeFilter) return false;
      if (!q) return true;
      const blob = `${l.uniqueId} ${l.nom} ${l.prenoms}`.toLowerCase();
      return blob.includes(q);
    });
  }, [list, searchTerm, gradeFilter]);

  const stats = useMemo(() => {
    const uniqueGrades = new Set(list.map((l) => refId(l.gradeId)).filter(Boolean));
    const uniqueParishes = new Set(list.map((l) => refId(l.paroisseId)).filter(Boolean));

    return [
      { label: "Total", value: list.length, color: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
      { label: "Affichés", value: filtered.length, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
      { label: "Grades", value: uniqueGrades.size, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
      { label: "Paroisses", value: uniqueParishes.size, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    ];
  }, [list, filtered]);

  const exportCsv = () => {
    const headers = [
      "Numéro unique",
      "Nom",
      "Prénoms",
      "Grade",
      "Âge",
      "Sexe",
      "Année adhésion",
      "Niveau",
      "Contact",
      "Urgence",
      "Adresse",
      "Paroisse",
      "Vicariat",
    ];
    const rows = filtered.map((l) => {
      const p = l.paroisseId;
      const v = l.vicariatId;
      const pn = p && typeof p === "object" && "name" in p ? p.name : "";
      const vn = v && typeof v === "object" && "name" in v ? v.name : "";
      return [
        l.uniqueId,
        l.nom,
        l.prenoms,
        gradeLabel(l),
        ageYearsForCsv(l.dateNaissance),
        l.sexe,
        String(l.anneeAdhesion),
        l.niveau,
        l.contact,
        l.contactUrgence,
        l.adresse.replace(/"/g, '""'),
        pn,
        vn,
      ]
        .map((c) => `"${String(c)}"`)
        .join(";");
    });
    const bom = "\uFEFF";
    const csv = bom + headers.join(";") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lecteurs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lecteurs/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Suppression impossible");
      setDeleteTarget(null);
      await loadList();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lecteurs</h1>
          <p className="text-slate-500 mt-2 text-lg max-w-2xl">
            Liste des lecteurs enregistrés pour votre juridiction : recherche, export, fiche dédiée avec historique
            des participations aux activités (TDR interface paroissiale).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 px-6 rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 gap-2 shadow-sm"
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            <Download className="w-4 h-4" /> Télécharger la liste (CSV)
          </Button>
          {canCreate ? (
            <Link
              href="/lecteurs/new"
              className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold gap-2 shadow-xl shadow-amber-900/20 transition-colors"
            >
              <UserPlus className="w-5 h-5" /> Inscrire un lecteur
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par numéro, nom ou prénom…"
            className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:w-56 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900 appearance-none"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">Tous les grades</option>
            {grades.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {loadError}
        </div>
      ) : null}

      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden relative">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium">Aucun lecteur à afficher.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                  <th className="p-5 font-semibold">Lecteur</th>
                  <th className="p-5 font-semibold hidden md:table-cell">Numéro</th>
                  <th className="p-5 font-semibold">Grade</th>
                  <th className="p-5 font-semibold hidden sm:table-cell">Âge</th>
                  <th className="p-5 font-semibold hidden md:table-cell min-w-[10rem]">Rattachement</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filtered.map((l) => {
                  const rowAvatar = displayAvatarSrc(l);
                  const r = rattachementLines(l);
                  return (
                  <tr key={l._id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0">
                          {rowAvatar ? <AvatarImage src={rowAvatar} alt="" className="object-cover" /> : null}
                          <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 font-extrabold text-sm">
                            {lecteurInitials(l)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-base truncate">
                            {l.nom} {l.prenoms}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 md:hidden font-mono">{l.uniqueId}</p>
                          <p className="text-[11px] text-slate-500 md:hidden mt-1 leading-snug">
                            <span className="font-semibold text-slate-600">{r.vicariat}</span>
                            <span className="text-slate-400"> · </span>
                            {r.paroisse}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <span className="font-mono text-sm font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                        {l.uniqueId}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="font-bold text-slate-700 text-sm">{gradeLabel(l)}</span>
                    </td>
                    <td className="p-5 hidden sm:table-cell">
                      <span className="text-sm font-semibold text-slate-600">{formatAgeLabel(l.dateNaissance)}</span>
                    </td>
                    <td className="p-5 hidden md:table-cell align-top">
                      <div className="text-sm font-semibold text-slate-800 leading-snug">{r.vicariat}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{r.paroisse}</div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/lecteurs/${l._id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                          )}
                          title="Fiche détaillée"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {canCreate ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                              title="Modifier"
                              onClick={() => {
                                setEditTarget(l);
                                setEditOpen(true);
                                void fetch(`/api/lecteurs/${l._id}`)
                                  .then((r) => r.json().catch(() => ({})))
                                  .then((data: { lecteur?: ApiLecteur }) => {
                                    if (data.lecteur) setEditTarget(data.lecteur);
                                  });
                              }}
                            >
                              <FileEdit className="w-5 h-5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
                              title="Supprimer"
                              onClick={() => setDeleteTarget(l)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                      <div className="flex justify-end gap-1 sm:hidden mt-2">
                        <Link
                          href={`/lecteurs/${l._id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                        >
                          Détails
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Édition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl"
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl text-amber-900">Modifier le lecteur</DialogTitle>
              <DialogDescription>Mettez à jour les informations du lecteur.</DialogDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => setEditOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          {editTarget ? (
            <LecteurForm
              key={editTarget._id}
              mode="edit"
              lecteurId={editTarget._id}
              initialData={editTarget as LecteurFormInitial}
              lockParishVicariat={lockParishVicariatForEdit}
              lockGradeId={editGradeLocked}
              vicariats={lockParishVicariatForEdit ? [] : vicariatsOpts}
              paroisses={lockParishVicariatForEdit ? [] : paroissesOpts}
              onSuccess={() => {
                setEditOpen(false);
                setEditTarget(null);
                loadList();
              }}
              onCancel={() => {
                setEditOpen(false);
                setEditTarget(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer ce lecteur ?</DialogTitle>
            <DialogDescription>
              Cette action retire également les participations liées. {deleteTarget ? `${deleteTarget.nom} ${deleteTarget.prenoms}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
