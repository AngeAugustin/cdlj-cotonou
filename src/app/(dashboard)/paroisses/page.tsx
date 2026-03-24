"use client";

import { Plus, Search, Building2, Eye, FileEdit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParoissesPage() {
  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion des Paroisses</h1>
          <p className="text-slate-500 mt-2 text-lg">Supervisez et administrez les paroisses attachées à votre juridiction.</p>
        </div>
        <Button className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20">
          <Plus className="w-5 h-5 mr-2" /> Ajouter une paroisse
        </Button>
      </div>

      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-900 mb-6">
          <Building2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Aucune Paroisse</h2>
        <p className="text-slate-500 max-w-md">Les données des paroisses sont en cours de construction. Le tableau d'affichage sera disponible ici très bientôt !</p>
      </div>
    </div>
  );
}
