import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Network,
  Users,
} from "lucide-react";
import { VICARIATS } from "@/lib/vicariats-data";
import VicariatsMapWrapper from "@/components/VicariatsMapWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  lecteursSeoPhrase,
  PAROISHES_TOTAL,
  VICARIATS_TOTAL,
} from "@/config/community-stats";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.vicariats;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/nos-vicariats",
  keywords: [...seo.keywords],
});

const PRINCIPLES = [
  {
    title: "Vicariats forains",
    description: `${VICARIATS_TOTAL} zones géographiques qui structurent le territoire et relaient les directives.`,
    icon: Network,
  },
  {
    title: "Paroisses",
    description: `${PAROISHES_TOTAL} paroisses affiliées où la lecture s'exerce chaque dimanche.`,
    icon: MapPin,
  },
  {
    title: "Lecteurs juniors",
    description: `${lecteursSeoPhrase()} actifs dans la CDLJ à travers l'archidiocèse.`,
    icon: Users,
  },
] as const;

const PREVIEW_ITEMS = VICARIATS.slice(0, 3).map((v) => ({
  id: v.id,
  name: v.name,
  zone: v.zone,
  paroisses: v.paroisses,
}));

export default function VicariatsPage() {
  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Nos vicariats", path: "/nos-vicariats" },
          ]),
          collectionPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/nos-vicariats",
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
          className="absolute inset-x-0 top-[6%] flex justify-center pointer-events-none select-none"
          aria-hidden
        >
          <span className="font-extrabold tracking-[-0.04em] text-[14vw] sm:text-[10vw] lg:text-[8rem] leading-none text-amber-950/[0.04]">
            Vicariats
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
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Organisation territoriale
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                Les vicariats forains de{" "}
                <span className="text-amber-800">Cotonou</span>
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl text-pretty">
                L&apos;Archidiocèse de Cotonou est organisé en {VICARIATS_TOTAL} vicariats
                forains. Chaque vicariat relie l&apos;administration diocésaine aux
                communautés locales de lecteurs juniors.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#carte"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Voir la carte
                </a>
                <a
                  href="#liste"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Explorer les vicariats
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
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
                  <div className="flex-1 flex items-center justify-center gap-2 min-w-0 pr-8">
                    <Network className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <p className="text-[11px] text-slate-500 font-semibold tracking-wide truncate">
                      Vicariats CDLJ
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Aperçu
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {VICARIATS_TOTAL} vicariats forains
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                      {PAROISHES_TOTAL} paroisses
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {PREVIEW_ITEMS.map((item, index) => (
                      <li
                        key={item.id}
                        className={`rounded-xl border px-3.5 py-3 ${
                          index === 0
                            ? "border-amber-200/80 bg-amber-50/60"
                            : "border-slate-100 bg-[#faf9f7]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80 mb-1">
                              Vicariat {item.id}
                            </p>
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{item.zone}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {item.paroisses} par.
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture ─────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              De l&apos;archidiocèse aux lecteurs, simplement
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Une structure claire pour transmettre, former et accompagner sur tout le
              territoire.
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carte ────────────────────────────────────────────── */}
      <section
        id="carte"
        className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Carte des{" "}
              <span className="text-amber-800">{VICARIATS_TOTAL} vicariats</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Répartition territoriale de l&apos;Archidiocèse de Cotonou. Explorez un
              vicariat pour voir ses paroisses.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_20px_60px_-28px_rgba(69,26,3,0.18)] ring-1 ring-black/[0.03]">
            <VicariatsMapWrapper />
          </div>
        </div>
      </section>

      {/* ── Liste ────────────────────────────────────────────── */}
      <section
        id="liste"
        className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 scroll-mt-20 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Tous les vicariats{" "}
              <span className="text-amber-800">forains</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Chaque vicariat dispose d&apos;une fiche détaillée : zone, paroisses et
              communauté de lecteurs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {VICARIATS.map((v) => (
              <Link
                key={v.id}
                href={`/nos-vicariats/${v.slug}`}
                className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-[#faf9f7] p-6 sm:p-7 hover:border-amber-300/70 hover:bg-white hover:shadow-lg hover:shadow-amber-950/5 transition-all overflow-hidden"
              >
                <span className="pointer-events-none absolute top-3 right-4 text-4xl font-black text-slate-200/80 select-none group-hover:text-amber-100 transition-colors">
                  {v.id}
                </span>

                <div className="relative z-10 flex items-center gap-2 mb-4">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: v.hexColor }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Vicariat {v.id}
                  </span>
                </div>

                <h3 className="relative z-10 text-lg font-bold text-slate-900 leading-tight group-hover:text-amber-900 transition-colors">
                  {v.name}
                </h3>
                <p className="relative z-10 mt-1.5 text-sm text-slate-500 inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {v.zone}
                </p>

                <div className="relative z-10 mt-5 flex items-center gap-4 text-sm">
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-800">{v.paroisses}</span>
                    <span className="text-slate-400 text-xs">paroisses</span>
                  </span>
                  <span className="w-px h-4 bg-slate-200" />
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-800">
                      {v.lecteurs.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-slate-400 text-xs">lecteurs</span>
                  </span>
                </div>

                <span className="relative z-10 mt-5 pt-4 border-t border-slate-200/80 inline-flex items-center text-sm font-semibold text-amber-900">
                  Découvrir
                  <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
            Prêt à explorer le territoire ?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Retrouvez la vie de la communauté sur le blog, ou reconnectez-vous au portail
            membre.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/news"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors w-full sm:w-auto"
            >
              Lire le blog
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              Accéder au Portail
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
