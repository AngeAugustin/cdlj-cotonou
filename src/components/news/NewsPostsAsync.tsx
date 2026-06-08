import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, User, Clock, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <div className="text-center py-24 text-slate-400">
        <p className="text-lg font-medium">Aucune actualité publiée pour le moment.</p>
        <p className="text-sm mt-2">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <>
      {featured.map((post) => (
        <Link
          key={post.id}
          href={`/news/${post.slug}`}
          prefetch
          className="block group relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 mb-12 flex flex-col md:flex-row transition-all hover:shadow-2xl"
        >
          <div className="w-full md:w-1/2 h-[300px] md:h-[500px] relative overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
            <Badge variant="outline" className="border-amber-900 text-amber-900 w-max mb-6 rounded-full px-4 py-1">
              À LA UNE — {post.category}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 leading-tight group-hover:text-amber-900 transition-colors">
              {post.title}
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">{post.excerpt}</p>
            {(post.tags.length > 0 || post.readTime) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {post.readTime && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-amber-900" />
                    {post.readTime}
                  </span>
                )}
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center text-sm font-medium text-slate-500 gap-6 mt-auto">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-900" /> {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-900" /> {post.date}
              </div>
            </div>
          </div>
        </Link>
      ))}

      {others.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Toutes les publications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {others.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="relative h-60 w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-amber-900 hover:bg-white backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-amber-900 transition-colors">
                    <Link href={`/news/${post.slug}`} prefetch>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed flex-1">{post.excerpt}</p>
                  {(post.tags.length > 0 || post.readTime) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {post.readTime && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3 text-amber-900" />
                          {post.readTime}
                        </span>
                      )}
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {post.date}
                    </div>
                    <Link
                      href={`/news/${post.slug}`}
                      prefetch
                      className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-amber-900 group-hover:bg-amber-900 group-hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
