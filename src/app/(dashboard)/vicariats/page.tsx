"use client";

import { useState, useEffect } from "react";
import { Map, Plus, Edit2, Trash2, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type VicariatNode = {
  _id: string;
  name: string;
  abbreviation: string;
  aumonier?: string;
  logo?: string;
};

export default function VicariatsPage() {
  const [vicariats, setVicariats] = useState<VicariatNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editVicariatId, setEditVicariatId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [aumonier, setAumonier] = useState("");
  const [logo, setLogo] = useState("");

  const [deleteVicariatId, setDeleteVicariatId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVicariats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vicariats");
      if (res.ok) {
        const data = await res.json();
        setVicariats(data);
      }
    } catch (error) {
      console.error("Failed to fetch vicariats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVicariats();
  }, []);

  const openModalForCreate = () => {
    setEditVicariatId(null);
    setName("");
    setAbbreviation("");
    setAumonier("");
    setLogo("");
    setIsModalOpen(true);
  };

  const openModalForEdit = (vic: VicariatNode) => {
    setEditVicariatId(vic._id);
    setName(vic.name);
    setAbbreviation(vic.abbreviation);
    setAumonier(vic.aumonier || "");
    setLogo(vic.logo || "");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteVicariatId(id);
  };

  const confirmDelete = async () => {
    if (!deleteVicariatId) return;
    
    try {
      const res = await fetch(`/api/vicariats/${deleteVicariatId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVicariats(vicariats.filter((v) => v._id !== deleteVicariatId));
        showToast("Vicariat supprimé avec succès", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Erreur lors de la suppression. Veuillez vérifier vos permissions.", "error");
      }
    } catch (error) {
      console.error("Failed to delete vicariat", error);
      showToast("Une erreur est survenue lors de la suppression.", "error");
    } finally {
      setDeleteVicariatId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name && abbreviation) {
      setIsSubmitting(true);
      const payload = { name, abbreviation, aumonier, logo };

      try {
        let resUrl = "/api/vicariats";
        let resMethod = "POST";
        if (editVicariatId) {
          resUrl = `/api/vicariats/${editVicariatId}`;
          resMethod = "PUT";
        }

        const res = await fetch(resUrl, {
          method: resMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resultData = await res.json();
          if (editVicariatId) {
            setVicariats(vicariats.map(v => v._id === editVicariatId ? resultData : v));
            showToast("Vicariat modifié avec succès", "success");
          } else {
            setVicariats([...vicariats, resultData]);
            showToast("Vicariat créé avec succès", "success");
          }
          setIsModalOpen(false);
        } else {
          const errorData = await res.json().catch(() => ({}));
          showToast(errorData.error || "Erreur lors de l'opération.", "error");
        }
      } catch (error) {
        console.error("API error", error);
        showToast("Une erreur inattendue est survenue.", "error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      showToast("Veuillez remplir le nom et l'abréviation.", "error");
    }
  };

  return (
    <div className="w-full space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vicariats</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestion centralisée des vicariats forains.</p>
        </div>
        <Button 
          onClick={openModalForCreate}
          className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Ajouter un Vicariat
        </Button>
      </div>

      {/* Liste des Vicariats */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Loader2 className="w-12 h-12 text-amber-900 animate-spin mb-4" />
            <p className="text-slate-500 font-medium tracking-wide">Chargement des vicariats...</p>
          </div>
        ) : vicariats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Map className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun vicariat enregistré</h3>
            <p className="text-slate-500 max-w-sm mb-6">Ajoutez les vicariats du diocèse pour commencer à organiser le territoire.</p>
            <Button 
              onClick={openModalForCreate}
              variant="outline"
              className="px-6 rounded-xl border-slate-200 text-amber-900 font-bold hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Créer le premier vicariat
            </Button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                <th className="p-6 font-semibold w-24">Logo</th>
                <th className="p-6 font-semibold">Dénomination</th>
                <th className="p-6 font-semibold hidden md:table-cell">Aumônier Vicarial</th>
                <th className="p-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {vicariats.map((vic) => (
                <tr key={vic._id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 overflow-hidden text-amber-900 shrink-0">
                      {vic.logo ? (
                        <img src={vic.logo} alt={vic.name} className="w-full h-full object-cover" />
                      ) : (
                        <Map className="w-5 h-5 opacity-40" />
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="font-extrabold text-slate-900 text-base">{vic.name}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase mt-1 tracking-wider">
                        Abréviation : {vic.abbreviation}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    {vic.aumonier ? (
                      <span className="font-bold text-slate-700 text-sm">{vic.aumonier}</span>
                    ) : (
                      <span className="text-slate-400 italic text-sm">Non assigné</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModalForEdit(vic)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                         onClick={() => handleDeleteClick(vic._id)}
                         className="p-2 rounded-xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50"
                         title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Fallback Mobile */}
                     <div className="flex items-center justify-end gap-2 lg:hidden">
                      <button 
                        onClick={() => openModalForEdit(vic)}
                        className="p-2 text-amber-600 bg-amber-50 rounded-xl"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(vic._id)}
                        className="p-2 rounded-xl text-red-600 bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal / Formulaire */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Map className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editVicariatId ? "Modifier le Vicariat" : "Nouveau Vicariat"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Découpage Territorial</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nom du Vicariat</label>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={(e)=>setName(e.target.value)} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" 
                    placeholder="Ex: Vicariat de Porto-Novo" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Abréviation</label>
                  <input 
                    required 
                    type="text" 
                    value={abbreviation} 
                    onChange={(e)=>setAbbreviation(e.target.value.toUpperCase())} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all font-mono font-semibold uppercase tracking-widest" 
                    placeholder="Ex: V.P.N" 
                    maxLength={10}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Aumônier Vicarial <span className="text-slate-400 font-normal text-xs">(Optionnel)</span></label>
                  <input 
                    type="text" 
                    value={aumonier} 
                    onChange={(e)=>setAumonier(e.target.value)} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" 
                    placeholder="Ex: Père Jean-Marie" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Logo (URL) <span className="text-slate-400 font-normal text-xs">(Optionnel)</span></label>
                  <input 
                    type="url" 
                    value={logo} 
                    onChange={(e)=>setLogo(e.target.value)} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" 
                    placeholder="https://site.com/logo.png" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="h-12 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20 w-full sm:w-auto overflow-hidden relative">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                  </span>
                ) : (
                  editVicariatId ? "Enregistrer" : "Créer le vicariat"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Suppression */}
      <Dialog open={!!deleteVicariatId} onOpenChange={(open) => !open && setDeleteVicariatId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-center">
              Êtes-vous sûr de vouloir supprimer définitivement ce vicariat ?<br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVicariatId(null)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Supprimer le vicariat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none border ${
          toast.type === "success" 
            ? "bg-slate-900 border-slate-800 text-white" 
            : "bg-red-50 border-red-200 text-red-900"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
