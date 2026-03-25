import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualiteService } from "@/modules/actualites/service";
import { NEWS_POSTS } from "./data";

type NormalizedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  image: string;
  featured: boolean;
};

function normalizeDb(p: any): NormalizedPost {
  return {
    id:       p._id.toString(),
    slug:     p.slug,
    title:    p.title,
    excerpt:  p.excerpt,
    date:     new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    author:   p.author,
    category: p.category,
    image:    p.image || "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1600",
    featured: p.featured,
  };
}

function normalizeStatic(p: any): NormalizedPost {
  return {
    id:       String(p.id),
    slug:     p.slug,
    title:    p.title,
    excerpt:  p.excerpt,
    date:     p.date,
    author:   p.author,
    category: p.category,
    image:    p.image,
    featured: p.featured,
  };
}

async function getPosts(): Promise<NormalizedPost[]> {
  try {
    const service  = new ActualiteService();
    const dbPosts  = await service.getActualites(true);
    if (dbPosts.length > 0) return dbPosts.map(normalizeDb);
  } catch {
    // fallback to static data
  }
  return NEWS_POSTS.map(normalizeStatic);
}

export default async function NewsPage() {
  const posts    = await getPosts();
  const featured = posts.filter((n) => n.featured);
  const others   = posts.filter((n) => !n.featured);

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">

        <div className="flex flex-col mb-12 text-center md:text-left">
          <Badge className="bg-amber-100 text-amber-900 w-max mb-4 hover:bg-amber-200 mx-auto md:mx-0">
            A la une
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Blog & Actualités
          </h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl">
            Tenez-vous informés des dernières nouveautés, événements et décisions de notre grande communauté de lecteurs.
          </p>
        </div>

        {/* Featured Post */}
        {featured.map((post) => (
          <Link key={post.id} href={`/news/${post.slug}`}
            className="block group relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 mb-12 flex flex-col md:flex-row transition-all hover:shadow-2xl">
            <div className="w-full md:w-1/2 h-[300px] md:h-[500px] relative overflow-hidden">
              <Image src={post.image} alt={post.title} fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
              <Badge variant="outline" className="border-amber-900 text-amber-900 w-max mb-6 rounded-full px-4 py-1">
                À LA UNE — {post.category}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 leading-tight group-hover:text-amber-900 transition-colors">
                {post.title}
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">{post.excerpt}</p>
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

        {/* Other Posts Grid */}
        {others.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-slate-800 mb-8">Toutes les publications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {others.map((post) => (
                <div key={post.id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="relative h-60 w-full overflow-hidden">
                    <Image src={post.image} alt={post.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-amber-900 hover:bg-white backdrop-blur-sm">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-amber-900 transition-colors">
                      <Link href={`/news/${post.slug}`}>{post.title}</Link>
                    </h4>
                    <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {post.date}
                      </div>
                      <Link href={`/news/${post.slug}`}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-amber-900 group-hover:bg-amber-900 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {posts.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <p className="text-lg font-medium">Aucune actualité publiée pour le moment.</p>
            <p className="text-sm mt-2">Revenez bientôt !</p>
          </div>
        )}
      </div>
    </div>
  );
}
