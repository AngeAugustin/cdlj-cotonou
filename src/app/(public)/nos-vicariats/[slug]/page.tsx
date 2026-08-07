import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Church,
  MapPin,
  Users,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { VICARIATS, VICARIATS_DETAILS } from "@/lib/vicariats-data";
import { createPageMetadata, truncateDescription } from "@/lib/seo";
import { breadcrumbSchema, placeSchema } from "@/lib/seo-schemas";

export function generateStaticParams() {
  return VICARIATS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vicariat = VICARIATS.find((v) => v.slug === slug);
  const details = VICARIATS_DETAILS[slug];

  if (!vicariat || !details) {
    return createPageMetadata({
      title: "Vicariat introuvable",
      description: "Ce vicariat n'existe pas dans l'Archidiocèse de Cotonou.",
      path: `/nos-vicariats/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: vicariat.fullName,
    description: truncateDescription(
      `${details.description} Zone : ${vicariat.zone}. ${vicariat.paroisses} paroisses, ${vicariat.lecteurs.toLocaleString("fr-FR")} lecteurs CDLJ.`
    ),
    path: `/nos-vicariats/${vicariat.slug}`,
    keywords: [
      vicariat.name,
      vicariat.fullName,
      vicariat.zone,
      "vicariat forain Cotonou",
      "paroisses CDLJ",
      "lecteurs juniors Archidiocèse de Cotonou",
    ],
  });
}

export default async function VicariatDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vicariat = VICARIATS.find((v) => v.slug === slug);
  const details = VICARIATS_DETAILS[slug];

  if (!vicariat || !details) notFound();

  const totalEntites =
    details.paroissesList.length + (details.communautesList?.length ?? 0);
  const watermark = vicariat.name;
  const audience = [
    "Lecteurs juniors",
    "Animateurs",
    "Paroisses",
    ...(details.communautesList?.length ? ["Communautés"] : []),
  ];

  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Nos vicariats", path: "/nos-vicariats" },
            { name: vicariat.fullName, path: `/nos-vicariats/${vicariat.slug}` },
          ]),
          placeSchema({
            name: vicariat.fullName,
            description: details.description,
            path: `/nos-vicariats/${vicariat.slug}`,
            address: details.adresse,
            latitude: details.lat,
            longitude: details.lon,
            zone: vicariat.zone,
          }),
        ]}
      />

      {/* ── Hero (style Xinergi module) ───────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                linear-gradient(rgba(120, 53, 15, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120, 53, 15, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
            }}
          />
          <div className="absolute top-0 left-0 w-[36rem] h-[28rem] rounded-full bg-amber-200/30 blur-[100px]" />
          <div className="absolute top-24 right-0 w-[28rem] h-[24rem] rounded-full bg-orange-100/40 blur-[90px]" />
        </div>

        <div
          className="absolute left-0 top-[8%] pointer-events-none select-none"
          aria-hidden
        >
          <span className="block font-extrabold tracking-[-0.04em] text-[16vw] sm:text-[12vw] lg:text-[9rem] leading-none text-amber-950/[0.045] whitespace-nowrap pl-0">
            {watermark}
          </span>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/nos-vicariats"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-900 transition-colors mb-8 sm:mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux vicariats
          </Link>

          <div className="grid grid-cols-1 min-[700px]:grid-cols-2 gap-8 md:gap-10 lg:gap-14 items-start">
            <div>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-medium">
                Vicariat
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                {vicariat.name}
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed text-pretty">
                {details.description}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#paroisses"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Voir les paroisses
                </a>
                <a
                  href="#localisation"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Localisation
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Promesse — colonne droite (desktop) */}
            <div className="rounded-[2rem] bg-white border border-slate-100/80 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.18)] px-6 py-8 sm:px-8 sm:py-9">
              <div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-md shadow-amber-600/25"
                aria-hidden
              >
                <Church className="w-6 h-6 text-white" strokeWidth={2} />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Promesse
              </p>
              <p className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug text-balance">
                « {vicariat.paroisses} paroisses — au service de la Parole dans
                la zone {vicariat.zone}. »
              </p>

              <div className="mt-8 border-t border-slate-100 pt-7">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span className="text-sm font-semibold">Pour qui ?</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {audience.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1.5 text-sm text-slate-600"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">
        {/* ── PRÉSENTATION & PAROISSES ────────────────────────── */}
        <section id="paroisses">
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`w-1 h-6 rounded-full bg-gradient-to-b ${vicariat.color}`}
            />
            <h2 className="text-2xl font-extrabold text-slate-900">
              Paroisses & informations
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Church className="w-4 h-4 text-amber-700" />
                  Paroisses affiliées ({vicariat.paroisses})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {details.paroissesList.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl"
                    >
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                        style={{ background: vicariat.hexColor }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 font-medium leading-snug">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {details.communautesList && details.communautesList.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    Communautés Chrétiennes ({details.communautesList.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {details.communautesList.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-sm text-amber-900 font-medium">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Informations
                </h3>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Localisation</p>
                    <p className="font-semibold text-slate-800">
                      {details.localisation}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Church className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Entités pastorales</p>
                    <p className="font-semibold text-slate-800">
                      {vicariat.paroisses} paroisse
                      {vicariat.paroisses > 1 ? "s" : ""}
                      {(details.communautesList?.length ?? 0) > 0 && (
                        <span className="text-amber-700">
                          {" "}
                          + {details.communautesList!.length} CC
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Lecteurs CDLJ</p>
                    <p className="font-semibold text-slate-800">
                      {vicariat.lecteurs.toLocaleString()} lecteurs
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`bg-gradient-to-br ${vicariat.color} rounded-2xl p-5 text-white text-center`}
              >
                <p className="text-4xl font-black">{totalEntites}</p>
                <p className="text-white/70 text-xs uppercase tracking-wider mt-1">
                  entités pastorales
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOCALISATION ────────────────────────────────────── */}
        <section id="localisation">
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`w-1 h-6 rounded-full bg-gradient-to-b ${vicariat.color}`}
            />
            <h2 className="text-2xl font-extrabold text-slate-900">
              Localisation
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="md:col-span-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              style={{ height: "320px" }}
            >
              <iframe
                title={`Carte ${vicariat.name}`}
                width="100%"
                height="100%"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${details.lon - 0.04},${details.lat - 0.03},${details.lon + 0.04},${details.lat + 0.03}&layer=mapnik&marker=${details.lat},${details.lon}`}
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Coordonnées
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Adresse</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {details.adresse}
                  </p>
                </div>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${details.lat}&mlon=${details.lon}#map=14/${details.lat}/${details.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-amber-900 hover:text-amber-700 transition-colors pt-2 border-t border-slate-100"
              >
                <MapPin className="w-3.5 h-3.5" />
                Ouvrir dans OpenStreetMap
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
