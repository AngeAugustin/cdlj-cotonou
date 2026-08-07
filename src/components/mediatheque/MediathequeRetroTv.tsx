"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type RetroTvSlide = {
  title: string;
  category: string;
  image?: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800";

type MediathequeRetroTvProps = {
  slides: RetroTvSlide[];
};

export function MediathequeRetroTv({ slides }: MediathequeRetroTvProps) {
  const safeSlides =
    slides.length > 0
      ? slides
      : [
          {
            title: "Archives CDLJ",
            category: "Médiathèque",
            image: FALLBACK_IMAGE,
          },
        ];

  const [index, setIndex] = useState(0);
  const current = safeSlides[index % safeSlides.length];

  useEffect(() => {
    if (safeSlides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, [safeSlides.length]);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Antennas */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-12 pointer-events-none" aria-hidden>
        <div className="absolute left-[30%] bottom-0 w-[2px] h-11 bg-slate-500 origin-bottom -rotate-[26deg] rounded-full" />
        <div className="absolute right-[30%] bottom-0 w-[2px] h-11 bg-slate-500 origin-bottom rotate-[26deg] rounded-full" />
        <div className="absolute left-[20%] top-0 size-2 rounded-full bg-amber-700/80" />
        <div className="absolute right-[20%] top-0 size-2 rounded-full bg-amber-700/80" />
      </div>

      {/* TV body */}
      <div className="relative rounded-[2rem] sm:rounded-[2.25rem] bg-gradient-to-b from-[#d7c7a8] via-[#cbb892] to-[#b9a57a] p-3 sm:p-3.5 shadow-[0_28px_60px_-20px_rgba(69,26,3,0.45)] ring-1 ring-amber-950/15">
        <div className="absolute inset-x-6 top-2 h-1 rounded-full bg-white/25" aria-hidden />

        {/* Bezel + screen */}
        <div className="relative rounded-[1.35rem] sm:rounded-[1.5rem] bg-[#2a241c] p-2.5 sm:p-3 shadow-inner">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[0.9rem] sm:rounded-[1.05rem] bg-[#0b0a08]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.title}-${index}`}
                initial={{ opacity: 0.35, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0"
              >
                <Image
                  src={current.image || FALLBACK_IMAGE}
                  alt={current.title}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="560px"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* CRT overlays */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 3px)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute inset-x-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent"
              animate={{ top: ["-35%", "110%"] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />

            {/* On-screen caption */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/90">
                {current.category}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white leading-snug line-clamp-2">
                {current.title}
              </p>
            </div>

            {/* Channel badge */}
            <div className="absolute top-2.5 left-2.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 border border-emerald-500/30">
              CH {String((index % safeSlides.length) + 1).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-3 flex items-center justify-between gap-3 px-1.5 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950/55">
              On Air
            </span>
          </div>

          <div className="flex items-center gap-2.5" aria-hidden>
            <div className="size-7 rounded-full bg-gradient-to-br from-[#a8946e] to-[#8a7554] shadow-inner border border-amber-950/20" />
            <div className="size-7 rounded-full bg-gradient-to-br from-[#a8946e] to-[#8a7554] shadow-inner border border-amber-950/20" />
          </div>

          {/* Speaker grille */}
          <div className="flex gap-[3px]" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-5 w-[3px] rounded-full bg-amber-950/25" />
            ))}
          </div>
        </div>
      </div>

      {/* Soft base shadow */}
      <div
        className="mx-auto mt-3 h-3 w-[70%] rounded-[100%] bg-amber-950/15 blur-md"
        aria-hidden
      />
    </div>
  );
}
