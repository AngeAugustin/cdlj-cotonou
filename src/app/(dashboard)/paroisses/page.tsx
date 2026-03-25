"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Building2, Plus, Edit2, Trash2, Eye, X, Loader2,
  CheckCircle2, AlertCircle, Search, Users, Church,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type Lecteur = {
  _id: string;
  nom: string;
  prenoms: string;
  uniqueId: string;
  sexe: "M" | "F";
  gradeId?: { name: string; abbreviation: string } | null;
  dateNaissance?: string;
};

// ─────────────────────────────────────────────────────────
// Toast helper
// ─────────────────────────────────────────────────────────
type Toast = { message: string; type: "success" | "error" };

// ─────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────
export default function ParoissesPage() {
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

  // Details panel (VICARIAL)
  const [detailsParoisse, setDetailsParoisse] = useState<Paroisse | null>(null);
  const [detailsLecteurs, setDetailsLecteurs] = useState<Lecteur[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // ── Open details (VICARIAL) ───────────────────────────
  const openDetails = async (p: Paroisse) => {
    setDetailsParoisse(p);
    setSearchQuery("");
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/lecteurs?paroisseId=${p._id}`);
      if (res.ok) setDetailsLecteurs(await res.json());
    } catch {
      setDetailsLecteurs([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ── Filtered lecteurs (search in details) ────────────
  const filteredLecteurs = useMemo(() => {
    if (!searchQuery.trim()) return detailsLecteurs;
    const q = searchQuery.toLowerCase();
    return detailsLecteurs.filter((l) =>
      `${l.nom} ${l.prenoms}`.toLowerCase().includes(q) ||
      l.uniqueId.toLowerCase().includes(q) ||
      (l.gradeId?.name ?? "").toLowerCase().includes(q) ||
      (l.gradeId?.abbreviation ?? "").toLowerCase().includes(q)
    );
  }, [detailsLecteurs, searchQuery]);

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

  // ── Helpers ───────────────────────────────────────────
  const getAge = (dob?: string) => {
    if (!dob) return "—";
    return String(new Date().getFullYear() - new Date(dob).getFullYear());
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8 relative">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isVicarial ? "Paroisses de mon Vicariat" : "Gestion des Paroisses"}
          </h1>
          <p className="text-slate-500 mt-1 text-base">
            {isVicarial
              ? "Liste des paroisses rattachées à votre vicariat."
              : "Créez et administrez les paroisses du diocèse."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une paroisse…"
              value={paroisseSearch}
              onChange={(e) => setParoisseSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 transition-all"
            />
          </div>
          {isAdmin && (
            <Button
              onClick={openCreate}
              className="h-11 px-6 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter une paroisse
            </Button>
          )}
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────── */}
      {!isLoading && paroisses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Paroisses",        value: paroisses.length,                              icon: Building2, color: "text-amber-700 bg-amber-50" },
            { label: "Lecteurs au total", value: paroisses.reduce((s, p) => s + p.lecteurCount, 0), icon: Users,     color: "text-blue-700 bg-blue-50"  },
            { label: "Avec coordonnateur", value: paroisses.filter((p) => p.coordonnateur).length, icon: Church,    color: "text-emerald-700 bg-emerald-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                <th className="p-5 w-16">Logo</th>
                <th className="p-5">Paroisse</th>
                {isAdmin  && <th className="p-5 hidden md:table-cell">Vicariat</th>}
                {isAdmin  && <th className="p-5 hidden lg:table-cell">Curé</th>}
                {isVicarial && <th className="p-5 hidden md:table-cell">Coordonnateur</th>}
                <th className="p-5 text-center">Lecteurs</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredParoisses.map((p) => (
                <tr key={p._id} className="hover:bg-amber-50/20 transition-colors group">

                  {/* Logo */}
                  <td className="p-5">
                    <div className="w-11 h-11 rounded-xl border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 overflow-hidden text-amber-900 shrink-0">
                      {p.logo
                        ? <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
                        : <Building2 className="w-5 h-5 opacity-30" />}
                    </div>
                  </td>

                  {/* Nom + zone */}
                  <td className="p-5">
                    <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                    {isVicarial && p.coordonnateur && (
                      <p className="text-xs text-slate-400 mt-0.5">{p.coordonnateur}</p>
                    )}
                  </td>

                  {/* Vicariat (admin only) */}
                  {isAdmin && (
                    <td className="p-5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {p.vicariat?.abbreviation ?? "—"} · {p.vicariat?.name ?? "—"}
                      </span>
                    </td>
                  )}

                  {/* Curé (admin only) */}
                  {isAdmin && (
                    <td className="p-5 hidden lg:table-cell">
                      {p.cureName
                        ? <span className="text-sm text-slate-700 font-medium">{p.cureName}</span>
                        : <span className="text-slate-400 italic text-sm">Non renseigné</span>}
                    </td>
                  )}

                  {/* Coordonnateur (vicarial only) */}
                  {isVicarial && (
                    <td className="p-5 hidden md:table-cell">
                      {p.coordonnateur
                        ? <span className="text-sm text-slate-700 font-medium">{p.coordonnateur}</span>
                        : <span className="text-slate-400 italic text-sm">Non renseigné</span>}
                    </td>
                  )}

                  {/* Lecteur count */}
                  <td className="p-5 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Users className="w-3 h-3" />
                      {p.lecteurCount}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-5 text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Modifier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p._id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDetails(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Détails
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <div className="space-y-1.5">
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
          MODAL — Détails paroisse + lecteurs (VICARIAL)
      ════════════════════════════════════════════════ */}
      {detailsParoisse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {detailsParoisse.logo
                    ? <img src={detailsParoisse.logo} alt="" className="w-full h-full object-cover" />
                    : <Building2 className="w-7 h-7 text-amber-700 opacity-50" />}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{detailsParoisse.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{detailsParoisse.vicariat?.name ?? "Vicariat"}</p>
                </div>
              </div>
              <button onClick={() => { setDetailsParoisse(null); setDetailsLecteurs([]); }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Infos strip */}
            <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0">
              {[
                { label: "Curé",            value: detailsParoisse.cureName || "—"         },
                { label: "Coordonnateur",   value: detailsParoisse.coordonnateur || "—"    },
                { label: "Lecteurs inscrits", value: String(detailsParoisse.lecteurCount)  },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{f.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Search lecteurs */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, matricule ou grade…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 hover:bg-slate-200/50 focus:bg-white border border-transparent focus:border-amber-900/20 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lecteurs list */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-amber-900 animate-spin" />
                  <span className="text-slate-500 font-medium">Chargement des lecteurs…</span>
                </div>
              ) : filteredLecteurs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <Users className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-500 font-medium">
                    {searchQuery ? "Aucun lecteur ne correspond à la recherche." : "Aucun lecteur enregistré dans cette paroisse."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {filteredLecteurs.length} lecteur{filteredLecteurs.length > 1 ? "s" : ""}
                    {searchQuery ? " trouvé(s)" : ""}
                  </p>
                  <div className="space-y-2">
                    {filteredLecteurs.map((l) => (
                      <div key={l._id}
                        className="flex items-center gap-4 p-3.5 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-transparent hover:border-amber-100 transition-all">
                        {/* Avatar initials */}
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold text-sm shrink-0">
                          {l.nom.charAt(0)}{l.prenoms.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                            {l.nom} {l.prenoms}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{l.uniqueId}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {l.gradeId ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              {l.gradeId.abbreviation ?? l.gradeId.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 italic">Sans grade</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">{l.sexe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
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
