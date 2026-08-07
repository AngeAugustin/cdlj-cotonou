"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { fadeUp, staggerContainer } from "./motion";
import {
  lecteursLabel,
  lecteursSeoPhrase,
  VICARIATS_TOTAL,
} from "@/config/community-stats";
import { SITE_NAME_FULL } from "@/config/seo";

const HERO_IMAGE = {
  src: "/images/20240630_110241 (1).jpg",
  alt: "Communauté des lecteurs juniors — CDLJ Cotonou",
};

const TRUST_ITEMS = [
  "Données sécurisées",
  lecteursLabel({ prefix: "~" }),
  `${VICARIATS_TOTAL} vicariats`,
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-0 lg:px-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[#f7f5f1]" />
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(120, 53, 15, 0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(120, 53, 15, 0.055) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 20%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 20%, black 20%, transparent 75%)",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-amber-100/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-medium shadow-sm hover:border-amber-300/80 hover:text-amber-950 transition-colors"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span>CDLJ · Archidiocèse de Cotonou</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-7 sm:mt-8 max-w-[16ch] sm:max-w-3xl text-[2.35rem] sm:text-5xl md:text-6xl lg:text-[4.1rem] font-extrabold tracking-tight leading-[1.05] text-slate-900 text-balance"
          >
            Lecteurs,{" "}
            <span className="text-amber-800">Sel &amp; Lumière</span> nous
            sommes
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 sm:mt-6 text-[15px] sm:text-lg text-slate-500 max-w-2xl leading-relaxed text-pretty"
          >
            {`Proclamer, Prier & Obéir — la ${SITE_NAME_FULL} fédère ${lecteursSeoPhrase()} dans l'Archidiocèse de Cotonou.`}
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md sm:max-w-none"
          >
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-xl h-12 px-6 text-sm sm:text-[15px] font-semibold bg-amber-950 hover:bg-amber-900 text-white shadow-md shadow-amber-950/15 border-0">
                Accéder au Portail
              </Button>
            </Link>
            <Link href="/news" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="group w-full sm:w-auto rounded-xl h-12 px-6 text-sm sm:text-[15px] font-semibold border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
              >
                En savoir plus
                <ArrowRight className="ml-2 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
              </Button>
            </Link>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            custom={4}
            className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500"
          >
            {TRUST_ITEMS.map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.5} />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 sm:mt-14 md:mt-16 w-full max-w-5xl"
        >
          <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_80px_-20px_rgba(69,26,3,0.28)] overflow-hidden ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-3 px-4 sm:px-5 h-11 sm:h-12 border-b border-slate-100 bg-[#f4f2ee]">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 min-w-0 pr-8">
                <span className="size-4 rounded bg-amber-900 text-[9px] font-bold text-amber-50 flex items-center justify-center shrink-0">
                  C
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide truncate">
                  CDLJ
                </p>
              </div>
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-100">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </div>

          <div
            className="pointer-events-none h-16 sm:h-24 -mt-16 sm:-mt-24 relative z-10 bg-gradient-to-b from-transparent to-[#f7f5f1]"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}
