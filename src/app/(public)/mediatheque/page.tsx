import { Suspense } from "react";
import { MediathequePageAsync } from "@/components/mediatheque/MediathequePageAsync";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
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

export default function MediathequePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Médiathèque
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Photos, vidéos & ressources
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl">
            Archives photos et vidéos des sessions diocésaines, célébrations et activités paroissiales de la CDLJ à Cotonou. Médiathèque officielle des lecteurs juniors.
          </p>
        </div>

        <Suspense fallback={<MediathequeGridSkeleton compact />}>
          <MediathequePageAsync />
        </Suspense>
      </div>
    </div>
  );
}
