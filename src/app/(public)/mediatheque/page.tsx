import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MediathequeHeroTvAsync } from "@/components/mediatheque/MediathequeHeroTvAsync";
import { MediathequePageAsync } from "@/components/mediatheque/MediathequePageAsync";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
import { SITE_NAME_FULL } from "@/config/seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo-schemas";

export const revalidate = 120;

const seo = PAGE_SEO.mediatheque;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/mediatheque",
  keywords: [...seo.keywords],
});

function RetroTvSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[560px] animate-pulse">
      <div className="rounded-[2.25rem] bg-[#cbb892]/70 p-3.5">
        <div className="aspect-[16/9] rounded-[1.05rem] bg-[#2a241c]/40" />
        <div className="mt-3 h-7 rounded-full bg-amber-950/10" />
      </div>
    </div>
  );
}

export default function MediathequePage() {
  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Médiathèque", path: "/mediatheque" },
          ]),
          collectionPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/mediatheque",
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
          <span className="font-extrabold tracking-[-0.04em] text-[12vw] sm:text-[9vw] lg:text-[7.5rem] leading-none text-amber-950/[0.04]">
            Médiathèque
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
                Photos, vidéos & archives
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                Revivez les moments de la{" "}
                <span className="text-amber-800">communauté</span>
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl text-pretty">
                Archives photos et vidéos des sessions diocésaines, célébrations et activités
                de la {SITE_NAME_FULL} à Cotonou.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#archives"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Explorer les archives
                </a>
                <Link
                  href="/news"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Voir le blog
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="relative pt-8">
              <Suspense fallback={<RetroTvSkeleton />}>
                <MediathequeHeroTvAsync />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Archives ─────────────────────────────────────────── */}
      <section
        id="archives"
        className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 scroll-mt-20 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Moments &amp; souvenirs
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Filtrez par catégorie et explorez les albums publiés par la communauté.
            </p>
          </div>

          <Suspense fallback={<MediathequeGridSkeleton compact />}>
            <MediathequePageAsync />
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
            Retrouvez le contexte des événements sur le blog, ou explorez l&apos;organisation
            par vicariats.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/news"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors w-full sm:w-auto"
            >
              Lire le blog
            </Link>
            <Link
              href="/nos-vicariats"
              className="inline-flex items-center justify-center rounded-xl h-12 px-7 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              Nos vicariats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
