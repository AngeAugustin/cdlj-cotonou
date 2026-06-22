"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar, ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/components/landing/motion";
import type { PublicNewsDetail } from "@/lib/public-cache";

export const NEWS_DEFAULT_GRID =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";

type NewsPublicGridProps = {
  posts: PublicNewsDetail[];
  limit?: number;
  showCta?: boolean;
  className?: string;
};

function NewsCard({ post }: { post: PublicNewsDetail }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      prefetch
      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden h-full"
    >
      <div className="relative h-48 sm:h-52 w-full overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 text-amber-900 hover:bg-white backdrop-blur-sm text-xs">
            {post.category}
          </Badge>
        </div>
        {post.featured && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-amber-900/90 text-white border-amber-800 text-[10px] backdrop-blur-sm">
              À la une
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 group-hover:text-amber-900 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-900" />
            {post.date}
          </div>
          <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-amber-900 group-hover:bg-amber-900 group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NewsPublicGrid({
  posts,
  limit,
  showCta = false,
  className = "",
}: NewsPublicGridProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const displayed = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }, [posts, limit]);

  return (
    <div ref={ref} className={className}>
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune actualité publiée pour le moment.</p>
        </div>
      ) : (
        <motion.div layout className={NEWS_DEFAULT_GRID}>
          <AnimatePresence mode="popLayout">
            {displayed.map((post, i) => (
              <motion.div
                key={post.id}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i}
                layout
              >
                <NewsCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {showCta && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mt-10 text-center lg:text-left"
        >
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 transition-colors group"
          >
            Voir toutes les actualités
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
