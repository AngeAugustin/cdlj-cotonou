"use client";

import { useState, useEffect } from "react";
import { Award, Plus, Edit2, Trash2, X, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type GradeNode = {
  _id: string;
  name: string;
  level: number;
  abbreviation: string;
  lecteurCount: number;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editGradeId, setEditGradeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [abbreviation, setAbbreviation] = useState("");

  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchGrades = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/grades?withCount=true");
      if (res.ok) {
        const data = await res.json();
        setGrades(data);
      }
    } catch (error) {
      console.error("Failed to fetch grades", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const openModalForCreate = () => {
    setEditGradeId(null);
    setName("");
    setLevel("");
    setAbbreviation("");
    setIsModalOpen(true);
  };

  const openModalForEdit = (grade: GradeNode) => {
    setEditGradeId(grade._id);
    setName(grade.name);
    setLevel(grade.level);
    setAbbreviation(grade.abbreviation);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, lecteurCount: number) => {
    if (lecteurCount > 0) {
      showToast(`Impossible de supprimer ce grade car ${lecteurCount} lecteur(s) y sont associés.`, "error");
      return;
    }
    setDeleteGradeId(id);
  };

  const confirmDelete = async () => {
    if (!deleteGradeId) return;
    
    try {
      const res = await fetch(`/api/grades/${deleteGradeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGrades(grades.filter((g) => g._id !== deleteGradeId));
        showToast("Grade supprimé avec succès", "success");
      } else {
        showToast("Erreur lors de la suppression du grade. Veuillez vérifier vos permissions.", "error");
      }
    } catch (error) {
      console.error("Failed to delete grade", error);
      showToast("Une erreur est survenue lors de la suppression.", "error");
    } finally {
      setDeleteGradeId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name && level !== "" && abbreviation) {
      setIsSubmitting(true);
      const payload = { name, level: Number(level), abbreviation };

      try {
        let resUrl = "/api/grades";
        let resMethod = "POST";
        if (editGradeId) {
          resUrl = `/api/grades/${editGradeId}`;
          resMethod = "PUT";
        }

        const res = await fetch(resUrl, {
          method: resMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resultData = await res.json();
          if (editGradeId) {
            const currentGrade = grades.find(g => g._id === editGradeId);
            setGrades(grades.map(g => g._id === editGradeId ? { ...resultData, lecteurCount: currentGrade?.lecteurCount || 0 } : g));
            showToast("Grade modifié avec succès", "success");
          } else {
            setGrades([...grades, { ...resultData, lecteurCount: 0 }]);
            showToast("Grade créé avec succès", "success");
          }
          setIsModalOpen(false);
        } else {
          const errorData = await res.json().catch(() => ({}));
          showToast(errorData.error || "Erreur lors de l'opération. Vérifiez vos permissions.", "error");
        }
      } catch (error) {
        console.error("API error", error);
        showToast("Une erreur inattendue est survenue.", "error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      showToast("Veuillez remplir correctement tous les champs.", "error");
    }
  };

  // Sort grades by level
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);

  return (
    <div className="w-full space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Grades & Niveaux</h1>
          <p className="text-slate-500 mt-2 text-lg">Configuration globale des grades (Postulat, Noviciat, Lectorat I, etc).</p>
        </div>
        <Button 
          onClick={openModalForCreate}
          className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Créer un Grade
        </Button>
      </div>

      {/* Liste des Grades */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Loader2 className="w-12 h-12 text-amber-900 animate-spin mb-4" />
            <p className="text-slate-500 font-medium tracking-wide">Chargement des grades...</p>
          </div>
        ) : sortedGrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Award className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun grade enregistré</h3>
            <p className="text-slate-500 max-w-sm mb-6">Ajoutez les différents niveaux de la fraternité pour commencer.</p>
            <Button 
              onClick={openModalForCreate}
              variant="outline"
              className="px-6 rounded-xl border-slate-200 text-amber-900 font-bold hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Créer le premier grade
            </Button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                <th className="p-6 font-semibold w-16 text-center">Niveau</th>
                <th className="p-6 font-semibold">Nom du Grade</th>
                <th className="p-6 font-semibold hidden md:table-cell">Abréviation</th>
                <th className="p-6 font-semibold text-center">Membres (Lecteurs)</th>
                <th className="p-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {sortedGrades.map((grade) => (
                <tr key={grade._id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="p-6 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-bold text-amber-900 bg-amber-100 ring-4 ring-white shadow-sm border border-amber-200/50">
                      {grade.level}
                    </div>
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="font-extrabold text-slate-900 text-base">{grade.name}</p>
                      <p className="text-xs font-semibold text-slate-500 md:hidden uppercase mt-1 tracking-wider">{grade.abbreviation}</p>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200 tracking-wider">
                      {grade.abbreviation}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                       <Users className={`w-4 h-4 ${grade.lecteurCount > 0 ? "text-amber-600" : "text-slate-300"}`} />
                       <span className={`font-bold ${grade.lecteurCount > 0 ? "text-slate-900 bg-amber-50 px-3 py-1 rounded-full text-sm" : "text-slate-400"}`}>
                         {grade.lecteurCount}
                       </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModalForEdit(grade)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                         onClick={() => handleDeleteClick(grade._id, grade.lecteurCount)}
                         className={`p-2 rounded-xl transition-all ${
                          grade.lecteurCount > 0 
                            ? "text-slate-300 cursor-not-allowed opacity-50" 
                            : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title="Supprimer (impossible si des membres y sont)"
                        disabled={grade.lecteurCount > 0}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                     <div className="flex items-center justify-end gap-2 lg:hidden">
                      <button 
                        onClick={() => openModalForEdit(grade)}
                        className="p-2 text-amber-600 bg-amber-50 rounded-xl"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(grade._id, grade.lecteurCount)}
                        className={`p-2 rounded-xl ${
                          grade.lecteurCount > 0 
                            ? "text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed" 
                            : "text-red-600 bg-red-50"
                        }`}
                        disabled={grade.lecteurCount > 0}
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

      {/* Custom Modal for Grade Creation/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editGradeId ? "Modifier le Grade" : "Nouveau Grade"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Paramètres du palier</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nom du grade</label>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={(e)=>setName(e.target.value)} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" 
                    placeholder="Ex: Lectorat I" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Abréviation</label>
                    <input 
                      required 
                      type="text" 
                      value={abbreviation} 
                      onChange={(e)=>setAbbreviation(e.target.value.toUpperCase())} 
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all font-mono font-semibold uppercase tracking-widest placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal" 
                      placeholder="Ex: APP" 
                      maxLength={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Niveau hiérarchique</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      value={level} 
                      onChange={(e)=>setLevel(e.target.value ? Number(e.target.value) : "")} 
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-center font-bold text-lg rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" 
                      placeholder="0" 
                    />
                    <p className="text-[10px] text-slate-400 uppercase font-semibold text-center mt-1">
                      (0 = Plus bas)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                  editGradeId ? "Enregistrer" : "Créer le grade"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
      {/* Modal de Suppression (Style Déconnexion) */}
      <Dialog open={!!deleteGradeId} onOpenChange={(open) => !open && setDeleteGradeId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-center">
              Êtes-vous sûr de vouloir supprimer définitivement ce grade ?<br />
              Cette action est irréversible et supprimera le palier de la base de données.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGradeId(null)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Supprimer le grade
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
