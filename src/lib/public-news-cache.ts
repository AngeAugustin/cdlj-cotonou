import { unstable_cache } from "next/cache";
import { ActualiteRepository } from "@/modules/actualites/repository";

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
  readTime: string;
  tags: string[];
};

export type PublicNewsDetail = PublicNewsPost & {
  body: string;
  authorRole: string;
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
  tags?: string[];
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
    tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : [],
    image:
      p.image ||
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1600",
    featured: p.featured,
  };
}

async function fetchPublishedNews(): Promise<PublicNewsDetail[]> {
  const repo = new ActualiteRepository();
  const data = await repo.findAll(true);
  return data.map((p) => normalizeNewsPost(p as Parameters<typeof normalizeNewsPost>[0]));
}

async function fetchNewsBySlug(slug: string): Promise<PublicNewsDetail | null> {
  const repo = new ActualiteRepository();
  const post = await repo.findBySlug(slug);
  if (!post) return null;
  return normalizeNewsPost(post as Parameters<typeof normalizeNewsPost>[0]);
}

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
