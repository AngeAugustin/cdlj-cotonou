import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronRight, Users, Activity, Globe, BookOpen, Church, MapPin, CalendarDays } from "lucide-react";
import FaqSection from "@/components/FaqSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-amber-800/10 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-sm mb-6 border border-amber-200/50 hover:bg-amber-200/60 transition cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-700"></span>
          </span>
          Plateforme Active & Sécurisée
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl text-balance">
          Lecteurs, <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-700 to-amber-900">Sel & Lumière</span> nous sommes
        </h1>
        
        <p className="mt-6 text-xl text-slate-600 max-w-2xl leading-relaxed">
          Pensée pour simplifier le quotidien des lecteurs juniors, des paroisses et des vicariats de Cotonou. Rejoignez la transformation numérique de notre communauté.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/auth/login">
            <Button size="lg" className="bg-amber-900 hover:bg-amber-800 text-white rounded-full px-8 py-6 text-lg w-full shadow-xl shadow-amber-900/20 group transition-all hover:-translate-y-1">
              Accéder au Portail
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/news">
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg w-full border-amber-900/40 text-amber-900 hover:bg-amber-50 transition-all hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
              Lire le Blog & Actualités
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="bg-white border-y border-slate-200/50 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-900">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">+ de 10k Lecteurs</h3>
              <p className="text-slate-500">Un réseau immense interconnecté couvrant toutes les paroisses de notre diocèse.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 md:border-x md:-my-6 xl:-mx-8">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-900">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Activités Synchronisées</h3>
              <p className="text-slate-500">Planification des assemblées générales, des évènements communautaires et cotisations simplifiées.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-900">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Gestion Multi-niveaux</h3>
              <p className="text-slate-500">Structuration limpide de l'autorité: SuperAdmin, Diocésain, Vicarial et Paroissial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-amber-950 py-24 px-4 lg:px-8">
        {/* Glows */}
        <div className="absolute top-[-30%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-amber-700/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[25rem] h-[25rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full mb-4">
              La CDLJ en chiffres
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              Une communauté vivante & structurée
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users,        value: "+ 3000",  label: "Lecteurs actifs",                 sub: "À travers tout le diocèse",          color: "text-amber-400",  bg: "bg-amber-400/10" },
              { icon: Church,       value: "+ 124",   label: "Paroisses affiliées",             sub: "Sur l'ensemble de Cotonou",          color: "text-blue-400",   bg: "bg-blue-400/10"  },
              { icon: MapPin,       value: "+ 15",    label: "Vicariats forains",               sub: "Organisation territoriale complète", color: "text-emerald-400",bg: "bg-emerald-400/10"},
              { icon: CalendarDays, value: "+ 10",    label: "activités organisées par An",     sub: "Chaque année sur le diocèse",        color: "text-rose-400",   bg: "bg-rose-400/10"  },
            ].map(({ icon: Icon, value, label, sub, color, bg }) => (
              <div key={label} className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className={`text-5xl font-black tracking-tight ${color} mb-2`}>{value}</span>
                <span className="text-base font-bold text-white mb-1">{label}</span>
                <span className="text-xs text-slate-400 leading-snug">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ───────────────────────────────────────── */}
      <FaqSection />

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="pb-24 px-4 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-amber-900 to-amber-950 rounded-3xl p-12 shadow-2xl shadow-amber-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] pointer-events-none" />
          <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-6" />
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Prêt à rejoindre l'interface ?</h3>
          <p className="text-amber-100/80 mb-8 leading-relaxed">
            Connectez-vous à votre espace de gestion et contribuez à la mission de la CDLJ.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="bg-white hover:bg-amber-50 text-amber-950 font-extrabold rounded-full px-10 py-6 text-base shadow-xl transition-all hover:-translate-y-1">
              Accéder au Portail
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
