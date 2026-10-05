import { unstable_cache } from "next/cache";
import { MediathequeService } from "@/modules/mediatheque/service";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

function normalizeMediathequeItem(d: {
  _id: { toString(): string };
  nom: string;
  slug?: string;
  categorie: string;
  mois: number;
  annee: number;
  coverImage?: string;
  hostingLink: string;
}): PublicMediathequeItem {
  return {
    _id: String(d._id),
    nom: d.nom,
    slug: d.slug || String(d._id),
    categorie: d.categorie,
    mois: d.mois,
    annee: d.annee,
    coverImage: d.coverImage,
    hostingLink: d.hostingLink,
  };
}

async function fetchPublishedMediatheques(): Promise<PublicMediathequeItem[]> {
  const service = new MediathequeService();
  const data = await service.getMediatheques(true);
  return data.map((d) => normalizeMediathequeItem(d));
}

async function fetchMediathequeBySlug(slug: string): Promise<PublicMediathequeItem | null> {
  const service = new MediathequeService();
  const item = await service.getMediathequeBySlug(slug);
  if (!item) return null;
  return normalizeMediathequeItem(item);
}

async function fetchMediathequeById(id: string): Promise<PublicMediathequeItem | null> {
  const service = new MediathequeService();
  const item = await service.getMediathequeById(id);
  if (!item || !item.published) return null;
  return normalizeMediathequeItem(item);
}

export const getPublishedMediatheques = unstable_cache(
  fetchPublishedMediatheques,
  ["public-mediatheques"],
  { revalidate: 120, tags: ["mediatheque"] }
);

export const getMediathequeBySlug = (slug: string) =>
  unstable_cache(
    () => fetchMediathequeBySlug(slug),
    ["public-mediatheque-by-slug", slug],
    { revalidate: 120, tags: ["mediatheque"] }
  )();

export const getMediathequeById = (id: string) =>
  unstable_cache(
    () => fetchMediathequeById(id),
    ["public-mediatheque-by-id", id],
    { revalidate: 120, tags: ["mediatheque"] }
  )();
