"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, UserPlus, FileEdit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// MOCK DATA BASED ON TDR
const MOCK_LECTEURS = [
  { id: "COTAKG894231", name: "DOSSOU", firstname: "Jean-Paul", grade: "Lecteur", age: 14, parish: "Sainte Rita" },
  { id: "COTSTJ120392", name: "ADJOVI", firstname: "Marie-Claire", grade: "Aspirant", age: 12, parish: "Saint Michel" },
  { id: "COTPND932014", name: "BIO", firstname: "Emmanuel", grade: "Ancien", age: 18, parish: "Sainte Trinité" },
];

export default function LecteursPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion des Lecteurs</h1>
          <p className="text-slate-500 mt-2 text-lg">Administrez vos lecteurs : inscriptions, grades, et suivi d'activités.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Exporter (PDF)
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold gap-2 shadow-xl shadow-amber-900/20"
          >
            <UserPlus className="w-5 h-5" /> Inscrire un Lecteur
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher par Matricule, Nom ou Prénom..." 
            className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="flex-1 md:w-48 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900 appearance-none">
            <option value="">Tous les grades</option>
            <option value="Aspirant">Aspirant</option>
            <option value="Apprenti">Apprenti</option>
            <option value="Lecteur">Lecteur</option>
            <option value="Ancien">Ancien</option>
          </select>
          <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-slate-200 text-slate-700 shrink-0">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Lecteurs Library (Table / Grid) */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
              <th className="p-6 font-semibold">Profil Lecteur</th>
              <th className="p-6 font-semibold hidden md:table-cell">Matricule</th>
              <th className="p-6 font-semibold">Grade</th>
              <th className="p-6 font-semibold hidden sm:table-cell">Âge</th>
              <th className="p-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {MOCK_LECTEURS.map((lecteur) => (
              <tr key={lecteur.id} className="hover:bg-amber-50/30 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                       {/* Placeholder for Photo Avatar */}
                       <span className="font-extrabold text-slate-400">{lecteur.firstname[0]}{lecteur.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-base">{lecteur.name} {lecteur.firstname}</p>
                      <p className="text-xs font-semibold text-slate-500 md:hidden">{lecteur.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell">
                  <span className="font-mono text-sm font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                    {lecteur.id}
                  </span>
                </td>
                <td className="p-6">
                   <div className="inline-flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${
                       lecteur.grade === 'Lecteur' ? 'bg-emerald-500' : 
                       lecteur.grade === 'Aspirant' ? 'bg-blue-500' : 'bg-purple-500'
                     }`} />
                     <span className="font-bold text-slate-700 text-sm">{lecteur.grade}</span>
                   </div>
                </td>
                <td className="p-6 hidden sm:table-cell">
                  <span className="text-sm font-semibold text-slate-600">{lecteur.age} ans</span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Voir les détails et historique">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Modifier le lecteur">
                      <FileEdit className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Supprimer le lecteur">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Fallback for touch devices where hover is disabled */}
                  <div className="flex items-center justify-end gap-2 lg:hidden">
                    <button className="p-2 text-blue-600 bg-blue-50 rounded-xl">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
