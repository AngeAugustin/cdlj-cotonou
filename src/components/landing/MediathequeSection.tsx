"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MediathequePublicGrid, type PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

export function MediathequeSection({ items }: { items: PublicMediathequeItem[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/80">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Médiathèque
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
              Photos, vidéos & ressources
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto lg:mx-0 lg:text-right leading-relaxed text-center lg:text-left">
            Revivez les moments forts de la communauté et accédez aux archives de la CDLJ.
          </p>
        </motion.div>

        <MediathequePublicGrid items={items} limit={6} showCta />
      </div>
    </section>
  );
}
