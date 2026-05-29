"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Sparkles,
  Users,
  ShieldCheck,
  MapPin,
  Church,
  BookOpen,
  Cross,
} from "lucide-react";
import { fadeUp, staggerContainer } from "./motion";

const HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=900",
  alt: "Communauté des lecteurs juniors — CDLJ Cotonou",
  caption: "Session Diocésaine",
};

const ORBIT_ITEMS = [
  {
    icon: Church,
    label: "124 Paroisses",
    sub: "Archidiocèse de Cotonou",
    iconBg: "bg-amber-100 text-amber-800",
    position: "left-0 sm:-left-4 top-[18%]",
    float: { y: [0, -8, 0] },
    delay: 0.5,
  },
  {
    icon: BookOpen,
    label: "Parole de Dieu",
    sub: "Lecteurs Juniors",
    iconBg: "bg-blue-100 text-blue-800",
    position: "right-0 sm:-right-4 top-[8%]",
    float: { y: [0, -10, 0] },
    delay: 0.7,
  },
  {
    icon: Cross,
    label: "Liturgie",
    sub: "Sel & Lumière",
    iconBg: "bg-emerald-100 text-emerald-800",
    position: "right-4 sm:right-8 bottom-[12%]",
    float: { y: [0, 8, 0] },
    delay: 0.9,
  },
];

function OrbitBadge({
  icon: Icon,
  label,
  sub,
  iconBg,
  position,
  float,
  delay,
}: (typeof ORBIT_ITEMS)[number]) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, y: float.y }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      }}
      className={`absolute ${position} z-20`}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-lg shadow-amber-900/10">
        <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight whitespace-nowrap">{label}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] mx-auto h-[440px] sm:h-[480px] lg:h-[500px]"
    >
      <div className="absolute inset-6 rounded-full bg-amber-200/25 blur-3xl pointer-events-none" />

      {/* Cadre image central */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[290px] lg:w-[310px] z-10">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="group p-3 sm:p-3.5 bg-white rounded-2xl shadow-2xl shadow-amber-900/15 border border-amber-100 ring-1 ring-black/[0.04]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                unoptimized
                priority
              />
            </div>
            <p className="mt-2.5 text-center text-xs sm:text-sm font-bold text-amber-900 tracking-wide">
              {HERO_IMAGE.caption}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Petits composants autour */}
      {ORBIT_ITEMS.map((item) => (
        <OrbitBadge key={item.label} {...item} />
      ))}
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex items-center overflow-hidden px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:min-h-[90vh] lg:py-28 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[30rem] sm:w-[55rem] h-[30rem] sm:h-[55rem] rounded-full bg-gradient-to-br from-amber-400/20 via-amber-600/10 to-transparent blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[25rem] sm:w-[45rem] h-[25rem] sm:h-[45rem] rounded-full bg-gradient-to-tl from-amber-900/15 via-orange-500/10 to-transparent blur-[100px] sm:blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(120,53,15,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120,53,15,0.04) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-16 items-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center lg:text-left"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/70 backdrop-blur-md border border-amber-200/60 text-amber-900 font-semibold text-xs sm:text-sm shadow-sm shadow-amber-900/5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">Plateforme Active & Sécurisée</span>
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-5 sm:mt-8 text-[1.75rem] leading-[1.12] sm:text-4xl md:text-5xl lg:text-[4.25rem] font-extrabold text-slate-900 tracking-tight text-balance"
          >
            Lecteurs,{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950">
                Sel & Lumière
              </span>
              <motion.span
                className="absolute -bottom-0.5 sm:-bottom-1 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-400/0 via-amber-500/60 to-amber-400/0 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>{" "}
            nous sommes
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed px-1"
          >
            Proclamer, Prier & Obéir est notre seule devise.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-7 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start w-full max-w-md mx-auto lg:mx-0 lg:max-w-none"
          >
            <Link href="/auth/login" className="w-full sm:w-auto sm:flex-initial">
              <Button
                className="group relative w-full bg-gradient-to-r from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 text-white rounded-full px-5 sm:px-6 h-10 sm:h-11 text-sm sm:text-base shadow-xl shadow-amber-900/25 border-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                Accéder au Portail
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/news" className="w-full sm:w-auto sm:flex-initial">
              <Button
                variant="outline"
                className="w-full rounded-full px-5 sm:px-6 h-10 sm:h-11 text-sm sm:text-base border-slate-200/80 text-slate-700 hover:bg-white/80 hover:border-amber-300/60 bg-white/50 backdrop-blur-sm shadow-sm"
              >
                Blog & Actualités
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 sm:gap-6 text-xs sm:text-sm text-slate-500"
          >
            {[
              { icon: ShieldCheck, label: "Données sécurisées" },
              { icon: Users, label: "+3000 lecteurs" },
              { icon: MapPin, label: "15 vicariats" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 sm:gap-2">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 shrink-0" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <HeroVisual />
      </div>
    </section>
  );
}
