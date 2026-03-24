import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Tag, ArrowRight, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NEWS_POSTS } from "../data";

export function generateStaticParams() {
  return NEWS_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = NEWS_POSTS.find((p) => p.slug === slug);

  if (!post) notFound();

  const related = NEWS_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-8 left-6 md:left-12 z-10">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux actualités
          </Link>
        </div>

        {/* Hero metadata */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-amber-500 text-white border-0 mb-4 hover:bg-amber-400">
              {post.category}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-8 mb-10 border-b border-slate-100 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {post.author.charAt(0)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-800 text-sm">{post.author}</span>
              <span className="text-xs text-slate-400">{post.authorRole}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>{post.date}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>{post.readTime}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-700" />
            <span>{post.category}</span>
          </div>
        </div>

        {/* Lead paragraph */}
        <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10 border-l-4 border-amber-900 pl-5">
          {post.excerpt}
        </p>

        {/* Body paragraphs */}
        <div className="prose prose-slate prose-lg max-w-none space-y-6">
          {post.body.map((paragraph, i) => (
            <p key={i} className="text-slate-700 leading-relaxed text-base md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        {/* ── SOCIAL FOLLOW ─────────────────────────────────── */}
        <div className="mt-16 flex flex-col sm:flex-row items-center gap-5 bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6">
          <span className="text-sm font-semibold text-slate-500 shrink-0">Suivez nous sur</span>
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/share/1Ja1wGpp8x/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0e65d9] text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-blue-500/20"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
            <a
              href="https://www.tiktok.com/@cdlj.officiel?_r=1&_t=ZS-94vo0WDU7s4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-slate-900/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 pt-10 border-t border-slate-100" />

        {/* ── ARTICLES LIÉS ─────────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">À lire aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/news/${r.slug}`}
                  className="group flex flex-col bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={r.image}
                      alt={r.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-amber-900 text-xs backdrop-blur-sm hover:bg-white">
                        {r.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 group-hover:text-amber-900 transition-colors mb-2 line-clamp-2">
                      {r.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 flex-1">{r.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {r.date}
                      </span>
                      <span className="text-amber-900 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all">
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
    </div>
  );
}
