"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ImageIcon, Plus, Loader2,
  CheckCircle2, AlertCircle, Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePaginatedList } from "@/lib/pagination";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { type MediathequeItem } from "@/modules/mediatheque/components/MediathequeForm";
import {
  MediathequeCard,
  MEDIATHEQUE_COMPACT_GRID,
} from "@/components/mediatheque/MediathequeCard";

type Toast = { message: string; type: "success" | "error" };

export default function GestionMediathequePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  const [items, setItems] = useState<MediathequeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mediatheque?all=true");
      if (res.ok) {
        const data = await res.json();
        setItems(data.map((d: MediathequeItem & { _id: unknown }) => ({ ...d, _id: String(d._id) })));
      }
    } catch {
      showToast("Erreur lors du chargement", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const message = searchParams.get("toast");
    const type = searchParams.get("type") === "error" ? "error" : "success";
    if (message) {
      showToast(message, type);
      window.history.replaceState(null, "", "/gestion-mediatheque");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.nom.toLowerCase().includes(q) ||
        item.categorie.toLowerCase().includes(q)
    );
  }, [items, search]);

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

  const togglePublish = async (item: MediathequeItem) => {
    try {
      const res = await fetch(`/api/mediatheque/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, published: !i.published } : i))
      );
      showToast(item.published ? "Médiathèque dépubliée" : "Médiathèque publiée");
    } catch {
      showToast("Mise à jour échouée", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/mediatheque/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Médiathèque supprimée");
      setDeleteId(null);
      fetchItems();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const published = items.filter((i) => i.published).length;
  const drafts = items.filter((i) => !i.published).length;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Accès réservé aux Super Admin et Diocésains.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border pointer-events-none
          ${toast.type === "success" ? "bg-slate-900 border-slate-800 text-white" : "bg-red-50 border-red-200 text-red-900"}`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-700" />
            Médiathèque
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Créez et gérez les albums affichés sur la page publique.
          </p>
        </div>
        <Link
          href="/gestion-mediatheque/new"
          className={cn(buttonVariants(), "bg-amber-900 hover:bg-amber-800 text-white rounded-xl gap-2 font-semibold shrink-0")}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle médiathèque</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: items.length, color: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
          { label: "Publiées", value: published, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Brouillons", value: drafts, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${s.bg}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou catégorie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <ImageIcon className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Aucune médiathèque trouvée</p>
          <Link href="/gestion-mediatheque/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 inline-flex mt-2")}>
            <Plus className="w-3.5 h-3.5" /> Créer la première
          </Link>
        </div>
      ) : (
        <>
        <div className={MEDIATHEQUE_COMPACT_GRID}>
          {paginatedItems.map((item) => (
            <MediathequeCard
              key={item._id}
              item={item}
              compact
              mode="admin"
              editHref={`/gestion-mediatheque/${item._id}/edit`}
              onTogglePublish={() => togglePublish(item)}
              onDelete={() => setDeleteId(item._id)}
            />
          ))}
        </div>
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageStart={pageStart}
          pageEnd={pageEnd}
          totalItems={totalItems}
          show={showPagination}
          itemLabel="élément"
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
          className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20"
        />
        </>
      )}

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Supprimer cette médiathèque ?</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
