"use client";

import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvaluationsPage() {
  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Évaluations</h1>
          <p className="text-slate-500 mt-2 text-lg">Gérer les évaluations pour le passage de grades des lecteurs.</p>
        </div>
        <Button className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20">
          <Plus className="w-5 h-5 mr-2" /> Nouvelle Évaluation
        </Button>
      </div>
      <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center">
        <GraduationCap className="w-16 h-16 text-slate-300 mb-6" />
        <h2 className="text-xl font-bold">Traitement des Bulletins en attente</h2>
      </div>
    </div>
  );
}
