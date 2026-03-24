"use client";

import { Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivitesPage() {
  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Activités</h1>
          <p className="text-slate-500 mt-2 text-lg">Consultez et participez aux activités de la CDLJ.</p>
        </div>
        <Button className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20">
          <Plus className="w-5 h-5 mr-2" /> Créer une activité
        </Button>
      </div>

      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 py-32 flex flex-col items-center justify-center">
        <Activity className="w-16 h-16 text-slate-300 mb-6" />
        <h2 className="text-xl font-bold text-slate-900">Pas d'activités pour le moment</h2>
        <p className="text-slate-500 mt-2">Le module d'activités avec gestion des paiements est en cours d'intégration.</p>
      </div>
    </div>
  );
}
