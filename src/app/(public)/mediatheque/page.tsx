import { Suspense } from "react";
import { MediathequePageAsync } from "@/components/mediatheque/MediathequePageAsync";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo-schemas";

export const revalidate = 120;

export const metadata = createPageMetadata({
  title: "Médiathèque",
  description:
    "Archives photos, vidéos et ressources documentaires de la CDLJ. Retrouvez les moments forts des sessions diocésaines, célébrations et activités paroissiales.",
  path: "/mediatheque",
  keywords: [
    "médiathèque CDLJ",
    "photos lecteurs juniors",
    "archives communauté diocésaine",
    "vidéos CDLJ Cotonou",
  ],
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
            name: "Médiathèque — CDLJ Cotonou",
            description:
              "Archives visuelles et documentaires de la Communauté Diocésaine des Lecteurs Juniors.",
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
            Retrouvez ici les archives visuelles et documentaires de la Communauté Diocésaine des Lecteurs Juniors.
          </p>
        </div>

        <Suspense fallback={<MediathequeGridSkeleton compact />}>
          <MediathequePageAsync />
        </Suspense>
      </div>
    </div>
  );
}
