import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Church,
  Leaf,
  MapPinned,
  Users,
} from "lucide-react";
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
} from "@/config/community-stats";
import { PAGE_SEO } from "@/config/page-seo";
import { SITE_NAME_FULL } from "@/config/seo";
import { createPageMetadata } from "@/lib/seo";
import { aboutPageSchema, breadcrumbSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.about;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/about",
  keywords: [...seo.keywords],
});

const PRINCIPLES = [
  {
    title: "Foi & Dévotion",
    description:
      "Servir Dieu par la proclamation fidèle de sa Parole lors des célébrations et moments communautaires.",
    icon: BookOpen,
  },
  {
    title: "Fraternité",
    description:
      "Des liens renforcés entre jeunes lecteurs de tous les vicariats — l'unité dans la diversité de l'Archidiocèse.",
    icon: Users,
  },
  {
    title: "Croissance",
    description:
      "Une formation continue pour amener chaque lecteur vers la maîtrise de son charisme et le prochain grade.",
    icon: Leaf,
  },
] as const;

const PILLARS = [
  {
    title: "Vicariats",
    description:
      "Gestion régionale pour fluidifier les directives du niveau diocésain jusqu'aux paroisses.",
    href: "/nos-vicariats",
    icon: MapPinned,
  },
  {
    title: "Paroisses",
    description:
      "Le pilier fondamental : c'est ici que l'excellence de la lecture s'exprime chaque dimanche.",
    href: "/nos-vicariats",
    icon: Church,
  },
  {
    title: "Lecteurs",
    description:
      "Une communauté formée, suivie et engagée dans la proclamation de la Parole de Dieu.",
    href: "/auth/login",
    icon: Users,
  },
] as const;

const HISTORY = [
  {
    year: "Origines",
    title: "Naissance d'un projet",
    desc: "Les lecteurs juniors faisaient partie de l'ULAC, qui regroupait enfants, jeunes et adultes. Peu représentés dans les activités diocésaines, ils ont suscité une réflexion menée par le frère Wilfried KOUTOUKLOUI pour créer une structure propre aux lecteurs juniors.",
  },
  {
    year: "2012",
    title: "Mise en place du projet",
    desc: "Une rencontre au Centre Paul VI réunit environ 16 animateurs de cinq doyennés : Allada, Akpakpa, Bakhita, Cocotomey et Mènontin. Un comité de cinq membres est constitué pour rédiger les textes fondateurs.",
  },
  {
    year: "2013",
    title: "Création officielle de la CDLJ",
    desc: "Après adoption des textes, Monseigneur Antoine GANYE, Archevêque de Cotonou, autorise la création officielle de la Communauté Diocésaine des Lecteurs Juniors (CDLJ).",
  },
  {
    year: "Avr. 2013",
    title: "Première Assemblée Générale",
    desc: "Le 21 avril 2013, une AG élective au Centre Paul VI sous la présidence du Père Léandre DEGBEGNON met en place le premier bureau directeur.",
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
    title: "Lancement officiel des activités",
    desc: "Le 31 août 2013, à la paroisse Sainte Thérèse de l'Enfant Jésus de Godomey : installation du premier bureau et lancement officiel des activités.",
  },
  {
    year: "2014",
    title: "Premières grandes activités",
    desc: "Premières éditions du weekend de formation des animateurs et de la session diocésaine à Missèssinto, avec 29 animateurs et 102 lecteurs juniors.",
  },
  {
    year: "Aujourd'hui",
    title: "Une communauté en croissance",
    desc: `Fort de plus de dix ans d'existence et d'environ ${formatLecteursCount()} membres, la CDLJ organise notamment la Journée d'amitié vicariale, le Weekend de formation, la Session diocésaine et la Fête diocésaine.`,
  },
] as const;

const ACQUIS = [
  "Un uniforme officiel",
  "Une carte d'appartenance",
  "Le Manuel du Lecteur",
  "Un drapeau",
  "Un parrain et une marraine",
  "Une cinquantaine de formateurs",
  `Environ ${formatLecteursCount()} lecteurs juniors`,
] as const;

export default function AboutPage() {
  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                linear-gradient(rgba(120, 53, 15, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120, 53, 15, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
            }}
          />
          <div className="absolute top-0 left-0 w-[36rem] h-[28rem] rounded-full bg-amber-200/30 blur-[100px]" />
          <div className="absolute top-24 right-0 w-[28rem] h-[24rem] rounded-full bg-orange-100/40 blur-[90px]" />
        </div>

        <div
          className="absolute inset-x-0 top-[8%] flex justify-center pointer-events-none select-none"
          aria-hidden
        >
          <span className="font-extrabold tracking-[-0.04em] text-[18vw] sm:text-[12vw] lg:text-[9rem] leading-none text-amber-950/[0.04]">
            À propos
          </span>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-900 transition-colors mb-8 sm:mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-medium">
                La communauté CDLJ
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                Une vraie communauté au service de la{" "}
                <span className="text-amber-800">Parole</span>
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl text-pretty">
                La {SITE_NAME_FULL} (CDLJ) encadre, forme et responsabilise les jeunes
                lecteurs de l&apos;Archidiocèse de Cotonou depuis {FOUNDED_YEAR}. Découvrez
                notre histoire, notre mission et notre organisation.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/nos-vicariats"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Voir les vicariats
                </Link>
                <Link
                  href="/news"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Nos actualités
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_80px_-24px_rgba(69,26,3,0.28)] overflow-hidden ring-1 ring-black/[0.04]">
                <div className="flex items-center gap-3 px-4 h-11 border-b border-slate-100 bg-[#f4f2ee]">
                  <div className="flex items-center gap-1.5" aria-hidden>
                    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="size-2.5 rounded-full bg-[#febc2e]" />
                    <span className="size-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <p className="flex-1 text-center text-[11px] text-slate-400 font-medium truncate pr-8">
                    cdlj-cotonou.com / à propos
                  </p>
                </div>
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  <Image
                    src="https://i.postimg.cc/WzL22YRK/about.png"
                    alt="Jeunes lecteurs juniors de la CDLJ — Archidiocèse de Cotonou"
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 520px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Principes ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Fondements
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Foi, fraternité et croissance
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Trois piliers qui guident la vie et la mission de la CDLJ.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PRINCIPLES.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm shadow-slate-200/40"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
            Notre mission
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 text-balance leading-snug">
            Encadrer, former et responsabiliser spirituellement les jeunes lecteurs
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-500 leading-relaxed text-pretty">
            À travers la lecture et la méditation lors des célébrations eucharistiques, nous
            participons activement à la vie de nos paroisses et de notre archidiocèse.
          </p>
        </div>
      </section>

      {/* ── Organisation / Piliers ───────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Organisation
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Composez votre parcours
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              De l&apos;échelle diocésaine au niveau paroissial, une structure claire pour
              transmettre et accompagner.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PILLARS.map(({ title, description, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm shadow-slate-200/40 hover:border-amber-200 hover:shadow-md hover:shadow-amber-950/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-900 transition-colors">
                  {title}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Historique ───────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Notre parcours
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Historique de vie
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Née du besoin de mieux encadrer les lecteurs juniors, la CDLJ est aujourd&apos;hui
              une communauté structurée dédiée à la formation, à la liturgie et à la croissance
              spirituelle.
            </p>
          </div>

          <ol className="relative space-y-0">
            {HISTORY.map((item, index) => (
              <li key={item.year} className="relative flex gap-5 sm:gap-8 pb-10 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-[10px] font-bold uppercase tracking-wide text-amber-900">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < HISTORY.length - 1 ? (
                    <span className="mt-2 w-px flex-1 bg-gradient-to-b from-amber-200 to-amber-100" />
                  ) : null}
                </div>
                <div className="pb-2 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 mb-1.5">
                    {item.year}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                  {"list" in item && item.list ? (
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                      {item.list.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-2 size-1 rounded-full bg-amber-600 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ressources et acquis</h3>
              <p className="text-sm text-slate-500 mb-5">
                Des outils pour encadrer et unir les membres.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {ACQUIS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 rounded-full bg-amber-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-amber-950 p-6 sm:p-7 text-white">
              <h3 className="text-lg font-bold mb-2">Vision et objectifs</h3>
              <p className="text-sm text-amber-100/70 mb-5">
                Ce que nous construisons pour demain.
              </p>
              <ul className="space-y-3 text-sm text-amber-50/90 leading-relaxed">
                <li>Étendre la présence de la CDLJ à toutes les paroisses de l&apos;archidiocèse.</li>
                <li>Favoriser l&apos;épanouissement spirituel et social de tous les adhérents.</li>
                <li>Renforcer davantage le rayonnement de la communauté.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Équipe ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Bureau exécutif
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Équipe diocésaine{" "}
              <span className="text-amber-800">actuelle</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Les membres engagés qui portent chaque jour la mission et les valeurs de la CDLJ
              de Cotonou.
            </p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Direction Spirituelle
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {spiritualDirection.map((m) => (
              <TeamMemberCard key={m.initials} {...m} variant="featured" spiritual />
            ))}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Bureau Exécutif
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

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

          <div className="flex items-center gap-4 my-10">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Membres associés
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
            {associatedMembers.map((m) => (
              <TeamMemberCard key={m.initials} {...m} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
            Prêt à découvrir la communauté ?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Explorez les vicariats, suivez la vie de la CDLJ ou accédez au portail membre.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors w-full sm:w-auto"
            >
              Accéder au Portail
            </Link>
            <Link
              href="/nos-vicariats"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              Voir les vicariats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
