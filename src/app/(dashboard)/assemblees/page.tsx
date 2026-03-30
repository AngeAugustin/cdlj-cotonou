"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  // Mention "DIOCESAIN" si le rapport n'est associé à aucun vicariat.
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

type Toast = { message: string; type: "success" | "error" };

function isoToDatetimeLocal(input: string | Date) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local attend "YYYY-MM-DDTHH:mm" (sans timezone)
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function dateInputToIso(dateInput: string) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function AssembleesPage() {
  const { data: session, status } = useSession();
  const user = session?.user as { roles?: Role[] } | undefined;
  const roles: Role[] = user?.roles ?? [];

  const isManager = roles.some((r) => ["DIOCESAIN", "SUPERADMIN"].includes(r));
  const isVicarial = roles.includes("VICARIAL");
  const router = useRouter();

  const [list, setList] = useState<Assemblee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<"encours" | "passees">("encours");

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadAssemblies = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/assemblees");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les assemblées générales");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    void loadAssemblies();
  }, [loadAssemblies, status]);

  const filtered = useMemo(() => list.filter((a) => (tab === "encours" ? !a.terminee : a.terminee)), [list, tab]);

  // ─────────────────────────────────────────────
  // Create / Edit (manager)
  // ─────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fNom, setFNom] = useState("");
  const [fDate, setFDate] = useState("");
  const [fLieu, setFLieu] = useState("");
  const [fImage, setFImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditId(null);
    setFNom("");
    setFDate("");
    setFLieu("");
    setFImage("");
  };

  const openCreate = () => {
    resetForm();
    setEditOpen(true);
  };

  const openEdit = (a: Assemblee) => {
    setEditId(a._id);
    setFNom(a.nom ?? "");
    setFDate(isoToDatetimeLocal(a.date));
    setFLieu(a.lieu ?? "");
    setFImage(a.image ?? "");
    setEditOpen(true);
  };

  const uploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Echec du téléversement");
      if (!data.url) throw new Error("URL non renvoyée par le serveur");
      setFImage(String(data.url));
      showToast("Image téléversée");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Echec du téléversement", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fNom.trim()) return showToast("Le nom est requis", "error");
    if (!fDate) return showToast("La date est requise", "error");
    if (!fLieu.trim()) return showToast("Le lieu est requis", "error");

    const isoDate = dateInputToIso(fDate);
    if (!isoDate) return showToast("Date invalide", "error");

    setSubmitting(true);
    try {
      const payload = {
        nom: fNom.trim(),
        date: isoDate,
        lieu: fLieu.trim(),
        image: fImage.trim() || undefined,
      };

      const url = editId ? `/api/assemblees/${editId}` : "/api/assemblees";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      setEditOpen(false);
      resetForm();
      showToast(editId ? "Assemblée modifiée" : "Assemblée créée");
      await loadAssemblies();
    } catch (e2) {
      showToast(e2 instanceof Error ? e2.message : "Erreur inattendue", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Delete (manager)
  // ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Assemblee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assemblees/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Suppression impossible");
      showToast("Assemblée supprimée");
      setDeleteTarget(null);
      await loadAssemblies();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setDeleting(false);
    }
  };

  // La page de détails existe maintenant en route dédiée.
  // Le modal "Détails" n'est plus ouvert depuis l'UI ; le state évite le typage `never` sur le JSX conservé.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailTarget] = useState<Assemblee | null>(null);
  const reportsLoading = false;
  const reports: Rapport[] = [];
  const myReportLoading = false;
  const [myReport] = useState<Rapport | null>(null);
  const [globalReport] = useState<Rapport | null>(null);

  // ─────────────────────────────────────────────
  // Upload report (vicarial)
  // ─────────────────────────────────────────────
  // Upload report (vicarial)
  // ─────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<Assemblee | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  // Optionnel pour les rôles DIOCESAIN / SUPERADMIN : si vide => rapport "global" mention DIOCESAIN
  const [uploadVicariatId, setUploadVicariatId] = useState<string>("");
  const [vicariats, setVicariats] = useState<{ _id: string; name: string; abbreviation?: string }[]>([]);
  const [vicariatsLoading, setVicariatsLoading] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const openUpload = (a: Assemblee) => {
    setUploadTarget(a);
    setUploadFile(null);
    setUploadVicariatId("");
    setUploadOpen(true);
  };

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
    if (!uploadTarget) return;
    if (!uploadFile) return showToast("Sélectionnez un fichier de rapport", "error");

    setUploadingReport(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);

      if (isManager && uploadVicariatId.trim().length > 0) {
        fd.append("vicariatId", uploadVicariatId.trim());
      }

      const res = await fetch(`/api/assemblees/${uploadTarget._id}/rapport`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload impossible");

      showToast("Rapport envoyé");
      setUploadOpen(false);
      setUploadTarget(null);
      setUploadFile(null);
      setUploadVicariatId("");

      await loadAssemblies();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setUploadingReport(false);
    }
  };

  // ─────────────────────────────────────────────
  // Marquer terminé (manager)
  // ─────────────────────────────────────────────
  const terminerAssemblee = async (id: string) => {
    try {
      const res = await fetch(`/api/assemblees/${id}/terminer`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Opération impossible");
      showToast("Assemblée marquée comme terminée");
      await loadAssemblies();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  const [terminTarget, setTerminTarget] = useState<Assemblee | null>(null);
  const [terminating, setTerminating] = useState(false);

  const confirmTerminer = async () => {
    if (!terminTarget) return;
    setTerminating(true);
    try {
      await terminerAssemblee(terminTarget._id);
      setTerminTarget(null);
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

  return (
    <div className="w-full space-y-8 pb-12">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            <span className="sm:hidden">Assemb. Générales</span>
            <span className="hidden sm:inline">Assemblées Générales</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {isManager
              ? "Créez, gérez les rapports d'AG."
              : isVicarial
                ? "Soumettez votre rapport et consultez l'historique."
                : "Consultez les assemblées générales."}
          </p>
        </div>
        {isManager ? (
          <>
            <Button
              type="button"
              onClick={openCreate}
              size="icon"
              title="Ajouter une assemblée générale"
              aria-label="Ajouter une assemblée générale"
              className="h-11 w-11 shrink-0 rounded-xl bg-amber-900 hover:bg-amber-800 text-white shadow-xl shadow-amber-900/20 lg:hidden"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="hidden lg:inline-flex h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" /> Créer une Assemblée
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setTab("encours")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "encours"
              ? "bg-amber-900 text-white shadow-lg shadow-amber-900/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          En cours
        </button>
        <button
          type="button"
          onClick={() => setTab("passees")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "passees"
              ? "bg-amber-900 text-white shadow-lg shadow-amber-900/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {isManager ? "Terminées" : "Passées"}
        </button>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {loadError}
        </div>
      ) : null}

      {loadError ? null : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 py-24 flex flex-col items-center text-center">
          <FileText className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-xl font-bold text-slate-900">Aucune assemblée à afficher</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            {tab === "encours"
              ? "Il n'y a pas d'assemblée générale en cours pour le moment."
              : "Aucune assemblée générale terminée / passée."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <div
              key={a._id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/25 overflow-hidden flex flex-col"
            >
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-2xl overflow-hidden border border-white shadow-md shrink-0 bg-gradient-to-br from-amber-100 to-stone-200">
                    {a.image ? (
                      <img src={a.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-900/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm leading-tight truncate">{a.nom}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-900/60 shrink-0" />
                      {format(new Date(a.date), "d MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      a.terminee
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {a.terminee ? "Terminée" : "En cours"}
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lieu</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-800/70 shrink-0" />
                    <span className="truncate">{a.lieu}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 mt-auto pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Détails"
                    aria-label="Détails"
                    className="rounded-lg border-slate-200 font-semibold h-8 w-8 lg:w-auto px-0 lg:px-3"
                    onClick={() => router.push(`/assemblees/${a._id}`)}
                  >
                    <Eye className="w-4 h-4 lg:mr-2" />
                    <span className="hidden lg:inline">Détails</span>
                  </Button>

                  {isVicarial && !a.terminee ? (
                    <Button
                      type="button"
                      size="sm"
                      title="Soumettre rapport"
                      aria-label="Soumettre rapport"
                      className="rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-semibold h-8 w-8 lg:w-auto px-0 lg:px-3"
                      onClick={() => openUpload(a)}
                    >
                      <Upload className="w-3.5 h-3.5 lg:mr-1.5" />
                      <span className="hidden lg:inline">Soumettre rapport</span>
                    </Button>
                  ) : null}

                  {isManager && !a.terminee ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        title="Soumettre rapport"
                        aria-label="Soumettre rapport"
                        className="rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-semibold h-8 w-8 lg:w-auto px-0 lg:px-3"
                        onClick={() => openUpload(a)}
                      >
                        <Upload className="w-3.5 h-3.5 lg:mr-1.5" />
                        <span className="hidden lg:inline">Soumettre rapport</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        title="Modifier"
                        aria-label="Modifier"
                        className="rounded-lg h-8 w-8 lg:w-auto px-0 lg:px-3"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-4 h-4 lg:mr-1" />
                        <span className="hidden lg:inline">Modifier</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        title="Supprimer"
                        aria-label="Supprimer"
                        className="rounded-lg h-8 w-8 lg:w-auto px-0 lg:px-3 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="w-4 h-4 lg:mr-1" />
                        <span className="hidden lg:inline">Supprimer</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        title="Marquer terminée"
                        aria-label="Marquer terminée"
                        className="rounded-lg h-8 w-8 lg:w-auto px-0 lg:px-3 bg-emerald-700 hover:bg-emerald-800 text-white"
                        onClick={() => setTerminTarget(a)}
                      >
                        <CheckCircle className="w-4 h-4 lg:mr-1" />
                        <span className="hidden lg:inline">Terminée</span>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit ───────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l'assemblée" : "Créer une assemblée générale"}</DialogTitle>
            <DialogDescription>Nom, date et heure, lieu et (optionnel) une image de présentation.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <Label htmlFor="ag-nom">Nom de l’assemblée générale</Label>
              <Input id="ag-nom" value={fNom} onChange={(e) => setFNom(e.target.value)} className="rounded-xl mt-1.5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ag-date">Date et heure</Label>
                <Input
                  id="ag-date"
                  type="datetime-local"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="rounded-xl mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="ag-lieu">Lieu</Label>
                <Input id="ag-lieu" value={fLieu} onChange={(e) => setFLieu(e.target.value)} className="rounded-xl mt-1.5" />
              </div>
            </div>

            <div>
              <Label>Image de l’assemblée (optionnel)</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  className="rounded-xl cursor-pointer"
                  disabled={imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadImage(file);
                  }}
                />
                {imageUploading ? <Loader2 className="w-5 h-5 animate-spin text-amber-900" /> : null}
              </div>
              {fImage ? <p className="text-xs text-slate-500 mt-2 truncate">Image : {fImage}</p> : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete ───────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer cette assemblée ?</DialogTitle>
            <DialogDescription>Cette action supprime également tous les rapports associés à cette assemblée générale.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation : terminée ─────────────────── */}
      <Dialog open={!!terminTarget} onOpenChange={(o) => !o && setTerminTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Marquer cette assemblée comme terminée ?</DialogTitle>
            <DialogDescription>
              Une fois terminée, la soumission des rapports sera bloquée pour les vicariats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setTerminTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={terminating}
              onClick={() => void confirmTerminer()}
            >
              {terminating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Details ──────────────────────────────────── */}
      <Dialog open={detailsOpen} onOpenChange={(o) => !o && setDetailsOpen(false)}>
        <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-3xl sm:max-w-5xl">
          {detailTarget ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 w-full">
                  <div>
                    <DialogTitle className="text-xl">{detailTarget.nom}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {format(new Date(detailTarget.date), "PPP p", { locale: fr })} — {detailTarget.lieu}
                    </DialogDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full"
                    onClick={() => setDetailsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </DialogHeader>

              {detailTarget.image ? (
                <div className="rounded-2xl overflow-hidden border border-slate-100">
                  <img src={detailTarget.image} alt="" className="w-full max-h-48 object-cover" />
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="rounded-2xl border border-slate-100 p-4 bg-white">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Statut : </span>
                    {detailTarget.terminee ? "Terminée" : "En cours"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 bg-white">
                  {isManager && !detailTarget.terminee ? (
                    <Button
                      type="button"
                      className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                      onClick={() => setTerminTarget(detailTarget)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminée
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-500">—</p>
                  )}
                </div>
              </div>

              {/* Reports (manager) */}
              {isManager ? (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" /> Rapports associés
                  </h4>
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
                          key={r._id ?? `${r.vicariatId}-${r.fileUrl}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {r.vicariatMention ? r.vicariatMention : r.vicariat?.abbreviation ?? "Vicariat"}
                              {r.vicariatMention ? null : (
                                <span className="text-slate-500 font-normal">({r.vicariat?.name ?? "—"})</span>
                              )}
                            </p>
                            {r.originalName ? <p className="text-xs text-slate-500 truncate">Fichier : {r.originalName}</p> : null}
                          </div>
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl shrink-0")}
                          >
                            <Download className="w-4 h-4 mr-2" /> Télécharger
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {/* My report (vicarial) */}
              {isVicarial ? (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4" /> Votre rapport
                  </h4>
                  {myReportLoading ? (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                      Chargement…
                    </div>
                  ) : (
                    <>
                      {myReport?.fileUrl ? (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{myReport.originalName ?? "Rapport"}</p>
                            <p className="text-xs text-slate-500 truncate">Téléversé avec succès.</p>
                          </div>
                          <a
                            href={myReport.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl shrink-0")}
                          >
                            <Download className="w-4 h-4 mr-2" /> Télécharger
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Aucun rapport soumis pour votre vicariat pour le moment.</p>
                      )}

                      <div className="border-t border-slate-100 pt-4 mt-4">
                        <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <Upload className="w-4 h-4" /> Rapport DIOCESAIN
                        </h5>
                        {globalReport?.fileUrl ? (
                          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{globalReport.originalName ?? "Rapport"}</p>
                              <p className="text-xs text-slate-500 truncate">Non associé à un vicariat.</p>
                            </div>
                            <a
                              href={globalReport.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-xl shrink-0"
                              )}
                            >
                              <Download className="w-4 h-4 mr-2" /> Télécharger
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Aucun rapport DIOCESAIN soumis pour le moment.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Upload report ───────────────────────────── */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(o) => {
          if (!o) {
            setUploadOpen(false);
            setUploadTarget(null);
            setUploadFile(null);
            setUploadVicariatId("");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          {uploadTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Soumettre un rapport — {uploadTarget.nom}</DialogTitle>
                <DialogDescription>Uploadez le rapport au format PDF ou document Word.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label>Fichier de rapport</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="mt-1.5"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setUploadFile(file);
                    }}
                  />
                  {uploadFile ? <p className="text-xs text-slate-500 mt-2 truncate">Sélectionné : {uploadFile.name}</p> : null}
                </div>

                  {isManager ? (
                    <div>
                      <Label>Vicariat (optionnel)</Label>
                      <select
                        value={uploadVicariatId}
                        onChange={(e) => setUploadVicariatId(e.target.value)}
                        className="w-full rounded-xl mt-1.5 border border-slate-200 bg-white px-3 py-2"
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
                        Si laissé vide, le rapport sera associé à la mention <span className="font-semibold">DIOCESAIN</span>.
                      </p>
                    </div>
                  ) : null}

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setUploadOpen(false);
                      setUploadTarget(null);
                      setUploadFile(null);
                        setUploadVicariatId("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white"
                    disabled={uploadingReport}
                    onClick={() => void submitUploadReport()}
                  >
                    {uploadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
