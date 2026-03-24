import Link from "next/link";
import { MapPin, Church, Users, ChevronRight, ArrowDown } from "lucide-react";
import { VICARIATS } from "@/lib/vicariats-data";
import VicariatsMapWrapper from "@/components/VicariatsMapWrapper";

const WORKFLOW = [
  { label: "Archidiocèse de Cotonou",  desc: "Autorité ecclésiastique suprême du diocèse",         count: "1",    unit: "diocèse",   color: "bg-amber-900 text-white"       },
  { label: "Vicariats Forains",        desc: "15 zones géographiques structurant le territoire",    count: "15",   unit: "vicariats", color: "bg-amber-700 text-white"       },
  { label: "Paroisses Affiliées",      desc: "124 paroisses réparties dans les vicariats",          count: "124",  unit: "paroisses", color: "bg-amber-500 text-white"       },
  { label: "Lecteurs Juniors",         desc: "Plus de 12 000 membres actifs dans la CDLJ",         count: "+12k", unit: "lecteurs",  color: "bg-amber-300 text-amber-950"   },
];

export default function VicariatsPage() {
  return (
    <div className="bg-slate-50 min-h-screen relative overflow-hidden">

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-amber-900 font-semibold text-sm mb-6 uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> Organisation territoriale
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6 max-w-4xl">
            Les Vicariats Forains de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900">
              l'Archidiocèse de Cotonou
            </span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mb-8">
            L'archidiocèse est organisé en <strong>15 vicariats forains</strong> couvrant l'ensemble du territoire.
            Chaque vicariat constitue un relai essentiel entre l'administration diocésaine et les communautés locales.
          </p>
          <Link href="/nos-vicariats#carte">
            <button className="group relative inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-amber-900/20 transition-all hover:-translate-y-1 overflow-hidden">
              <span className="relative z-10">Voir la carte des vicariats</span>
              <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── WORKFLOW HIÉRARCHIQUE ──────────────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
            Structure organisationnelle
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            De l'Archidiocèse aux Lecteurs
          </h2>
        </div>

        <div className="flex flex-col items-center gap-0">
          {WORKFLOW.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-full max-w-xl">
              <div
                className={`w-full rounded-2xl ${step.color} px-8 py-5 flex items-center justify-between shadow-lg`}
                style={{ width: `${100 - i * 12}%` }}
              >
                <div>
                  <p className="font-extrabold text-lg leading-tight">{step.label}</p>
                  <p className="text-sm opacity-70 mt-0.5">{step.desc}</p>
                </div>
                <div className="text-right shrink-0 ml-6">
                  <p className="text-3xl font-black leading-none">{step.count}</p>
                  <p className="text-xs opacity-60 uppercase tracking-wider">{step.unit}</p>
                </div>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <div className="w-px h-6 bg-amber-300" />
                  <ArrowDown className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CARTE SCHÉMATIQUE ─────────────────────────────────── */}
      <section id="carte" className="py-16 px-4 md:px-8 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
              Vue territoriale
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Carte des 15 Vicariats
            </h2>
            <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">
              Répartition schématique des 15 vicariats forains du diocèse. Cliquez sur un nœud pour explorer.
            </p>
          </div>
          <VicariatsMapWrapper />
        </div>
      </section>

      {/* ── LISTE DÉTAILLÉE DES VICARIATS ─────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
            Détail
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Les 15 Vicariats en détail
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {VICARIATS.map((v) => (
            <div
              key={v.id}
              className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header coloré */}
              <div className={`bg-gradient-to-br ${v.color} p-5 relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                <span className="text-white/60 text-xs font-black uppercase tracking-widest">
                  Vicariat {v.id}
                </span>
                <h3 className="text-white font-extrabold text-base leading-tight mt-1">{v.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">{v.zone}</p>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Church className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-medium">Paroisses</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${v.light}`}>
                    {v.paroisses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-medium">Lecteurs</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{v.lecteurs.toLocaleString()}</span>
                </div>
                <Link
                  href={`/nos-vicariats/${v.slug}`}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 transition-colors group-hover:gap-2.5 duration-200 pt-2 border-t border-slate-100"
                >
                  Voir le vicariat <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
