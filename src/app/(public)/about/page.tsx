import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users, Leaf, Shield, ChevronRight, Mail } from "lucide-react";
import { TeamMemberCard } from "@/components/about/TeamMemberCard";
import {
  associatedMembers,
  executiveBoard,
  executivePrimary,
  spiritualDirection,
} from "@/data/diocesan-team";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  formatLecteursCount,
  FOUNDED_YEAR,
  lecteursLabel,
} from "@/config/community-stats";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { aboutPageSchema, breadcrumbSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.about;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/about",
  keywords: [...seo.keywords],
});

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
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "À propos", path: "/about" },
          ]),
          aboutPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/about",
          }),
        ]}
      />
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
              CDLJ Cotonou : servir la Parole, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900">inspirer la jeunesse</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-8">
              La Communauté Diocésaine des Lecteurs Juniors (CDLJ) encadre, forme et responsabilise les jeunes lecteurs de l&apos;Archidiocèse de Cotonou depuis {FOUNDED_YEAR}. Découvrez notre histoire, notre mission et notre organisation par{" "}
              <Link href="/nos-vicariats" className="font-semibold text-amber-900 hover:underline">
                vicariats forains
              </Link>
              .
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
                alt="Jeunes lecteurs juniors de la CDLJ en prière — Archidiocèse de Cotonou"
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
                <p className="text-2xl font-black text-slate-800">{lecteursLabel()}</p>
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
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Née en 2012 du besoin de mieux encadrer les lecteurs juniors de l&apos;Archidiocèse de Cotonou, la CDLJ est aujourd&apos;hui une communauté structurée d&apos;environ {formatLecteursCount()} membres, dédiée à la formation, à la liturgie et à la croissance spirituelle des jeunes lecteurs.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-200 via-amber-400 to-amber-200 hidden md:block" />

          {[
            {
              year: "Origines",
              side: "left" as const,
              title: "Naissance d'un projet",
              desc: "Les lecteurs juniors faisaient partie de l'Union des Lecteurs de l'Archidiocèse de Cotonou (ULAC), qui regroupait enfants, jeunes et adultes. Peu représentés et rarement impliqués dans les activités diocésaines, les enfants lecteurs ont suscité une réflexion menée par le frère Wilfried KOUTOUKLOUI, chargé de la liturgie de l'enfance missionnaire, pour créer une structure propre aux lecteurs juniors.",
              color: "bg-slate-700",
            },
            {
              year: "2012",
              side: "right" as const,
              title: "Mise en place du projet",
              desc: "Une rencontre est organisée au Centre Paul VI avec environ 16 animateurs lecteurs juniors représentant cinq doyennés : Allada, Akpakpa, Bakhita, Cocotomey et Mènontin. Un comité de cinq membres est constitué pour rédiger les statuts et règlements de la future communauté.",
              color: "bg-amber-900",
            },
            {
              year: "2013",
              side: "left" as const,
              title: "Création officielle de la CDLJ",
              desc: "Après adoption des textes par les responsables lecteurs juniors, ceux-ci sont transmis à l'Aumônier diocésain puis à Monseigneur Antoine GANYE, Archevêque de Cotonou. Après étude, l'Archevêque donne son autorisation pour la création officielle de la Communauté Diocésaine des Lecteurs Juniors (CDLJ).",
              color: "bg-blue-800",
            },
            {
              year: "Avr. 2013",
              side: "right" as const,
              title: "Première Assemblée Générale et premier bureau",
              desc: "Le 21 avril 2013, une Assemblée Générale élective se tient au Centre Paul VI sous la présidence du Père Léandre DEGBEGNON. Elle met en place le premier bureau directeur de la CDLJ :",
              color: "bg-emerald-800",
              list: [
                "Coordonnatrice : Sœur Maximilienne DOSSOU",
                "Secrétaire : Frère Romaric ASSOGBA",
                "Trésorière : Sœur Doloresse EKPINSE",
                "Organisateur : Frère Franck KPEDJO",
                "Chargé des affaires spirituelles et de la formation : Frère Gérard SETONDJI",
              ],
            },
            {
              year: "Août 2013",
              side: "left" as const,
              title: "Lancement officiel des activités",
              desc: "Le 31 août 2013, à la paroisse Sainte Thérèse de l'Enfant Jésus de Godomey, ont lieu l'installation du premier bureau directeur et le lancement officiel des activités de la CDLJ.",
              color: "bg-purple-800",
            },
            {
              year: "2014",
              side: "right" as const,
              title: "Premières grandes activités",
              desc: "Se tiennent les premières éditions du weekend de formation des animateurs et de la session diocésaine, à la Chapelle Sainte Famille de Missèssinto, avec 29 animateurs et 102 lecteurs juniors.",
              color: "bg-rose-800",
            },
            {
              year: "Aujourd'hui",
              side: "left" as const,
              title: "Une communauté en croissance",
              desc: "Fort de plus de dix ans d'existence, la CDLJ organise notamment la Journée d'amitié vicariale, le Weekend de formation des animateurs, la Session diocésaine et la Fête diocésaine, en mettant l'accent sur la formation, la liturgie et le développement spirituel des lecteurs.",
              color: "bg-amber-700",
            },
          ].map((item, i) => (
            <div key={i} className={`relative flex items-center mb-12 md:mb-16 ${item.side === "right" ? "md:flex-row-reverse" : "md:flex-row"} flex-col md:gap-0 gap-4`}>
              <div className={`w-full md:w-[calc(50%-2rem)] ${item.side === "left" ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                  <span className={`inline-block text-xs font-black uppercase tracking-widest text-white px-3 py-1 rounded-full mb-3 ${item.color}`}>
                    {item.year}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  {"list" in item && item.list ? (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600 text-left">
                      {item.list.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${item.color}`} />
              <div className="hidden md:block w-[calc(50%-2rem)]" />
            </div>
          ))}
        </div>

        {/* Ressources & acquis */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/40 p-8 md:p-10">
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Ressources et acquis</h3>
          <p className="text-slate-500 text-sm mb-6">Au fil des années, la CDLJ s&apos;est dotée d&apos;outils et de moyens pour encadrer ses membres.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            {[
              "Un uniforme officiel",
              "Une carte d'appartenance",
              "Le Manuel du Lecteur",
              "Un drapeau",
              "Un parrain et une marraine",
              "Une cinquantaine de formateurs",
              `Environ ${formatLecteursCount()} lecteurs juniors`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Vision */}
        <div className="mt-8 bg-gradient-to-br from-amber-900 to-amber-950 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-amber-900/20">
          <h3 className="text-2xl font-extrabold mb-4">Vision et objectifs</h3>
          <ul className="space-y-3 text-amber-100/90 text-sm leading-relaxed">
            <li>Étendre la présence de la CDLJ à toutes les paroisses de l&apos;archidiocèse.</li>
            <li>Favoriser l&apos;épanouissement spirituel et social de tous les adhérents.</li>
            <li>Renforcer davantage le rayonnement de la communauté.</li>
          </ul>
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

          <div className="mx-auto mb-8 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {spiritualDirection.map((m) => (
              <TeamMemberCard key={m.initials} {...m} variant="featured" spiritual />
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
          <div className="mx-auto mb-4 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {executivePrimary.map((m) => (
              <TeamMemberCard
                key={m.n}
                name={m.name}
                role={m.role}
                image={m.image}
                accent={m.accent}
                pill={m.pill}
                initials={m.initials}
                variant="featured"
                indexLabel={`#${m.n}`}
              />
            ))}
          </div>

          {/* ── Ligne 2 — 3 membres principaux ── */}
          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {executiveBoard.map((m) => (
              <TeamMemberCard
                key={m.n}
                name={m.name}
                role={m.role}
                image={m.image}
                accent={m.accent}
                pill={m.pill}
                initials={m.initials}
                variant="standard"
                indexLabel={`#${m.n}`}
              />
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
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {associatedMembers.map((m) => (
              <TeamMemberCard key={m.initials} {...m} variant="compact" />
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
