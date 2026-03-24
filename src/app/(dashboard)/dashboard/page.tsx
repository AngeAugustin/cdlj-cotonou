import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Users, Activity, Building2, Map, CreditCard, Award, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.roles?.[0] || 'PAROISSIAL';

  return (
    <div className="w-full space-y-12">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Vue Globale <span className="text-amber-900 capitalize">{role.toLowerCase()}</span></h1>
        <p className="text-slate-500 mt-2 text-base">Suivez l'activité et l'évolution de votre juridiction en un coup d'œil.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between group hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-900 group-hover:scale-110 group-hover:bg-amber-900 group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div>
            <h3 className="text-slate-500 font-medium mb-1">Total Lecteurs</h3>
            <p className="text-2xl font-black text-slate-900">1,248</p>
          </div>
        </div>

        {(role === "DIOCESAIN" || role === "SUPERADMIN" || role === "VICARIAL") && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 font-medium mb-1">Paroisses Actives</h3>
              <p className="text-2xl font-black text-slate-900">42</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/20 flex flex-col justify-between group hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-all">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">En cours</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-medium mb-1">Activités Actuelles</h3>
            <p className="text-2xl font-black text-white">3</p>
          </div>
        </div>

        {(role === "DIOCESAIN" || role === "SUPERADMIN") && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 font-medium mb-1">Cotisations Globales</h3>
              <p className="text-2xl font-black text-slate-900">85%</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Activités Récentes</h2>
            <Link href="/activites" className="text-sm font-semibold text-amber-900 hover:text-amber-700 flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-3xl shadow-lg shadow-slate-200/20 overflow-hidden relative">
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl shrink-0 overflow-hidden relative">
                     {/* Placeholder Image Space */}
                     <div className="absolute inset-0 bg-slate-200 w-full h-full group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Pèlerinage des Lecteurs {2026 - item}</h4>
                    <p className="text-xs text-slate-500">Sanctuaire Marial d'Allada — <span className="font-medium">120 Participants</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900">
                      Terminé
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Rapports & Alertes</h2>
          <div className="bg-amber-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-amber-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
            <Award className="w-10 h-10 text-amber-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Évaluation en cours</h3>
            <p className="text-amber-100/90 mb-8 leading-relaxed">
              Une évaluation de passage de grade "Ancien" est actuellement active. N'oubliez pas de mettre à jour les notes.
            </p>
            <button className="w-full bg-white text-amber-950 font-bold py-3.5 px-6 rounded-xl hover:bg-amber-50 transition-colors shadow-lg">
              Consulter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
