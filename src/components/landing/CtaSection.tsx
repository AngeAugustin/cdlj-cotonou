"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";

export function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto relative"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-amber-900 via-amber-950 to-slate-950 p-6 sm:p-8 md:p-10 lg:p-14 shadow-2xl shadow-amber-900/25 text-center">
          <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/5 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-amber-500/10 rounded-full blur-[40px] sm:blur-[60px] pointer-events-none" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-20 sm:h-20 border border-white/10 rounded-full pointer-events-none hidden sm:block"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-400/20 border border-amber-400/30 items-center justify-center mb-4 sm:mb-6"
            >
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
            </motion.div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight text-balance px-1">
              Prêt à rejoindre l&apos;interface ?
            </h3>
            <p className="text-sm sm:text-base text-amber-100/75 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto px-1">
              Connectez-vous à votre espace de gestion et contribuez à la mission de la CDLJ.
            </p>

            <Link href="/auth/login" className="block w-full sm:inline-block sm:w-auto">
              <Button
                size="lg"
                className="group w-full sm:w-auto bg-white hover:bg-amber-50 text-amber-950 font-extrabold rounded-full px-8 sm:px-10 h-12 sm:h-auto sm:py-6 text-sm sm:text-base shadow-xl transition-all hover:shadow-2xl hover:shadow-white/10"
              >
                <Sparkles className="mr-2 h-4 w-4 text-amber-700" />
                Accéder au Portail
                <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
