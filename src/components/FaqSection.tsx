"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { fadeUp, staggerContainer } from "@/components/landing/motion";

const FAQS = [
  {
    q: "Qu'est-ce que la CDLJ ?",
    a: "La Communauté Diocésaine des Lecteurs Juniors (CDLJ) rassemble les jeunes lecteurs au service de l'Enfance Missionnaire de Cotonou. Elle forme, accompagne et fédère les lecteurs de l'Archidiocèse autour de la proclamation de la Parole de Dieu lors des célébrations et activités paroissiales.",
  },
  {
    q: "Comment est organisée la communauté dans l'archidiocèse ?",
    a: "L'Archidiocèse de Cotonou est structuré en 15 vicariats forains regroupant 124 paroisses. Chaque lecteur est rattaché à une paroisse et à un vicariat, ce qui permet une organisation claire entre la vie locale, la coordination vicariale et l'animation diocésaine.",
  },
  {
    q: "Quel est le rôle d'un vicariat ?",
    a: "Le vicariat forain est une zone pastorale qui coordonne plusieurs paroisses voisines. Il sert de relais entre l'administration diocésaine et les communautés locales : animation des lecteurs, organisation d'activités interparoissiales et suivi de la vie de la CDLJ à l'échelle du vicariat forain.",
  },
  {
    q: "Quelles activités la CDLJ propose-t-elle aux lecteurs ?",
    a: "Tout au long de l'année, la communauté organise des formations liturgiques, des retraites, des célébrations diocésaines, des sessions diocésaines, des weekends de formations et d'autres activités spirituelles et éducatives. Les paroisses et vicariats proposent également leurs propres activités ouvertes aux lecteurs de leur ressort.",
  },
  {
    q: "Comment un lecteur progresse-t-il dans la communauté ?",
    a: "Chaque lecteur est inscrit avec un grade qui reflète son niveau de formation et de responsabilité liturgique. Des évaluations périodiques permettent de mesurer sa progression et, le cas échéant, de le promouvoir au grade supérieur après validation par les responsables concernés.",
  },
  {
    q: "Comment retrouver ma paroisse ou mon vicariat sur le site ?",
    a: "Rendez-vous sur la page « Nos vicariats » pour découvrir la carte des 15 vicariats forains, leurs paroisses affiliées et leurs coordonnées. Vous y trouverez aussi les informations utiles pour contacter les responsables de votre secteur.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-12 md:mb-16"
      >
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100/80 border border-amber-200/50 px-3 py-1.5 rounded-full mb-3 sm:mb-4">
          Questions fréquentes
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-balance px-1">
          Tout ce que vous devez savoir
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-xl mx-auto px-1">
          Tout sur la vie de la communauté, les vicariats, les activités et la progression des lecteurs.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="space-y-2.5 sm:space-y-3"
      >
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              layout
              className={`rounded-xl sm:rounded-2xl border overflow-hidden transition-colors duration-300
                ${isOpen
                  ? "border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white shadow-lg shadow-amber-900/5"
                  : "border-slate-200/80 bg-white/80 backdrop-blur-sm hover:border-amber-200/60 hover:bg-slate-50/60"
                }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className={`font-semibold text-sm sm:text-base leading-snug transition-colors ${isOpen ? "text-amber-900" : "text-slate-800"}`}>
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-200 mt-0.5 sm:mt-0
                    ${isOpen ? "bg-amber-900 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {isOpen ? <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 sm:px-6 pb-4 sm:pb-5 text-slate-600 leading-relaxed text-xs sm:text-sm">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
