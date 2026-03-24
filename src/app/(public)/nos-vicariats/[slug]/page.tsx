import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Church, Users, Mail,
  Phone, Calendar, ChevronRight, Camera
} from "lucide-react";
import { VICARIATS, VICARIATS_DETAILS } from "@/lib/vicariats-data";

export function generateStaticParams() {
  return VICARIATS.map((v) => ({ slug: v.slug }));
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

  const totalEntites = details.paroissesList.length + (details.communautesList?.length ?? 0);

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${vicariat.color} py-20 px-4 md:px-8 overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-white/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/nos-vicariats"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux vicariats
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-white/60 text-xs font-black uppercase tracking-widest">
                Vicariat Forain {vicariat.id}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-1 leading-tight">
                {vicariat.fullName}
              </h1>
              <p className="text-white/70 mt-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {vicariat.zone}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{vicariat.paroisses}</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">Paroisses</p>
              </div>
              {(details.communautesList?.length ?? 0) > 0 && (
                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                  <p className="text-2xl font-black text-white">{details.communautesList!.length}</p>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Communautés</p>
                </div>
              )}
              <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{vicariat.lecteurs.toLocaleString()}</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">Lecteurs</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{details.founded}</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">Fondé en</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 space-y-16">

        {/* ── PRÉSENTATION & PAROISSES ────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-1 h-6 rounded-full bg-gradient-to-b ${vicariat.color}`} />
            <h2 className="text-2xl font-extrabold text-slate-900">Présentation</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <p className="text-slate-600 leading-relaxed text-base">{details.description}</p>
              </div>

              {/* Paroisses */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Church className="w-4 h-4 text-amber-700" />
                  Paroisses affiliées ({vicariat.paroisses})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {details.paroissesList.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                        style={{ background: vicariat.hexColor }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 font-medium leading-snug">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communautés chrétiennes */}
              {details.communautesList && details.communautesList.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    Communautés Chrétiennes ({details.communautesList.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {details.communautesList.map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-sm text-amber-900 font-medium">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Informations</h3>
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Année de fondation</p>
                    <p className="font-semibold text-slate-800">{details.founded}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Localisation</p>
                    <p className="font-semibold text-slate-800">{details.localisation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Church className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Entités pastorales</p>
                    <p className="font-semibold text-slate-800">
                      {vicariat.paroisses} paroisse{vicariat.paroisses > 1 ? "s" : ""}
                      {(details.communautesList?.length ?? 0) > 0 && (
                        <span className="text-amber-700"> + {details.communautesList!.length} CC</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-xs">Lecteurs CDLJ</p>
                    <p className="font-semibold text-slate-800">{vicariat.lecteurs.toLocaleString()} lecteurs</p>
                  </div>
                </div>
              </div>

              {/* Stat bulle */}
              <div
                className={`bg-gradient-to-br ${vicariat.color} rounded-2xl p-5 text-white text-center`}
              >
                <p className="text-4xl font-black">{totalEntites}</p>
                <p className="text-white/70 text-xs uppercase tracking-wider mt-1">entités pastorales</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOCALISATION ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-1 h-6 rounded-full bg-gradient-to-b ${vicariat.color}`} />
            <h2 className="text-2xl font-extrabold text-slate-900">Localisation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "320px" }}>
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
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Coordonnées</h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Adresse</p>
                  <p className="text-sm font-semibold text-slate-800">{details.adresse}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Téléphone</p>
                  <p className="text-sm font-semibold text-slate-800">+229 00 00 00 00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-slate-800 break-all">
                    vicariat{vicariat.id.toLowerCase()}@cdlj-cotonou.org
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

        {/* ── ÉQUIPE VICARIALE ────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-1 h-6 rounded-full bg-gradient-to-b ${vicariat.color}`} />
            <h2 className="text-2xl font-extrabold text-slate-900">Équipe Vicariale</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {details.equipe.map((m, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white font-black text-lg ring-2 ring-white shadow-md group-hover:scale-105 transition-transform duration-300`}
                  >
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-slate-900 font-extrabold text-sm leading-tight">{m.name}</h3>
                <span className="text-amber-700 text-xs font-bold uppercase tracking-wider mt-1">{m.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-200">
          <Link
            href="/nos-vicariats"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Tous les vicariats
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-amber-900 hover:bg-amber-800 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 shadow-md"
          >
            Accéder au portail <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
