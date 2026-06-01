import { unstable_cache } from "next/cache";
import { ActualiteService } from "@/modules/actualites/service";
import { MediathequeService } from "@/modules/mediatheque/service";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

export type PublicNewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  publishedAt: string;
  author: string;
  category: string;
  image: string;
  featured: boolean;
};

export type PublicNewsDetail = PublicNewsPost & {
  body: string;
  authorRole: string;
  readTime: string;
};

function normalizeNewsPost(p: {
  _id: { toString(): string };
  slug: string;
  title: string;
  excerpt: string;
  createdAt: Date | string;
  author: string;
  category: string;
  image?: string;
  featured: boolean;
  body?: unknown;
  authorRole?: string;
  readTime?: string;
}): PublicNewsDetail {
  return {
    id: p._id.toString(),
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body:
      typeof p.body === "string"
        ? p.body
        : Array.isArray(p.body)
          ? p.body.map((t: string) => `<p>${t}</p>`).join("")
          : "",
    date: new Date(p.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    publishedAt: new Date(p.createdAt).toISOString(),
    author: p.author,
    authorRole: p.authorRole ?? "",
    category: p.category,
    readTime: p.readTime ?? "",
    image:
      p.image ||
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1600",
    featured: p.featured,
  };
}

async function fetchPublishedMediatheques(): Promise<PublicMediathequeItem[]> {
  const service = new MediathequeService();
  const data = await service.getMediatheques(true);
  return data.map((d) => ({
    _id: String(d._id),
    nom: d.nom,
    categorie: d.categorie,
    mois: d.mois,
    annee: d.annee,
    coverImage: d.coverImage,
    hostingLink: d.hostingLink,
  }));
}

async function fetchPublishedNews(): Promise<PublicNewsDetail[]> {
  const service = new ActualiteService();
  const data = await service.getActualites(true);
  return data.map((p) => normalizeNewsPost(p as Parameters<typeof normalizeNewsPost>[0]));
}

async function fetchNewsBySlug(slug: string): Promise<PublicNewsDetail | null> {
  const service = new ActualiteService();
  const post = await service.getActualiteBySlug(slug);
  if (!post) return null;
  return normalizeNewsPost(post as Parameters<typeof normalizeNewsPost>[0]);
}

export const getPublishedMediatheques = unstable_cache(
  fetchPublishedMediatheques,
  ["public-mediatheques"],
  { revalidate: 120, tags: ["mediatheque"] }
);

export const getPublishedNews = unstable_cache(
  fetchPublishedNews,
  ["public-news"],
  { revalidate: 120, tags: ["actualites"] }
);

export const getNewsBySlug = (slug: string) =>
  unstable_cache(
    () => fetchNewsBySlug(slug),
    ["public-news-by-slug", slug],
    { revalidate: 120, tags: ["actualites"] }
  )();
