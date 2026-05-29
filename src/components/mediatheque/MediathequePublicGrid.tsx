"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { ExternalLink, ImageIcon } from "lucide-react";
import { fadeUp } from "@/components/landing/motion";
import { MEDIATHEQUE_CATEGORIES } from "@/modules/mediatheque/constants";
import {
  MediathequeCard,
  MEDIATHEQUE_COMPACT_GRID,
  MEDIATHEQUE_DEFAULT_GRID,
  type MediathequeCardData,
} from "@/components/mediatheque/MediathequeCard";

export type PublicMediathequeItem = MediathequeCardData & { _id: string };

type MediathequePublicGridProps = {
  items: PublicMediathequeItem[];
  showFilters?: boolean;
  limit?: number;
  showCta?: boolean;
  compact?: boolean;
  className?: string;
};

export function MediathequePublicGrid({
  items,
  showFilters = true,
  limit,
  showCta = false,
  compact = false,
  className = "",
}: MediathequePublicGridProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [filter, setFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const fromData = [...new Set(items.map((i) => i.categorie))];
    return fromData.length > 0 ? fromData : [...MEDIATHEQUE_CATEGORIES];
  }, [items]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? items : items.filter((i) => i.categorie === filter);
    return limit ? list.slice(0, limit) : list;
  }, [items, filter, limit]);

  return (
    <div ref={ref} className={className}>
      {showFilters && items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 justify-center lg:justify-start">
          <button
            onClick={() => setFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-amber-900 text-white shadow-md shadow-amber-900/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:border-amber-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                filter === cat
                  ? "bg-amber-900 text-white shadow-md shadow-amber-900/20"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:border-amber-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune médiathèque disponible pour le moment.</p>
        </div>
      ) : (
        <motion.div layout className={compact ? MEDIATHEQUE_COMPACT_GRID : MEDIATHEQUE_DEFAULT_GRID}>
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item._id}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i}
                layout
              >
                <MediathequeCard item={item} compact={compact} mode="public" />
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
            href="/mediatheque"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 transition-colors group"
          >
            Explorer toute la médiathèque
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
