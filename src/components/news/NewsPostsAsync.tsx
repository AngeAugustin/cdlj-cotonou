import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Hash, Newspaper, User } from "lucide-react";
import { getPublishedNews, type PublicNewsDetail } from "@/lib/public-cache";

export async function NewsPostsAsync() {
  let posts: PublicNewsDetail[] = [];

  try {
    posts = await getPublishedNews();
  } catch {
    posts = [];
  }

  const featured = posts.filter((n) => n.featured);
  const others = posts.filter((n) => !n.featured);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center">
        <Newspaper className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">
          Aucune actualité publiée pour le moment.
        </p>
        <p className="text-sm mt-2 text-slate-400">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {featured.map((post) => (
        <Link
          key={post.id}
          href={`/news/${post.slug}`}
          prefetch
          className="group block rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_20px_60px_-28px_rgba(69,26,3,0.22)] ring-1 ring-black/[0.03] hover:border-amber-300/70 transition-all"
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-[48%] aspect-[16/11] md:aspect-auto md:min-h-[340px] overflow-hidden bg-slate-100">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="w-full md:w-[52%] p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  À la une
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {post.category}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug group-hover:text-amber-900 transition-colors text-balance">
                {post.title}
              </h3>

              <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>

              {(post.tags.length > 0 || post.readTime) && (
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  {post.readTime ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-800" />
                      {post.readTime}
                    </span>
                  ) : null}
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[#faf9f7] border border-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4 text-amber-800" />
                    {post.author}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-800" />
                    {post.date}
                  </span>
                </div>
                <span className="inline-flex items-center text-sm font-semibold text-amber-900">
                  Lire l&apos;article
                  <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {others.length > 0 ? (
        <div>
          <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Toutes les publications
            </h3>
            <p className="text-sm text-slate-400 hidden sm:block">
              {others.length} article{others.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {others.map((post) => (
              <Link
                key={post.id}
                href={`/news/${post.slug}`}
                prefetch
                className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white overflow-hidden hover:border-amber-300/70 hover:shadow-lg hover:shadow-amber-950/5 transition-all h-full"
              >
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center rounded-full bg-white/95 border border-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-amber-900 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>

                  {(post.tags.length > 0 || post.readTime) && (
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {post.readTime ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3 text-amber-800" />
                          {post.readTime}
                        </span>
                      ) : null}
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-[#faf9f7] border border-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span className="inline-flex items-center text-sm font-semibold text-amber-900">
                      Lire
                      <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
