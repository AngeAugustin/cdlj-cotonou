"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Banknote,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { DashboardPageShell, DashboardPanel } from "@/components/dashboard/page-shell";

// ── Types ─────────────────────────────────────────────────
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

type Toast = { message: string; type: "success" | "error" };

function isoToDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

function isoToDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

// ── Page ──────────────────────────────────────────────────
export default function ActivitesPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as { roles?: string[] } | undefined;
  const roles: string[] = sessionUser?.roles ?? [];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isSuperAdmin = roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");

  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /** Onglet principal : en cours vs passées/terminées */
  const [mainTab, setMainTab] = useState<"encours" | "passees">("encours");

  // ── Admin : formulaire ──
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fnom, setFnom] = useState("");
  const [fdebut, setFdebut] = useState("");
  const [ffin, setFfin] = useState("");
  const [flieu, setFlieu] = useState("");
  const [fmontant, setFmontant] = useState("");
  const [fnumeroPaiement, setFnumeroPaiement] = useState("");
  const [fdelai, setFdelai] = useState("");
  const [fimage, setFimage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [termineeTarget, setTermineeTarget] = useState<Activite | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activites");
      if (res.ok) setActivites(await res.json());
      else showToast("Impossible de charger les activités", "error");
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivites();
  }, [fetchActivites]);

  const filtered = useMemo(() => {
    return activites.filter((a) => (mainTab === "encours" ? !a.terminee : a.terminee));
  }, [activites, mainTab]);

  const openCreate = () => {
    setEditId(null);
    setFnom("");
    setFdebut("");
    setFfin("");
    setFlieu("");
    setFmontant("");
    setFnumeroPaiement("");
    setFdelai("");
    setFimage("");
    setFormOpen(true);
  };

  const openEdit = (a: Activite) => {
    setEditId(a._id);
    setFnom(a.nom);
    setFdebut(isoToDateInput(a.dateDebut));
    setFfin(isoToDateInput(a.dateFin));
    setFlieu(a.lieu);
    setFmontant(String(a.montant));
    setFnumeroPaiement(a.numeroPaiement ?? "");
    setFdelai(isoToDatetimeLocal(a.delaiPaiement));
    setFimage(a.image ?? "");
    setFormOpen(true);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setFimage(data.url);
        showToast("Image téléversée");
      } else showToast(data.error ?? "Échec du téléversement", "error");
    } catch {
      showToast("Échec du téléversement", "error");
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fnom.trim() || !fdebut || !ffin || !flieu.trim() || !fmontant || !fnumeroPaiement.trim() || !fdelai) {
      showToast("Remplissez tous les champs obligatoires", "error");
      return;
    }
    setSubmitting(true);
    const payload = {
      nom: fnom.trim(),
      dateDebut: new Date(fdebut).toISOString(),
      dateFin: new Date(ffin).toISOString(),
      lieu: flieu.trim(),
      montant: Number(fmontant),
      delaiPaiement: new Date(fdelai).toISOString(),
      numeroPaiement: fnumeroPaiement.trim(),
      image: fimage.trim() || undefined,
    };
    try {
      const url = editId ? `/api/activites/${editId}` : "/api/activites";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editId ? "Activité mise à jour" : "Activité créée");
        setFormOpen(false);
        fetchActivites();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activites/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Activité supprimée");
        setDeleteId(null);
        fetchActivites();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setDeleting(false);
    }
  };

  const marquerTerminee = async (id: string) => {
    setMarkingDone(true);
    try {
      const res = await fetch(`/api/activites/${id}/terminer`, { method: "PATCH" });
      if (res.ok) {
        showToast("Activité marquée comme terminée");
        fetchActivites();
        setTermineeTarget(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setMarkingDone(false);
    }
  };

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
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-amber-900 text-white shadow-lg shadow-amber-900/25"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );

  const ActivityRow = ({ a }: { a: Activite }) => (
    <div className="px-4 py-4 sm:px-5 sm:py-4 flex flex-col gap-3 hover:bg-slate-50/70 transition-colors group">
      {/* Thumbnail */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden relative bg-slate-100 mt-0.5">
          {a.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
              <Activity className="w-5 h-5 text-amber-300" />
            </div>
          )}
        </div>

        {/* Texte */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">{a.nom}</h4>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${
                a.terminee
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-800 border border-amber-100"
              }`}
            >
              {!a.terminee && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              {a.terminee ? "Terminée" : "En cours"}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {format(new Date(a.dateDebut), "d MMM", { locale: fr })}
              {" → "}
              {format(new Date(a.dateFin), "d MMM yyyy", { locale: fr })}
            </span>
            {a.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {a.lieu}
              </span>
            )}
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <Banknote className="w-3 h-3 shrink-0" />
              {a.montant === 0 ? "Gratuit" : formatMoney(a.montant)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-slate-100/80 md:border-0 md:pt-0">
          <Link
            href={`/activites/${a._id}`}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "rounded-xl")}
            title="Détails"
            aria-label="Détails de l’activité"
          >
            <Eye className="size-3.5" />
          </Link>
          {isManager && (
            <>
              {!a.terminee && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="rounded-xl"
                  title="Modifier"
                  aria-label="Modifier l’activité"
                  onClick={() => openEdit(a)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {isSuperAdmin && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  title="Supprimer"
                  aria-label="Supprimer l’activité"
                  onClick={() => setDeleteId(a._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              {!a.terminee && (
                <Button
                  type="button"
                  size="icon-sm"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                  title="Marquer comme terminée"
                  aria-label="Marquer comme terminée"
                  onClick={() => setTermineeTarget(a)}
                >
                  <CheckCircle className="size-3.5" />
                </Button>
              )}
            </>
          )}
          {isParoissial && !a.terminee && (
            <Link
              href={`/activites/${a._id}/participer`}
              className={cn(buttonVariants({ size: "icon-sm" }), "rounded-xl bg-amber-900 hover:bg-amber-800 text-white border-0")}
              title="Participer"
              aria-label="Participer"
            >
              <UserPlus className="size-3.5" />
            </Link>
          )}
      </div>
    </div>
  );

  return (
    <DashboardPageShell
      title="Activités"
      description={
        isManager
          ? "Créez et pilotez les activités diocésaines."
          : isVicarial
            ? "Suivez les activités et la participation des paroisses de votre vicariat."
            : "Consultez les activités et enregistrez la participation de vos lecteurs."
      }
      actions={
        isManager ? (
          <>
            <Button
              type="button"
              onClick={openCreate}
              size="icon"
              title="Ajouter une activité"
              aria-label="Ajouter une activité"
              className="h-11 w-11 shrink-0 rounded-xl bg-amber-900 hover:bg-amber-800 text-white shadow-xl shadow-amber-900/20 lg:hidden"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="hidden lg:inline-flex h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" /> Créer une activité
            </Button>
          </>
        ) : null
      }
    >
      {toast && (
        <div
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <TabBtn active={mainTab === "encours"} onClick={() => setMainTab("encours")}>
          {isManager ? "En cours" : "Activités en cours"}
        </TabBtn>
        <TabBtn active={mainTab === "passees"} onClick={() => setMainTab("passees")}>
          {isManager ? "Terminées" : "Activités passées"}
        </TabBtn>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 py-24 flex flex-col items-center justify-center text-center">
          <Activity className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-xl font-bold text-slate-900">Aucune activité dans cette catégorie</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            {mainTab === "encours"
              ? "Il n’y a pas d’activité en cours pour le moment."
              : "Aucune activité terminée ou passée à afficher."}
          </p>
        </div>
      ) : (
        <DashboardPanel className="overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((a) => (
              <ActivityRow key={a._id} a={a} />
            ))}
          </div>
        </DashboardPanel>
      )}

      {/* ── Formulaire admin ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l’activité" : "Créer une activité"}</DialogTitle>
            <DialogDescription>
              Nom, dates, lieu, montant, numéro de paiement, délai de paiement et visuel (TDR — rôle diocésain).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <Label htmlFor="fnom">Nom de l’activité</Label>
              <Input id="fnom" value={fnom} onChange={(e) => setFnom(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fdebut">Date de début</Label>
                <Input id="fdebut" type="date" value={fdebut} onChange={(e) => setFdebut(e.target.value)} className="rounded-xl mt-1.5" />
              </div>
              <div>
                <Label htmlFor="ffin">Date de fin</Label>
                <Input id="ffin" type="date" value={ffin} onChange={(e) => setFfin(e.target.value)} className="rounded-xl mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="flieu">Lieu</Label>
              <Input id="flieu" value={flieu} onChange={(e) => setFlieu(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label htmlFor="fmontant">Montant (FCFA)</Label>
              <Input id="fmontant" type="number" min={0} value={fmontant} onChange={(e) => setFmontant(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label htmlFor="fnumeroPaiement">Numéro de paiement</Label>
              <Input
                id="fnumeroPaiement"
                value={fnumeroPaiement}
                onChange={(e) => setFnumeroPaiement(e.target.value)}
                placeholder="Ex. compte mobile money, référence bancaire…"
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="fdelai">Délai de paiement</Label>
              <Input id="fdelai" type="datetime-local" value={fdelai} onChange={(e) => setFdelai(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label>Image de l’activité</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <Input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="rounded-xl cursor-pointer" />
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-amber-900" />}
              </div>
              {fimage && (
                <p className="text-xs text-slate-500 mt-2 truncate">Image : {fimage}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Suppression ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer cette activité ?</DialogTitle>
            <DialogDescription>Les participations associées seront également supprimées.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="rounded-xl" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation : activité terminée ── */}
      <Dialog open={!!termineeTarget} onOpenChange={(o) => !o && setTermineeTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Marquer cette activité comme terminée ?</DialogTitle>
            <DialogDescription>
              {termineeTarget
                ? `L’activité "${termineeTarget.nom}" sera déplacée dans les activités terminées.`
                : "Cette action est irréversible."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setTermineeTarget(null)}
              disabled={markingDone}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => termineeTarget && marquerTerminee(termineeTarget._id)}
              disabled={!termineeTarget || markingDone}
            >
              {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
