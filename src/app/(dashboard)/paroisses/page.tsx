"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2, Plus, Edit2, Trash2, Eye, X, Loader2,
  CheckCircle2, AlertCircle, Search, Users, Church,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePaginatedList } from "@/lib/pagination";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type Vicariat = { _id: string; name: string; abbreviation: string };

type Paroisse = {
  _id: string;
  name: string;
  cureName?: string;
  coordonnateur?: string;
  logo?: string;
  vicariatId: string;
  vicariat?: Vicariat;
  lecteurCount: number;
};

// ─────────────────────────────────────────────────────────
// Toast helper
// ─────────────────────────────────────────────────────────
type Toast = { message: string; type: "success" | "error" };

// ─────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────
export default function ParoissesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const roles: string[] = (session?.user as any)?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");

  // ── State ─────────────────────────────────────────────
  const [paroisses, setParoisses] = useState<Paroisse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vicariats, setVicariats] = useState<Vicariat[]>([]);

  // Form modal (ADMIN)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fname, setFname] = useState("");
  const [fcureName, setFcureName] = useState("");
  const [fcoordonnateur, setFcoordonnateur] = useState("");
  const [fvicariatId, setFvicariatId] = useState("");
  const [flogo, setFlogo] = useState("");

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [paroisseSearch, setParoisseSearch] = useState("");

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch paroisses ───────────────────────────────────
  const fetchParoisses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/paroisses");
      if (res.ok) setParoisses(await res.json());
    } catch {
      showToast("Erreur lors du chargement des paroisses", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch vicariats (for admin form dropdown) ─────────
  const fetchVicariats = async () => {
    try {
      const res = await fetch("/api/vicariats");
      if (res.ok) setVicariats(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchParoisses();
    if (isAdmin) fetchVicariats();
  }, [isAdmin]);

  // ── Open form modals ──────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setFname(""); setFcureName(""); setFcoordonnateur("");
    setFvicariatId(vicariats[0]?._id ?? ""); setFlogo("");
    setIsModalOpen(true);
  };

  const openEdit = (p: Paroisse) => {
    setEditId(p._id);
    setFname(p.name); setFcureName(p.cureName ?? "");
    setFcoordonnateur(p.coordonnateur ?? "");
    setFvicariatId(p.vicariatId ?? p.vicariat?._id ?? "");
    setFlogo(p.logo ?? "");
    setIsModalOpen(true);
  };

  // ── Submit (create / edit) ────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fname.trim() || !fvicariatId) {
      showToast("Nom et vicariat sont requis", "error"); return;
    }
    setIsSubmitting(true);
    const payload = {
      name: fname.trim(), cureName: fcureName.trim() || undefined,
      coordonnateur: fcoordonnateur.trim() || undefined,
      vicariatId: fvicariatId, logo: flogo.trim() || undefined,
    };
    try {
      const url    = editId ? `/api/paroisses/${editId}` : "/api/paroisses";
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(editId ? "Paroisse modifiée" : "Paroisse créée");
        setIsModalOpen(false);
        fetchParoisses();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur lors de l'opération", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/paroisses/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setParoisses((prev) => prev.filter((p) => p._id !== deleteId));
        showToast("Paroisse supprimée");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur lors de la suppression", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // ── Filtered paroisses list ───────────────────────────
  const filteredParoisses = useMemo(() => {
    if (!paroisseSearch.trim()) return paroisses;
    const q = paroisseSearch.toLowerCase();
    return paroisses.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.vicariat?.name ?? "").toLowerCase().includes(q) ||
      (p.cureName ?? "").toLowerCase().includes(q)
    );
  }, [paroisses, paroisseSearch]);

  const {
    paginatedItems: paginatedParoisses,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    totalItems,
    showPagination,
    goToPreviousPage,
    goToNextPage,
  } = usePaginatedList(filteredParoisses, paroisseSearch);

  const openDetails = (p: Paroisse) => {
    router.push(`/paroisses/${p._id}`);
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8 relative">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isVicarial ? "Paroisses du Vicariat" : "Paroisses"}
            </h1>
            <p className="text-slate-500 mt-1 text-base">
              {isVicarial
                ? "Liste des paroisses rattachées à votre vicariat."
                : "Créez et administrez les paroisses."}
            </p>
          </div>
          {isAdmin && (
            <>
              <Button
                onClick={openCreate}
                size="icon"
                title="Ajouter une paroisse"
                aria-label="Ajouter une paroisse"
                className="h-11 w-11 shrink-0 rounded-xl bg-amber-900 hover:bg-amber-800 text-white shadow-lg shadow-amber-900/20 lg:hidden"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                onClick={openCreate}
                className="hidden h-11 px-6 shrink-0 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20 lg:inline-flex"
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter une paroisse
              </Button>
            </>
          )}
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une paroisse…"
            value={paroisseSearch}
            onChange={(e) => setParoisseSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 transition-all"
          />
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────── */}
      {!isLoading && paroisses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Paroisses", value: paroisses.length, icon: Building2, color: "text-amber-700 bg-amber-50" },
            { label: "Lecteurs au total", value: paroisses.reduce((s, p) => s + p.lecteurCount, 0), icon: Users, color: "text-blue-700 bg-blue-50" },
            {
              label: "Avec coordonnateur",
              value: paroisses.filter((p) => p.coordonnateur).length,
              icon: Church,
              color: "text-emerald-700 bg-emerald-50",
              className: "hidden lg:flex",
            },
          ].map((s, i) => (
            <div key={i} className={`bg-white border border-slate-100 rounded-2xl px-5 py-4 items-center gap-4 shadow-sm flex ${s.className ?? ""}`.trim()}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-center gap-4">
            <Loader2 className="w-12 h-12 text-amber-900 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement des paroisses…</p>
          </div>
        ) : filteredParoisses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center gap-4">
            <Building2 className="w-16 h-16 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-900">
              {paroisseSearch ? "Aucun résultat" : "Aucune paroisse"}
            </h3>
            <p className="text-slate-500 max-w-sm text-sm">
              {paroisseSearch
                ? "Aucune paroisse ne correspond à votre recherche."
                : isAdmin
                  ? "Commencez par ajouter la première paroisse."
                  : "Aucune paroisse n'est encore rattachée à votre vicariat."}
            </p>
            {isAdmin && !paroisseSearch && (
              <Button onClick={openCreate} variant="outline" className="mt-2 rounded-xl text-amber-900 border-amber-200 hover:bg-amber-50 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Ajouter la première paroisse
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedParoisses.map((p) => (
                <div key={`card-${p._id}`} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 overflow-hidden text-amber-900 shrink-0">
                        {p.logo ? <img src={p.logo} alt={p.name} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 opacity-30" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{p.name}</p>
                        {p.vicariat?.name ? (
                          <p className="text-xs text-slate-500 truncate">
                            {p.vicariat.abbreviation ? `${p.vicariat.abbreviation} · ` : ""}
                            {p.vicariat.name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                      <Users className="w-3 h-3" />
                      {p.lecteurCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-600">
                    {p.cureName ? <p><span className="text-slate-400">Cure:</span> {p.cureName}</p> : null}
                    {p.coordonnateur ? <p><span className="text-slate-400">Coordonnateur:</span> {p.coordonnateur}</p> : null}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openDetails(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 hover:text-amber-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> Détails
                    </button>
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-xl p-2 text-slate-500 transition-all hover:bg-amber-50 hover:text-amber-600"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="rounded-xl p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    <th className="p-5 w-16">Logo</th>
                    <th className="p-5">Paroisse</th>
                    {isAdmin && <th className="p-5">Vicariat</th>}
                    {isAdmin && <th className="p-5">Curé</th>}
                    {isVicarial && <th className="p-5">Coordonnateur</th>}
                    <th className="p-5 text-center">Lecteurs</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginatedParoisses.map((p) => (
                    <tr key={p._id} className="hover:bg-amber-50/20 transition-colors group">
                      <td className="p-5">
                        <div className="w-11 h-11 rounded-xl border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 overflow-hidden text-amber-900 shrink-0">
                          {p.logo ? <img src={p.logo} alt={p.name} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 opacity-30" />}
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                        {isVicarial && p.coordonnateur && <p className="text-xs text-slate-400 mt-0.5">{p.coordonnateur}</p>}
                      </td>
                      {isAdmin && (
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            {p.vicariat?.abbreviation ?? "—"} · {p.vicariat?.name ?? "—"}
                          </span>
                        </td>
                      )}
                      {isAdmin && (
                        <td className="p-5">
                          {p.cureName ? <span className="text-sm text-slate-700 font-medium">{p.cureName}</span> : <span className="text-slate-400 italic text-sm">Non renseigné</span>}
                        </td>
                      )}
                      {isVicarial && (
                        <td className="p-5">
                          {p.coordonnateur ? <span className="text-sm text-slate-700 font-medium">{p.coordonnateur}</span> : <span className="text-slate-400 italic text-sm">Non renseigné</span>}
                        </td>
                      )}
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <Users className="w-3 h-3" />
                          {p.lecteurCount}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetails(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 hover:text-amber-700"
                          >
                            <Eye className="h-3.5 w-3.5" /> Détails
                          </button>
                          {isAdmin ? (
                            <div className="flex items-center gap-1.5 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                              <button onClick={() => openEdit(p)} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600" title="Modifier">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteId(p._id)} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageStart={pageStart}
              pageEnd={pageEnd}
              totalItems={totalItems}
              show={showPagination}
              itemLabel="paroisse"
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          MODAL — Créer / Modifier (ADMIN)
      ════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editId ? "Modifier la paroisse" : "Nouvelle paroisse"}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                    {editId ? "Mettre à jour les informations" : "Renseigner les informations"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-5 overflow-y-auto max-h-[65vh]">

              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Nom de la paroisse <span className="text-red-500">*</span></label>
                <input
                  required type="text" value={fname} onChange={(e) => setFname(e.target.value)}
                  placeholder="Ex : Saint Michel AKPAKPA"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm"
                />
              </div>

              {/* Vicariat */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Vicariat forain <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    required value={fvicariatId} onChange={(e) => setFvicariatId(e.target.value)}
                    className="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm appearance-none font-medium"
                  >
                    <option value="">Sélectionner un vicariat…</option>
                    {vicariats.map((v) => (
                      <option key={v._id} value={v._id}>{v.name} ({v.abbreviation})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Curé */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Nom du curé <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
                </label>
                <input
                  type="text" value={fcureName} onChange={(e) => setFcureName(e.target.value)}
                  placeholder="Ex : Père Jean-Baptiste KOUASSI"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm"
                />
              </div>

              {/* Coordonnateur paroissial */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Coordonnateur paroissial <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
                </label>
                <input
                  type="text" value={fcoordonnateur} onChange={(e) => setFcoordonnateur(e.target.value)}
                  placeholder="Ex : Fr Arsène TOSSOU"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm"
                />
              </div>

              {/* Logo */}
              <div className="hidden lg:block space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Logo (URL) <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
                </label>
                <input
                  type="url" value={flogo} onChange={(e) => setFlogo(e.target.value)}
                  placeholder="https://…/logo.png"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}
                className="h-11 px-8 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20 w-full sm:w-auto">
                {isSubmitting
                  ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</span>
                  : editId ? "Enregistrer" : "Créer la paroisse"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DIALOG — Confirmation suppression
      ════════════════════════════════════════════════ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-center">
              Êtes-vous sûr de vouloir supprimer définitivement cette paroisse ?<br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              {isDeleting
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Suppression…</span>
                : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl
          animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none border
          ${toast.type === "success"
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-red-50 border-red-200 text-red-900"}`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
