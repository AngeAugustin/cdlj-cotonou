"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import {
  Newspaper, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader2,
  CheckCircle2, AlertCircle, Search, Star, StarOff,
  Calendar, Tag, UploadCloud, ImageOff, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// Tiptap editor — SSR disabled (uses browser APIs)
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type Actualite = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image?: string;
  category: string;
  author: string;
  authorRole?: string;
  readTime?: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
};

type Toast = { message: string; type: "success" | "error" };

const CATEGORIES = [
  "Événement Annuel", "Décisions", "Célébration", "Formation",
  "Communiqué", "Assemblée Générale", "Activité", "Autre",
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initials(title: string) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─────────────────────────────────────────────────────────
// Image Upload component
// ─────────────────────────────────────────────────────────
function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur upload");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {value ? (
        /* ── Preview ── */
        <div className="relative group rounded-xl overflow-hidden border border-slate-200">
          <img
            src={value}
            alt="couverture"
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 rounded-xl cursor-pointer transition-all group"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Cliquez ou glissez une image ici
                </p>
                <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP — max 5 Mo</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Article form modal (separate component to keep page clean)
// ─────────────────────────────────────────────────────────
type FormState = {
  title: string;
  excerpt: string;
  body: string;
  image: string;
  category: string;
  author: string;
  authorRole: string;
  readTime: string;
  featured: boolean;
};

function emptyForm(): FormState {
  return {
    title: "", excerpt: "", body: "", image: "",
    category: "", author: "", authorRole: "", readTime: "",
    featured: false,
  };
}

interface ArticleModalProps {
  open: boolean;
  onClose: () => void;
  editItem: Actualite | null;
  onSaved: () => void;
  onToast: (msg: string, type?: Toast["type"]) => void;
}

function ArticleModal({ open, onClose, editItem, onSaved, onToast }: ArticleModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");

  // Sync form when editing
  useEffect(() => {
    if (editItem) {
      setForm({
        title:      editItem.title,
        excerpt:    editItem.excerpt,
        body:       Array.isArray((editItem as any).body)
                      ? ((editItem as any).body as string[]).map((p) => `<p>${p}</p>`).join("")
                      : (editItem.body || ""),
        image:      editItem.image ?? "",
        category:   editItem.category,
        author:     editItem.author,
        authorRole: editItem.authorRole ?? "",
        readTime:   editItem.readTime ?? "",
        featured:   editItem.featured,
      });
      setPublishMode(editItem.published ? "publish" : "draft");
    } else {
      setForm(emptyForm());
      setPublishMode("draft");
    }
  }, [editItem, open]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        image:      form.image || undefined,
        authorRole: form.authorRole || undefined,
        readTime:   form.readTime || undefined,
        published:  publishMode === "publish",
      };

      const url    = editItem ? `/api/actualites/${editItem._id}` : "/api/actualites";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur serveur");
      }

      onToast(
        editItem
          ? "Article modifié avec succès"
          : publishMode === "publish"
            ? "Article publié avec succès"
            : "Article enregistré comme brouillon"
      );
      onSaved();
      onClose();
    } catch (err: any) {
      onToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="!max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col rounded-3xl p-0">

        {/* ── Modal Header ─── */}
        <DialogHeader className="px-8 pt-7 pb-5 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {editItem ? "Modifier l'article" : "Nouvel article"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            {editItem
              ? "Modifiez le contenu puis enregistrez ou publiez."
              : "Rédigez votre article. Vous pouvez l'enregistrer comme brouillon ou le publier directement."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Modal Body (scrollable) ─── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

            {/* ── LEFT: Main content ─── */}
            <div className="px-8 py-6 space-y-6">

              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Titre de l'article <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  placeholder="Titre accrocheur…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-base font-semibold outline-none
                             focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition placeholder:font-normal placeholder:text-sm"
                />
              </div>

              {/* Résumé */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Résumé <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-2">(affiché dans les aperçus)</span>
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  required
                  rows={2}
                  placeholder="Une phrase ou deux qui résument l'article…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                             focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition resize-none"
                />
              </div>

              {/* Éditeur riche */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contenu de l'article <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  content={form.body}
                  onChange={(html) => set("body", html)}
                  placeholder="Rédigez le contenu de votre article ici…"
                />
              </div>
            </div>

            {/* ── RIGHT: Settings panel ─── */}
            <div className="px-6 py-6 space-y-6 bg-slate-50/60">

              {/* Image de couverture */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Image de couverture
                </label>
                <ImageUpload
                  value={form.image}
                  onChange={(url) => set("image", url)}
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                             focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 bg-white transition"
                >
                  <option value="">Sélectionner…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Auteur */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Auteur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                  required
                  placeholder="Nom de l'auteur"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                             focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
                />
              </div>


              {/* Temps de lecture */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Temps de lecture
                  <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.readTime ? parseInt(form.readTime) || "" : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      set("readTime", v ? `${v} min de lecture` : "");
                    }}
                    placeholder="1 – 60"
                    className="w-28 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                               focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
                  />
                  <span className="text-sm text-slate-500">min de lecture</span>
                </div>
              </div>

              {/* À la une */}
              <div className="flex items-center justify-between py-3.5 px-4 bg-white rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">À la une</p>
                  <p className="text-xs text-slate-400">Affiché en tête de page</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.featured}
                  onClick={() => set("featured", !form.featured)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200
                    ${form.featured ? "bg-amber-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${form.featured ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ── Modal Footer ─── */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0
              ${publishMode === "publish" ? "bg-green-500" : "bg-slate-400"}`} />
            <span className="text-xs font-semibold text-slate-500">
              {publishMode === "publish" ? "Sera publié" : "Sera enregistré comme brouillon"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border-slate-200"
            >
              Annuler
            </Button>

            {/* Enregistrer brouillon */}
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => { setPublishMode("draft"); (document.querySelector("form") as HTMLFormElement)?.requestSubmit(); }}
              className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-2"
            >
              {submitting && publishMode === "draft" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enregistrer brouillon
            </Button>

            {/* Publier */}
            <Button
              type="button"
              disabled={submitting}
              onClick={() => { setPublishMode("publish"); (document.querySelector("form") as HTMLFormElement)?.requestSubmit(); }}
              className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold gap-2"
            >
              {submitting && publishMode === "publish" && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              Publier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────
export default function ActualitesPage() {
  const { data: session } = useSession();
  const roles: string[] = (session?.user as any)?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Actualite | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<Actualite | null>(null);

  type ConfirmAction = {
    id: string;
    type: "publish" | "unpublish" | "feature" | "unfeature";
    label: string;
    description: string;
  };
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchActualites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/actualites?all=true");
      if (res.ok) setActualites(await res.json());
    } catch {
      showToast("Erreur lors du chargement des actualités", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchActualites(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return actualites.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
    );
  }, [actualites, search]);

  const quickUpdate = async (id: string, patch: Partial<Actualite>) => {
    try {
      const res = await fetch(`/api/actualites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setActualites((prev) => prev.map((a) => (a._id === id ? { ...a, ...patch } : a)));
      showToast(patch.published !== undefined
        ? (patch.published ? "Article publié avec succès" : "Article dépublié")
        : (patch.featured ? "Article mis à la une" : "Article retiré de la une"));
    } catch {
      showToast("Mise à jour échouée", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);
    const { id, type } = confirmAction;
    const patch =
      type === "publish"   ? { published: true }  :
      type === "unpublish" ? { published: false } :
      type === "feature"   ? { featured: true }   :
                             { featured: false };
    await quickUpdate(id, patch);
    setConfirmAction(null);
    setIsConfirming(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/actualites/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Article supprimé");
      setDeleteId(null);
      fetchActualites();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const published = actualites.filter((a) => a.published).length;
  const featured  = actualites.filter((a) => a.featured).length;
  const drafts    = actualites.filter((a) => !a.published).length;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Accès réservé aux administrateurs diocésains.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none border
          ${toast.type === "success"
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-red-50 border-red-200 text-red-900"}`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <AlertCircle  className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-amber-700" />
            Actualités
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Créez et gérez les articles.
          </p>
        </div>
        <>
          <Button
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            size="icon"
            title="Ajouter un nouvel article"
            aria-label="Ajouter un nouvel article"
            className="h-10 w-10 shrink-0 bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold sm:h-11 sm:w-11 lg:hidden"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="hidden lg:inline-flex bg-amber-900 hover:bg-amber-800 text-white rounded-xl gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nouvel article
          </Button>
        </>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: actualites.length, color: "text-slate-800",  bg: "bg-slate-50 border-slate-200" },
          { label: "Publiés",    value: published,          color: "text-green-700",  bg: "bg-green-50 border-green-200" },
          { label: "Brouillons", value: drafts,             color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
          { label: "À la une",   value: featured,           color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par titre, catégorie, auteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm
                     outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
        />
      </div>

      {/* ── Cartes ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Newspaper className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Aucun article trouvé</p>
          <Button variant="outline" size="sm"
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="mt-2 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Créer le premier article
          </Button>
        </div>
      ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <article
                key={a._id}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.title}
                      className="w-14 h-12 rounded-xl object-cover shrink-0 border border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-sm">
                      <span className="text-xs font-extrabold text-amber-800">{initials(a.title)}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 text-sm leading-tight line-clamp-2">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.excerpt}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> {a.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      a.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {a.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {a.published ? "Publié" : "Brouillon"}
                  </span>
                  <button
                    onClick={() =>
                      setConfirmAction(
                        a.featured
                          ? {
                              id: a._id,
                              type: "unfeature",
                              label: "Retirer de la une",
                              description: `"${a.title}" ne sera plus affiché en tête de la page Blog & Actualités.`,
                            }
                          : {
                              id: a._id,
                              type: "feature",
                              label: "Mettre à la une",
                              description: `"${a.title}" apparaîtra en position principale sur la page Blog & Actualités.`,
                            },
                      )
                    }
                    title={a.featured ? "Retirer de la une" : "Mettre à la une"}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                      a.featured
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-slate-600 bg-white border-slate-200 hover:border-amber-200 hover:text-amber-700"
                    }`}
                  >
                    {a.featured ? <Star className="w-3 h-3 fill-amber-400" /> : <StarOff className="w-3 h-3" />}
                    {a.featured ? "À la une" : "Standard"}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-900/10 flex items-center justify-center text-[10px] font-bold text-amber-900 shrink-0">
                        {a.author.charAt(0)}
                      </span>
                      <span className="truncate">{a.author}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(a.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {!a.published && (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          id: a._id,
                          type: "publish",
                          label: "Publier l'article",
                          description: `"${a.title}" sera visible par tous les visiteurs sur la page Blog & Actualités.`,
                        })
                      }
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Publier"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewItem(a)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    title="Aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditItem(a);
                      setModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(a._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────── */}
      <ArticleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        editItem={editItem}
        onSaved={fetchActualites}
        onToast={showToast}
      />

      {/* ── Confirm Action Dialog ─────────────────────────── */}
      <Dialog open={!!confirmAction} onOpenChange={(v) => { if (!v) setConfirmAction(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              {confirmAction?.label}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {confirmAction?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} className="rounded-xl" disabled={isConfirming}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isConfirming}
              className={`rounded-xl font-semibold gap-2 text-white
                ${confirmAction?.type === "publish"   ? "bg-green-600 hover:bg-green-700" :
                  confirmAction?.type === "unpublish" ? "bg-slate-700 hover:bg-slate-800" :
                  confirmAction?.type === "feature"   ? "bg-amber-600 hover:bg-amber-700" :
                                                        "bg-slate-600 hover:bg-slate-700"}`}
            >
              {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              Supprimer l'article
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Cette action est irréversible. L'article sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleDelete} disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview Overlay ───────────────────────────────── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto">

            {previewItem.image ? (
              <div className="relative h-60 w-full overflow-hidden rounded-t-3xl">
                <img src={previewItem.image} alt={previewItem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            ) : (
              <div className="h-20 rounded-t-3xl bg-gradient-to-r from-amber-800 to-amber-900 flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-white/40" />
              </div>
            )}

            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                  <Tag className="w-3 h-3" /> {previewItem.category}
                </span>
                <button onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 mb-3 leading-tight">
                {previewItem.title}
              </h2>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 pb-5 border-b border-slate-100">
                <span>{previewItem.author}{previewItem.authorRole && ` · ${previewItem.authorRole}`}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(previewItem.createdAt)}
                </span>
              </div>

              <p className="text-slate-600 font-medium italic border-l-4 border-amber-700 pl-4 mb-6">
                {previewItem.excerpt}
              </p>

              <div
                className="prose prose-slate prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewItem.body }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
