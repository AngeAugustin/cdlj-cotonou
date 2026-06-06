import type { MetadataRoute } from "next";
import { getPublishedNews } from "@/lib/public-cache";
import { absoluteUrl } from "@/lib/site-url";
import { VICARIATS } from "@/lib/vicariats-data";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.9 },
  { url: absoluteUrl("/nos-vicariats"), changeFrequency: "monthly", priority: 0.9 },
  { url: absoluteUrl("/news"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/mediatheque"), changeFrequency: "weekly", priority: 0.8 },
  { url: absoluteUrl("/forums"), changeFrequency: "monthly", priority: 0.6 },
  { url: absoluteUrl("/resultats"), changeFrequency: "weekly", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vicariatRoutes: MetadataRoute.Sitemap = VICARIATS.map((v) => ({
    url: absoluteUrl(`/nos-vicariats/${v.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  let newsRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedNews();
    newsRoutes = posts.map((post) => ({
      url: absoluteUrl(`/news/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    newsRoutes = [];
  }

  return [...STATIC_ROUTES, ...vicariatRoutes, ...newsRoutes];
}
