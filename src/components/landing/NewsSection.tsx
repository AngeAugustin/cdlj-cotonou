"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { NewsPublicGrid } from "@/components/news/NewsPublicGrid";
import type { PublicNewsDetail } from "@/lib/public-cache";

export function NewsSection({ posts }: { posts: PublicNewsDetail[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Actualités
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
              Événements & vie de la communauté
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto lg:mx-0 lg:text-right leading-relaxed text-center lg:text-left">
            Assemblées, formations et annonces officielles de la CDLJ à Cotonou.
          </p>
        </motion.div>

        <NewsPublicGrid posts={posts} limit={3} showCta />
      </div>
    </section>
  );
}
