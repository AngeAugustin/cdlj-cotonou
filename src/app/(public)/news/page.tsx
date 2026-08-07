import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NewsHeroNewspaperAsync } from "@/components/news/NewsHeroNewspaperAsync";
import { NewsPostsAsync } from "@/components/news/NewsPostsAsync";
import { NewsListSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
import { SITE_NAME_FULL } from "@/config/seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo-schemas";

export const revalidate = 120;

const seo = PAGE_SEO.news;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/news",
  keywords: [...seo.keywords],
});

function NewspaperSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[520px] animate-pulse rotate-[-1.25deg]">
      <div className="rounded-sm border border-amber-950/10 bg-[#f3e6c4] px-5 py-5 space-y-3">
        <div className="h-8 w-2/3 mx-auto rounded bg-amber-900/10" />
        <div className="h-3 w-full rounded bg-amber-900/10" />
        <div className="h-20 w-full rounded bg-amber-900/10" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 rounded bg-amber-900/10" />
          <div className="h-16 rounded bg-amber-900/10" />
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Actualités", path: "/news" },
          ]),
          collectionPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/news",
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
            Blog
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
                Actualités & blog CDLJ
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                Suivez la vie de la{" "}
                <span className="text-amber-800">communauté</span>
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl text-pretty">
                Retrouvez les dernières nouvelles, assemblées, sessions diocésaines et
                événements de la {SITE_NAME_FULL} de l&apos;Archidiocèse de Cotonou.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#publications"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Voir les publications
                </a>
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  À propos de la CDLJ
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <Suspense fallback={<NewspaperSkeleton />}>
                <NewsHeroNewspaperAsync />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Publications ─────────────────────────────────────── */}
      <section
        id="publications"
        className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 scroll-mt-20 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Composez votre{" "}
              <span className="text-amber-800">lecture</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Articles à la une et publications récentes de la communauté diocésaine.
            </p>
          </div>

          <Suspense fallback={<NewsListSkeleton />}>
            <NewsPostsAsync />
          </Suspense>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
            Envie d&apos;aller plus loin ?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Explorez les vicariats, la médiathèque ou reconnectez-vous au portail membre.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/mediatheque"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors w-full sm:w-auto"
            >
              Voir la médiathèque
            </Link>
            <Link
              href="/nos-vicariats"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold border border-slate-200 bg-[#faf9f7] text-slate-800 hover:bg-white transition-colors w-full sm:w-auto"
            >
              Nos vicariats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
