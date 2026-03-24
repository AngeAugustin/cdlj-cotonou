"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Qui peut accéder au portail intranet ?",
    a: "L'accès est strictement réservé aux membres officiels de la CDLJ : les bureaux paroissiaux, vicarials, l'administration diocésaine et les super-administrateurs. Chaque compte est créé manuellement par un administrateur.",
  },
  {
    q: "Comment obtenir mes identifiants de connexion ?",
    a: "Vos identifiants sont fournis par le responsable informatique de votre vicariat ou par l'administration diocésaine lors de votre prise de fonction. Contactez votre responsable hiérarchique pour toute demande.",
  },
  {
    q: "Que faire si j'ai oublié mon mot de passe ?",
    a: "Utilisez le lien « Oublié ? » sur la page de connexion pour initier une réinitialisation par email. Si votre adresse n'est plus accessible, contactez directement l'administrateur diocésain.",
  },
  {
    q: "Quels niveaux d'accès existent sur la plateforme ?",
    a: "La plateforme est structurée en quatre niveaux : Paroissial (gestion locale), Vicarial (supervision des paroisses du vicariat), Diocésain (vision globale du diocèse), et SuperAdmin (administration technique complète).",
  },
  {
    q: "Les données des lecteurs sont-elles sécurisées ?",
    a: "Oui. Toutes les données sont chiffrées en transit (HTTPS) et au repos. L'accès est restreint selon le rôle de chaque utilisateur — un responsable paroissial ne voit que les données de sa paroisse.",
  },
  {
    q: "Puis-je accéder au portail depuis un mobile ?",
    a: "Le portail est conçu pour fonctionner sur ordinateur de bureau et tablette. Une version mobile optimisée est en cours de développement.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
          Questions fréquentes
        </span>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Tout ce que vous devez savoir
        </h2>
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          Une question sans réponse ici ? Contactez l'administration diocésaine.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden
                ${isOpen
                  ? "border-amber-200 bg-amber-50/60 shadow-md shadow-amber-900/5"
                  : "border-slate-200 bg-white hover:border-amber-200/60 hover:bg-slate-50/60"
                }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className={`font-semibold text-base transition-colors ${isOpen ? "text-amber-900" : "text-slate-800"}`}>
                  {faq.q}
                </span>
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
                  ${isOpen ? "bg-amber-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-slate-600 leading-relaxed text-sm">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
