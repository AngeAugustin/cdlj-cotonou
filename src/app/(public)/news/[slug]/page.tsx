import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, ArrowRight, Facebook, Bookmark, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import { FACEBOOK_URL, TIKTOK_URL } from "@/config/social-links";
import { getNewsBySlug, getPublishedNews, type PublicNewsDetail } from "@/lib/public-cache";
import { createPageMetadata, stripHtml, truncateDescription } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/seo-schemas";
import { NewsEngagement } from "@/components/news/NewsEngagement";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) {
    return createPageMetadata({
      title: "Article introuvable",
      description: "Cet article n'existe pas ou n'est plus disponible.",
      path: `/news/${slug}`,
      noIndex: true,
    });
  }

  const description =
    post.excerpt ||
    truncateDescription(stripHtml(post.body)) ||
    `Actualité de la CDLJ : ${post.title}`;

  return createPageMetadata({
    title: post.title,
    description,
    path: `/news/${post.slug}`,
    ogImage: post.image,
    ogType: "article",
    publishedTime: post.publishedAt,
    authors: [post.author],
    section: post.category,
    keywords: [
      post.category,
      ...post.tags,
      "CDLJ actualités",
      "lecteurs juniors Cotonou",
      "Communauté Diocésaine des Lecteurs Juniors",
      "Archidiocèse de Cotonou",
    ],
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) notFound();

  let related: PublicNewsDetail[] = [];
  try {
    const all = await getPublishedNews();
    related = all.filter((p) => p.slug !== slug).slice(0, 4);
  } catch {
    related = [];
  }

  return (
    <article className="bg-white min-h-screen">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Actualités", path: "/news" },
            { name: post.title, path: `/news/${post.slug}` },
          ]),
          articleSchema({
            title: post.title,
            description: post.excerpt || truncateDescription(stripHtml(post.body)),
            path: `/news/${post.slug}`,
            image: post.image,
            datePublished: post.publishedAt,
            author: post.author,
            section: post.category,
          }),
        ]}
      />

      {/* ── EN-TÊTE : image + métadonnées ─────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 pb-10 md:pt-10 md:pb-12">
          <Link
            href="/news"
            prefetch
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-900 transition-colors mb-6 md:mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux actualités
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 lg:items-center">
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-lg shadow-slate-900/5">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                unoptimized
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Titre, description & détails */}
            <div className="flex flex-col justify-center min-w-0">
              <Badge className="bg-amber-900 text-white border-0 w-max mb-4 hover:bg-amber-800">
                {post.category}
              </Badge>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight text-balance">
                {post.title}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="mt-6 pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {post.author.charAt(0)}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-slate-800 text-sm">{post.author}</span>
                    {post.authorRole && (
                      <span className="text-xs text-slate-400">{post.authorRole}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{post.date}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{post.category}</span>
                </div>
              </div>

              {(post.tags.length > 0 || post.readTime) && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {post.readTime && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {post.readTime}
                    </span>
                  )}
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-100"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CORPS DE L'ARTICLE ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <NewsEngagement slug={post.slug} />

        {/* ── SOCIAL FOLLOW ─────────────────────────────────── */}
        <div className="mt-16 flex flex-col sm:flex-row items-center gap-5 bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6">
          <span className="text-sm font-semibold text-slate-500 shrink-0">Suivez nous sur</span>
          <div className="flex items-center gap-3">
            <a href={FACEBOOK_URL}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0e65d9] text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-blue-500/20">
              <Facebook className="w-4 h-4" /> Facebook
            </a>
            <a href={TIKTOK_URL}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-slate-900/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-slate-100" />

        {/* ── ARTICLES LIÉS ─────────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">À lire aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {related.map((r) => (
                <Link key={r.slug} href={`/news/${r.slug}`} prefetch
                  className="group flex flex-col bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-40 lg:h-36 overflow-hidden">
                    <Image src={r.image} alt={r.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-amber-900 text-[10px] backdrop-blur-sm hover:bg-white px-2 py-0">
                        {r.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition-colors mb-2 line-clamp-2 leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 flex-1 leading-relaxed">{r.excerpt}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" /> {r.date}
                      </span>
                      <span className="text-amber-900 flex items-center gap-1 text-[11px] font-semibold group-hover:gap-1.5 transition-all">
                        Lire <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
