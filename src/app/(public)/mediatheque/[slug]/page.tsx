import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import mongoose from "mongoose";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, ImageIcon } from "lucide-react";
import { MediathequeCard } from "@/components/mediatheque/MediathequeCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME_FULL } from "@/config/seo";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";
import {
  getMediathequeById,
  getMediathequeBySlug,
  getPublishedMediatheques,
} from "@/lib/public-cache";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo-schemas";
import { formatMediathequeDate } from "@/modules/mediatheque/constants";

export const revalidate = 120;

function albumDescription(item: PublicMediathequeItem): string {
  const when = formatMediathequeDate(item.mois, item.annee);
  return `Album « ${item.nom} » — ${item.categorie}, ${when}. Archives photos et vidéos de la ${SITE_NAME_FULL} à Cotonou.`;
}

async function loadAlbum(param: string): Promise<PublicMediathequeItem | null> {
  const bySlug = await getMediathequeBySlug(param);
  if (bySlug) return bySlug;
  if (mongoose.Types.ObjectId.isValid(param)) {
    return getMediathequeById(param);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadAlbum(slug);
  if (!item) {
    return createPageMetadata({
      title: "Album introuvable",
      description: "Cet album n'existe pas ou n'est plus disponible.",
      path: `/mediatheque/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: item.nom,
    description: albumDescription(item),
    path: `/mediatheque/${item.slug}`,
    ogImage: item.coverImage,
    ogType: "article",
    section: item.categorie,
    keywords: [
      item.categorie,
      item.nom,
      "médiathèque CDLJ",
      "archives photos CDLJ",
      "lecteurs juniors Cotonou",
    ],
  });
}

export default async function MediathequeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await loadAlbum(slug);
  if (!item) notFound();
  if (item.slug && item.slug !== slug) {
    redirect(`/mediatheque/${item.slug}`);
  }

  let related: PublicMediathequeItem[] = [];
  try {
    const all = await getPublishedMediatheques();
    const sameCategory = all.filter(
      (a) => a._id !== item._id && a.categorie === item.categorie
    );
    const others = all.filter(
      (a) => a._id !== item._id && a.categorie !== item.categorie
    );
    related = [...sameCategory, ...others].slice(0, 4);
  } catch {
    related = [];
  }

  const when = formatMediathequeDate(item.mois, item.annee);
  const description = albumDescription(item);
  const path = `/mediatheque/${item.slug}`;

  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Médiathèque", path: "/mediatheque" },
            { name: item.nom, path },
          ]),
          webPageSchema({
            name: item.nom,
            description,
            path,
            image: item.coverImage,
          }),
        ]}
      />

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

        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/mediatheque"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-900 transition-colors mb-8 sm:mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la médiathèque
          </Link>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-amber-200/50 bg-white shadow-lg shadow-amber-950/5">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.nom}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                  <ImageIcon className="h-14 w-14 text-amber-300" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-medium">
                {item.categorie}
              </span>

              <h1 className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-slate-900 text-balance">
                {item.nom}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed text-pretty">
                Album photo et vidéo publié par la communauté. Ouvrez l&apos;archive
                pour parcourir l&apos;intégralité des moments.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  {when}
                </span>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={item.hostingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Ouvrir l&apos;album
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
                <Link
                  href="/mediatheque#archives"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Voir les archives
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 text-balance">
                Autres archives
              </h2>
              <p className="mt-3 text-base text-slate-500 leading-relaxed">
                Continuez à explorer les moments partagés par la communauté.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((album) => (
                <MediathequeCard key={album._id} item={album} compact mode="public" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
