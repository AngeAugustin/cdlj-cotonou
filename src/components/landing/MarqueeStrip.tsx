"use client";

import { motion } from "framer-motion";

const ITEMS = [
  "Lecteurs Juniors",
  "Vicariats Forains",
  "Paroisses",
  "Formations Liturgiques",
  "Assemblées Générales",
  "Retraites Spirituelles",
  "Grades & Évaluations",
  "Cotonou",
];

export function MarqueeStrip() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section className="relative py-4 sm:py-5 md:py-6 border-y border-slate-200/60 bg-white/60 backdrop-blur-sm overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-5 sm:gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wide sm:tracking-widest"
          >
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
          </span>
        ))}
      </motion.div>
    </section>
  );
}
