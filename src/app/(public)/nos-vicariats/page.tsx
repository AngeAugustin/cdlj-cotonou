import Link from "next/link";
import { MapPin, ChevronRight, ArrowDown } from "lucide-react";
import { VICARIATS } from "@/lib/vicariats-data";
import VicariatsMapWrapper from "@/components/VicariatsMapWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  formatLecteursCount,
  lecteursSeoPhrase,
  PAROISHES_TOTAL,
  VICARIATS_TOTAL,
} from "@/config/community-stats";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.vicariats;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/nos-vicariats",
  keywords: [...seo.keywords],
});

const WORKFLOW = [
  { label: "Archidiocèse de Cotonou",  desc: "Autorité ecclésiastique suprême du diocèse",         count: "1",    unit: "diocèse",   color: "bg-amber-900 text-white"       },
  { label: "Vicariats Forains",        desc: `${VICARIATS_TOTAL} zones géographiques structurant le territoire`, count: String(VICARIATS_TOTAL), unit: "vicariats", color: "bg-amber-700 text-white" },
  { label: "Paroisses Affiliées",      desc: `${PAROISHES_TOTAL} paroisses réparties dans les vicariats`, count: String(PAROISHES_TOTAL), unit: "paroisses", color: "bg-amber-500 text-white" },
  { label: "Lecteurs Juniors",         desc: `${lecteursSeoPhrase()} actifs dans la CDLJ`, count: formatLecteursCount(), unit: "lecteurs", color: "bg-amber-300 text-amber-950" },
];

export default function VicariatsPage() {
  return (
    <div className="bg-slate-50 min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Nos vicariats", path: "/nos-vicariats" },
          ]),
          collectionPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/nos-vicariats",
          }),
        ]}
      />

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-amber-900 font-semibold text-sm mb-6 uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> Organisation territoriale
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6 max-w-4xl">
            Les Vicariats Forains de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900">
              l'Archidiocèse de Cotonou
            </span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mb-8">
            L&apos;Archidiocèse de Cotonou est organisé en <strong>{VICARIATS_TOTAL} vicariats forains</strong> couvrant l&apos;ensemble du territoire.
            Chaque vicariat constitue un relais essentiel entre l&apos;administration diocésaine et les communautés locales de lecteurs juniors CDLJ.
          </p>
          <Link href="/nos-vicariats#carte">
            <button className="group relative inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-amber-900/20 transition-all hover:-translate-y-1 overflow-hidden">
              <span className="relative z-10">Voir la carte des vicariats</span>
              <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── WORKFLOW HIÉRARCHIQUE ──────────────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
            Structure organisationnelle
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            De l'Archidiocèse aux Lecteurs
          </h2>
        </div>

        <div className="flex flex-col items-center gap-0">
          {WORKFLOW.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-full max-w-xl">
              <div
                className={`w-full rounded-2xl ${step.color} px-8 py-5 flex items-center justify-between shadow-lg`}
                style={{ width: `${100 - i * 12}%` }}
              >
                <div>
                  <p className="font-extrabold text-lg leading-tight">{step.label}</p>
                  <p className="text-sm opacity-70 mt-0.5">{step.desc}</p>
                </div>
                <div className="text-right shrink-0 ml-6">
                  <p className="text-3xl font-black leading-none">{step.count}</p>
                  <p className="text-xs opacity-60 uppercase tracking-wider">{step.unit}</p>
                </div>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <div className="w-px h-6 bg-amber-300" />
                  <ArrowDown className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CARTE SCHÉMATIQUE ─────────────────────────────────── */}
      <section id="carte" className="py-16 px-4 md:px-8 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
              Vue territoriale
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Carte des {VICARIATS_TOTAL} vicariats forains
            </h2>
            <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">
              Répartition schématique des vicariats de l&apos;Archidiocèse de Cotonou. Cliquez sur un nœud pour explorer un vicariat et ses paroisses.
            </p>
          </div>
          <VicariatsMapWrapper />
        </div>
      </section>

      {/* ── LISTE DÉTAILLÉE DES VICARIATS ─────────────────────── */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full mb-4">
            Détail
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Les {VICARIATS_TOTAL} vicariats en détail
          </h2>
        </div>

        <div className="relative rounded-3xl p-px overflow-hidden bg-gradient-to-br from-amber-200/50 via-slate-200/40 to-blue-200/40 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 via-transparent to-blue-100/30 pointer-events-none" />
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px rounded-[calc(1.5rem-1px)] overflow-hidden">
          {VICARIATS.map((v) => (
            <Link
              key={v.id}
              href={`/nos-vicariats/${v.slug}`}
              className="group relative bg-white/75 backdrop-blur-sm p-6 flex flex-col transition-colors duration-300 hover:bg-white"
            >
              {/* Chiffre romain en filigrane */}
              <span className="pointer-events-none absolute top-3 right-4 text-5xl font-black text-slate-100 select-none transition-colors duration-300 group-hover:text-slate-200/80">
                {v.id}
              </span>

              {/* Pastille d'identité + label */}
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: v.hexColor }}
                />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Vicariat {v.id}
                </span>
              </div>

              {/* Nom + zone */}
              <div className="relative z-10 mb-5">
                <h3 className="text-slate-900 font-bold text-lg leading-tight tracking-tight">
                  {v.name}
                </h3>
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {v.zone}
                </p>
              </div>

              {/* Stats discrètes */}
              <div className="relative z-10 mt-auto flex items-center gap-5 text-sm">
                <span className="flex items-baseline gap-1.5">
                  <span className="font-bold text-slate-800">{v.paroisses}</span>
                  <span className="text-slate-400 text-xs">paroisses</span>
                </span>
                <span className="w-px h-4 bg-slate-200" />
                <span className="flex items-baseline gap-1.5">
                  <span className="font-bold text-slate-800">{v.lecteurs.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs">lecteurs</span>
                </span>
              </div>

              {/* Lien discret */}
              <div className="relative z-10 mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors group-hover:text-amber-900">
                Découvrir
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>

              {/* Liseré bas animé */}
              <span
                className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: v.hexColor }}
              />
            </Link>
          ))}
          </div>
        </div>
      </section>

    </div>
  );
}
