"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Activity, BookOpen } from "lucide-react";
import Link from "next/link";
import { fadeUp } from "./motion";
import {
  lecteursLabel,
  PAROISHES_TOTAL,
  VICARIATS_TOTAL,
} from "@/config/community-stats";

const FEATURES = [
  {
    icon: Users,
    stat: lecteursLabel({ prefix: "" }),
    title: "Un réseau diocésain unifié",
    description: `${PAROISHES_TOTAL} paroisses et ${VICARIATS_TOTAL} vicariats connectés dans l'Archidiocèse de Cotonou.`,
    iconBg: "bg-amber-100 text-amber-800",
    statColor: "text-amber-700 bg-amber-50 border-amber-200/60",
  },
  {
    icon: Activity,
    stat: "Activités synchronisées",
    title: "Tout est planifié, rien n'est oublié",
    description: "Assemblées générales, weekends de formation et sessions diocésaines au même endroit.",
    iconBg: "bg-blue-100 text-blue-800",
    statColor: "text-blue-700 bg-blue-50 border-blue-200/60",
  },
  {
    icon: BookOpen,
    stat: "Grades & actualités",
    title: "Chaque lecteur informé et suivi",
    description: "Progression liturgique, évaluations et infos utiles accessibles en un clic.",
    iconBg: "bg-emerald-100 text-emerald-800",
    statColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    href: "/about",
  },
];

function FeatureCard({
  feature,
  index,
  inView,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  inView: boolean;
}) {
  const Icon = feature.icon;

  const card = (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={index}
      className="group flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/70 bg-white hover:border-amber-200/70 hover:shadow-md hover:shadow-amber-900/5 transition-all duration-200 h-full"
    >
      <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${feature.iconBg} flex items-center justify-center`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className={`inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border mb-1.5 sm:mb-2 ${feature.statColor}`}>
          {feature.stat}
        </span>
        <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug mb-1">
          {feature.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );

  if (feature.href) {
    return (
      <Link href={feature.href} className="block h-full">
        {card}
      </Link>
    );
  }

  return card;
}

export function FeaturesBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Fonctionnalités
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
              Plateforme CDLJ : outils pour les lecteurs juniors
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto lg:mx-0 lg:text-right leading-relaxed text-center lg:text-left">
            Trois piliers pour simplifier la vie des lecteurs juniors et de leurs responsables.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
