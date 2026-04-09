import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users, Leaf, Shield, ChevronRight, Mail, Camera } from "lucide-react";

export default function AboutPage() {
  const VALUES = [
    {
      title: "Foi & Dévotion",
      description: "Notre engagement premier est de servir Dieu par la proclamation fidèle de sa Parole lors des moments communautaires.",
      icon: <BookOpen className="w-8 h-8 text-amber-900" />,
      color: "bg-amber-100"
    },
    {
      title: "Fraternité",
      description: "Des liens renforcés entre jeunes lecteurs de tous les vicariats. L'unité dans la diversité de l'Archidiocèse.",
      icon: <Users className="w-8 h-8 text-blue-900" />,
      color: "bg-blue-100"
    },
    {
      title: "Croissance",
      description: "Une formation continue et adaptée pour amener chaque lecteur vers la maîtrise de son charisme et le prochain grade.",
      icon: <Leaf className="w-8 h-8 text-emerald-900" />,
      color: "bg-emerald-100"
    },
    {
      title: "Responsabilité",
      description: "Cultiver un esprit rigoureux et un sens de la liturgie irréprochable dans les diverses missions paroissiales.",
      icon: <Shield className="w-8 h-8 text-purple-900" />,
      color: "bg-purple-100"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-amber-900 font-semibold text-sm mb-6 uppercase tracking-wider">
              À Propos de nous
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Servir la Parole, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900">Inspirer la Jeunesse.</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-8">
              La Communauté Diocésaine des Lecteurs Juniors (CDLJ) est le cœur battant de la proclamation de la Parole pour l'Enfance Missionnaire de Cotonou.
            </p>
            <Link href="/news">
              <button className="group relative inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-amber-900/20 transition-all hover:-translate-y-1 overflow-hidden">
                <span className="relative z-10">Découvrez nos actualités</span>
                <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </Link>
          </div>
          <div className="w-full lg:w-1/2 relative">
            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/50 group">
              <Image
                src="https://i.postimg.cc/WzL22YRK/about.png"
                alt="Communauté en prière"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/40 to-transparent mix-blend-multiply" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce hover:animate-none transition-all duration-500" style={{ animationDuration: '3s' }}>
              <div className="bg-amber-100 p-3 rounded-full text-amber-900">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Communauté</p>
                <p className="text-2xl font-black text-slate-800">+10k Membres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white border-y border-slate-200/50 relative z-10">
        <div className="container mx-auto px-4 md:px-8 py-24 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Notre Mission</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Nous avons pour mission d'encadrer, de former et de responsabiliser spirituellement les jeunes de l'Aumônerie. A travers la lecture et la méditation lors des célébrations eucharistiques, nous participons activement à la vie de nos paroisses respectives et de notre archidiocèse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((val, idx) => (
              <div key={idx} className="group bg-slate-50 rounded-3xl p-8 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-2xl ${val.color} flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  {val.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{val.title}</h3>
                <p className="text-slate-500 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HISTORIQUE DE VIE ─────────────────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
            Notre parcours
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Historique de vie
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            De nos origines modestes à une communauté structurée et rayonnante — retour sur les grandes étapes de la CDLJ.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-200 via-amber-400 to-amber-200 hidden md:block" />

          {[
            {
              year: "1998",
              side: "left",
              title: "Fondation de la CDLJ",
              desc: "Création officielle de la Communauté Diocésaine des Lecteurs Juniors sous l'impulsion de l'Aumônerie de l'Enfance Missionnaire de Cotonou. Les premières réunions se tiennent dans trois paroisses pionnières.",
              color: "bg-amber-900",
            },
            {
              year: "2003",
              side: "right",
              title: "Extension aux 8 Vicariats",
              desc: "La CDLJ s'étend progressivement à l'ensemble des vicariats du diocèse. Chaque vicariat se dote d'un bureau local chargé de coordonner les activités des paroisses membres.",
              color: "bg-blue-800",
            },
            {
              year: "2008",
              side: "left",
              title: "Premier Pèlerinage Diocésain",
              desc: "Organisation du premier grand pèlerinage réunissant plus de 500 lecteurs juniors au Sanctuaire Marial d'Allada. Un événement fondateur qui devient une tradition annuelle.",
              color: "bg-emerald-800",
            },
            {
              year: "2013",
              side: "right",
              title: "Création du Système de Grades",
              desc: "Mise en place d'un parcours de formation structuré en grades progressifs : Aspirant, Junior, Ancien et Sénior. Ce système valorise l'engagement et l'excellence liturgique de chaque membre.",
              color: "bg-purple-800",
            },
            {
              year: "2019",
              side: "left",
              title: "Cap des 10 000 membres",
              desc: "La CDLJ franchit le seuil symbolique des dix mille lecteurs actifs répartis dans les 42 paroisses du diocèse, confirmant son rayonnement exceptionnel auprès de la jeunesse catholique.",
              color: "bg-rose-800",
            },
            {
              year: "2025",
              side: "right",
              title: "Lancement du Portail Numérique",
              desc: "Déploiement du portail intranet diocésain permettant la gestion centralisée des lecteurs, des activités, des cotisations et des évaluations. La CDLJ entre dans l'ère de la transformation digitale.",
              color: "bg-amber-700",
            },
          ].map((item, i) => (
            <div key={i} className={`relative flex items-center mb-12 md:mb-16 ${item.side === "right" ? "md:flex-row-reverse" : "md:flex-row"} flex-col md:gap-0 gap-4`}>
              {/* Card */}
              <div className={`w-full md:w-[calc(50%-2rem)] ${item.side === "left" ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                  <span className={`inline-block text-xs font-black uppercase tracking-widest text-white px-3 py-1 rounded-full mb-3 ${item.color}`}>
                    {item.year}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>

              {/* Dot on the line */}
              <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${item.color}`} />

              {/* Spacer */}
              <div className="hidden md:block w-[calc(50%-2rem)]" />
            </div>
          ))}
        </div>
      </section>

      {/* ── STRUCTURE SOLIDE & UNIE ───────────────────────────── */}
      <section className="container mx-auto px-4 md:px-8 py-24 max-w-6xl">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/40 border border-slate-100 translate-y-8 hover:translate-y-6 transition-transform">
              <h4 className="text-amber-900 font-bold text-lg mb-2">Vicariats</h4>
              <p className="text-slate-500 text-sm">Gestion régionale orchestrée pour fluidifier les directives du niveau diocésain.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-3xl p-6 shadow-lg shadow-amber-900/30 border border-amber-700 hover:-translate-y-2 transition-transform text-white">
              <h4 className="font-bold text-lg mb-2">Paroisses</h4>
              <p className="text-amber-100/80 text-sm">Le pilier fondamental. C'est ici que l'excellence de la lecture s'exprime chaque dimanche.</p>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Une Structure <br />
              <span className="text-amber-900">Solide & Unie</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              De l'échelle Diocésaine jusqu'au niveau Paroissial, la CDLJ maintient une hiérarchie saine qui garantit la rigueur et la transmission fluide des bonnes pratiques liturgiques et organisationnelles.
            </p>
          </div>
        </div>
      </section>

      {/* ── ÉQUIPE DIOCÉSAINE ─────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4 md:px-8 bg-white">
        {/* Dégradé ambre transparent (tons de l’ancien fond) */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-950/[0.07] via-amber-900/[0.04] to-amber-950/[0.09]"
          aria-hidden
        />
        {/* Halos discrets */}
        <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[500px] rounded-full bg-amber-600/[0.08] blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-amber-950/[0.06] blur-[120px]" />

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* ── Header éditorial ── */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-[2px] bg-amber-600" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Bureau exécutif</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Équipe Diocésaine<br />
                <span className="text-amber-800">Actuelle</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-xs leading-relaxed md:text-right">
              Les membres engagés qui portent chaque jour la mission et les valeurs de la CDLJ de Cotonou.
            </p>
          </div>

          {/* ── Direction Spirituelle ── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-1 rounded-full bg-amber-600/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800/80">Direction Spirituelle</span>
              <span className="w-1 h-1 rounded-full bg-amber-600/50" />
            </div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
            {[
              {
                initials: "MN", name: "Père Marius NOUGBODE",
                role: "Aumônier de l'Enfance Missionnaire",
                accent: "from-amber-300 to-yellow-500",
                pill: "bg-amber-50 text-amber-900 border-amber-200",
                glow: "shadow-amber-500/25",
              },
              {
                initials: "AO", name: "Fr Abel OBALEKE",
                role: "Parrain de la communauté",
                accent: "from-yellow-300 to-amber-400",
                pill: "bg-yellow-50 text-yellow-900 border-yellow-200",
                glow: "shadow-yellow-500/25",
              },
            ].map((m, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-md shadow-amber-950/5 backdrop-blur-sm hover:border-amber-300/40 hover:shadow-lg transition-all duration-500 p-6">
                {/* Top accent line — plus épais pour marquer l'autorité */}
                <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${m.accent}`} />
                {/* Watermark */}
                <span className="absolute -right-3 -bottom-5 text-[7rem] font-black text-amber-950/[0.05] select-none leading-none pointer-events-none">
                  {m.initials}
                </span>
                {/* Étoile/insigne spirituel */}
                <span className="absolute top-5 right-5 text-amber-700/35 text-base select-none">✦</span>

                {/* Avatar */}
                <div className="relative w-16 h-16 mb-4">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${m.accent} flex items-center justify-center text-amber-950 font-black text-lg ring-2 ring-amber-200/80 shadow-lg ${m.glow} group-hover:ring-amber-400/50 transition-all duration-300`}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </div>

                <h3 className="text-slate-900 font-extrabold text-xl leading-tight mb-2">{m.name}</h3>
                <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${m.pill}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          {/* Séparateur bureau exécutif */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-1 rounded-full bg-slate-400/60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Bureau Exécutif</span>
              <span className="w-1 h-1 rounded-full bg-slate-400/60" />
            </div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── Ligne 1 — 2 membres principaux ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-4">
            {[
              { n: "01", initials: "LD", name: "Fr Landry DJOSSOU", role: "Coordonnateur Diocésain", accent: "from-amber-400 to-amber-600", pill: "bg-amber-50 text-amber-900 border-amber-200" },
              { n: "02", initials: "BS", name: "Fr Bienheureux SESSOU", role: "Secrétaire Général", accent: "from-sky-400 to-sky-600", pill: "bg-sky-50 text-sky-900 border-sky-200" },
            ].map((m) => (
              <div key={m.n} className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-md shadow-amber-950/5 backdrop-blur-sm hover:border-amber-200/60 hover:shadow-lg transition-all duration-500 p-6">
                {/* Top accent line */}
                <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${m.accent}`} />
                {/* Watermark initial */}
                <span className="absolute -right-3 -bottom-5 text-[7rem] font-black text-slate-900/[0.04] select-none leading-none pointer-events-none">
                  {m.initials}
                </span>
                {/* Corner number */}
                <span className="absolute top-5 right-5 text-[10px] font-black text-slate-300 tracking-widest">#{m.n}</span>
                {/* Photo space */}
                <div className="relative w-16 h-16 mb-4">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${m.accent} flex items-center justify-center text-white font-black text-lg ring-2 ring-slate-200/80 shadow-lg group-hover:ring-amber-200/60 transition-all duration-300`}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-slate-900 font-extrabold text-xl leading-tight mb-2">{m.name}</h3>
                <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${m.pill}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          {/* ── Ligne 2 — 3 membres principaux ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { n: "03", initials: "AA", name: "Fr Alexis ASSOGBA", role: "CASF", accent: "from-emerald-400 to-emerald-600", pill: "bg-emerald-50 text-emerald-900 border-emerald-200" },
              { n: "04", initials: "GH", name: "Sr Grâce HOUNTON", role: "Trésorière Générale", accent: "from-violet-400 to-violet-600", pill: "bg-violet-50 text-violet-900 border-violet-200" },
              { n: "05", initials: "LG", name: "Fr Lionel GNANCADJA", role: "Organisateur Général", accent: "from-rose-400 to-rose-600", pill: "bg-rose-50 text-rose-900 border-rose-200" },
            ].map((m) => (
              <div key={m.n} className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-md shadow-amber-950/5 backdrop-blur-sm hover:border-amber-200/50 hover:shadow-lg transition-all duration-500 p-5">
                <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${m.accent}`} />
                <span className="absolute -right-2 -bottom-4 text-[5.5rem] font-black text-slate-900/[0.04] select-none leading-none pointer-events-none">
                  {m.initials}
                </span>
                <span className="absolute top-4 right-4 text-[10px] font-black text-slate-300 tracking-widest">#{m.n}</span>
                {/* Photo space */}
                <div className="relative w-14 h-14 mb-3">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${m.accent} flex items-center justify-center text-white font-black text-sm ring-2 ring-slate-200/80 shadow-lg group-hover:ring-amber-200/50 transition-all duration-300`}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-2 h-2 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-slate-900 font-extrabold text-base leading-tight mb-2">{m.name}</h3>
                <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${m.pill}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          {/* ── Séparateur membres associés ── */}
          <div className="flex items-center gap-4 my-10">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-1 rounded-full bg-slate-400/60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Membres associés</span>
              <span className="w-1 h-1 rounded-full bg-slate-400/60" />
            </div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── 2 membres secondaires ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {[
              { initials: "KA", name: "Fr Kenneth ASSOGBA", role: "Stagiaire CASF", accent: "from-orange-400 to-orange-500", border: "border-l-orange-400" },
              { initials: "JH", name: "Sr Jarnelle HONTONNOU", role: "Stagiaire TG", accent: "from-teal-400 to-teal-500", border: "border-l-teal-500" },
            ].map((m, i) => (
              <div key={i} className={`group flex items-center gap-4 rounded-xl border border-slate-200/90 bg-white/80 shadow-sm backdrop-blur-sm hover:border-slate-300 hover:bg-white hover:shadow-md border-l-2 ${m.border} px-5 py-4 transition-all duration-300`}>
                {/* Photo space */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${m.accent} flex items-center justify-center text-white font-black text-xs ring-2 ring-slate-200/80 group-hover:ring-amber-200/50 transition-all duration-300`}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-2 h-2 text-slate-400" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-slate-800 font-bold text-sm leading-tight">{m.name}</h3>
                  <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{m.role}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
