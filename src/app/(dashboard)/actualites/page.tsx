"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Newspaper, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader2,
  CheckCircle2, AlertCircle, Search, Star, StarOff,
  Calendar, Tag, ImageOff, Send, Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePaginatedList } from "@/lib/pagination";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  type Actualite,
} from "@/modules/actualites/components/ArticleForm";

type Toast = { message: string; type: "success" | "error" };

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
// Main page
// ─────────────────────────────────────────────────────────
export default function ActualitesPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const roles: string[] = (session?.user as any)?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    const message = searchParams.get("toast");
    const type = searchParams.get("type") === "error" ? "error" : "success";
    if (message) {
      showToast(message, type);
      window.history.replaceState(null, "", "/actualites");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return actualites.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
    );
  }, [actualites, search]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    totalItems,
    showPagination,
    goToPreviousPage,
    goToNextPage,
  } = usePaginatedList(filtered, search);

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
          <Link
            href="/actualites/new"
            title="Ajouter un nouvel article"
            aria-label="Ajouter un nouvel article"
            className={cn(
              buttonVariants({ size: "icon" }),
              "h-10 w-10 shrink-0 bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold sm:h-11 sm:w-11 lg:hidden"
            )}
          >
            <Plus className="w-4 h-4" />
          </Link>
          <Link
            href="/actualites/new"
            className={cn(
              buttonVariants(),
              "hidden lg:inline-flex bg-amber-900 hover:bg-amber-800 text-white rounded-xl gap-2 font-semibold"
            )}
          >
            <Plus className="w-4 h-4" />
            Nouvel article
          </Link>
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
          <Link
            href="/actualites/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 gap-1.5 inline-flex")}
          >
            <Plus className="w-3.5 h-3.5" /> Créer le premier article
          </Link>
        </div>
      ) : (
          <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedItems.map((a) => (
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
                  <Link
                    href={`/actualites/${a._id}/edit`}
                    className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
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
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageStart={pageStart}
            pageEnd={pageEnd}
            totalItems={totalItems}
            show={showPagination}
            itemLabel="article"
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20"
          />
          </>
      )}

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

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-6 pb-5 border-b border-slate-100">
                <span>{previewItem.author}{previewItem.authorRole && ` · ${previewItem.authorRole}`}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(previewItem.createdAt)}
                </span>
                {previewItem.readTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {previewItem.readTime}
                  </span>
                )}
              </div>

              {(previewItem.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {previewItem.tags!.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}

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
