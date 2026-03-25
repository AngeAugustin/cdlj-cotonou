"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Calendar, MapPin, Phone, Hash,
  Church, Activity, User, ShieldCheck, HeartPulse,
  GraduationCap, BookOpen, PhoneCall, Map, BadgeCheck,
  Clock, CheckCircle2, Hourglass, AlertTriangle, Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  type ApiLecteur, type ParticipationRow,
  displayAvatarSrc, displayIdPhotoSrc,
  formatDateFr, gradeLabel, lecteurInitials, rattachementLines,
} from "@/modules/lecteurs/lecteurViewUtils";
import { LecteurCarteMembre } from "@/modules/lecteurs/components/LecteurCarteMembre";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function calcAge(value: unknown): number | null {
  if (!value) return null;
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
  ) age--;
  return age;
}

function formatDateShort(value: unknown): string {
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type LecteurEvaluationPublished = {
  evaluationId: string;
  nom: string;
  annee: number;
  nombreNotes: number;
  grade: { name: string; abbreviation: string; level: number };
  gradeAffecte: { name: string; abbreviation: string; level: number };
  activite: { nom: string; dateDebut: string | Date; dateFin: string | Date; lieu: string; montant?: number; image?: string };
  terminee: boolean;
  publiee: boolean;
  moyenne?: number;
  decision?: "PROMU" | "MAINTENU" | string;
  notes: Array<{ noteIndex: number; valeur?: number; validated: boolean }>;
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────
function StatChip({
  label, value, icon: Icon, accent = false,
}: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 px-4 py-3 rounded-2xl min-w-[80px] shadow-sm
      ${accent
        ? "bg-amber-900 border border-amber-800"
        : "bg-white border border-slate-200"}`}>
      <Icon className={`w-4 h-4 mb-0.5 ${accent ? "text-amber-300" : "text-amber-700"}`} />
      <span className={`text-xl font-extrabold leading-none ${accent ? "text-white" : "text-slate-800"}`}>
        {value}
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${accent ? "text-amber-300/80" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function InfoCard({
  icon: Icon, label, children, className = "", color = "amber",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
  color?: "amber" | "blue" | "green" | "red";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue:  "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    red:   "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <div className={`group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/80 hover:shadow-md hover:shadow-slate-200/60 transition-all ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <div className="text-sm font-semibold text-slate-800 leading-snug">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-900/10">
        <Icon className="w-4 h-4 text-amber-900" />
      </span>
      <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{children}</h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Activity Timeline item
// ─────────────────────────────────────────────────────────
function ActivityTimelineItem({ h }: { h: ParticipationRow }) {
  if (!h.activite) {
    return (
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="w-0.5 h-full bg-slate-100 mt-2 min-h-[24px]" />
        </div>
        <div className="pb-6 pt-0.5">
          <p className="text-sm text-slate-400 italic">Activité supprimée</p>
        </div>
      </div>
    );
  }

  const { activite } = h;
  return (
    <div className="flex gap-4 items-start group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-2 transition-transform group-hover:scale-110
          ${activite.terminee
            ? "bg-slate-100 border-slate-200 text-slate-500"
            : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          {activite.terminee
            ? <CheckCircle2 className="w-4 h-4" />
            : <Hourglass className="w-4 h-4" />}
        </div>
        <div className="w-0.5 flex-1 bg-slate-100 mt-2 min-h-[24px]" />
      </div>

      {/* Card */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100/60 p-4 hover:shadow-md hover:shadow-slate-200/60 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="font-bold text-slate-900 text-sm leading-tight">{activite.nom}</p>
            <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border
              ${activite.terminee
                ? "bg-slate-50 text-slate-500 border-slate-200"
                : "bg-green-50 text-green-700 border-green-200"}`}>
              {activite.terminee ? "Terminée" : "En cours"}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              {formatDateShort(activite.dateDebut)} → {formatDateShort(activite.dateFin)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              {activite.lieu}
            </span>
            {activite.montant !== undefined && (
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                {activite.montant.toLocaleString("fr-FR")} FCFA
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-50 pt-2.5">
            <Clock className="w-3 h-3" />
            Participation enregistrée le {formatDateShort(h.paidAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────
export default function LecteurDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [lecteur, setLecteur] = useState<ApiLecteur | null>(null);
  const [history, setHistory]  = useState<ParticipationRow[]>([]);
  const [evaluations, setEvaluations] = useState<LecteurEvaluationPublished[]>([]);
  const [loading, setLoading]  = useState(() => !id);
  const [error, setError]      = useState<string | null>(() => (!id ? "Identifiant manquant" : null));
  const [tab, setTab]          = useState<"infos" | "activites" | "evaluations">("infos");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/lecteurs/${id}`);
        const data = (await r.json().catch(() => ({}))) as {
          error?: string; lecteur?: ApiLecteur; history?: ParticipationRow[];
        };
        if (cancelled) return;

        if (!r.ok) { setError(data.error ?? "Impossible de charger la fiche"); return; }
        if (!data.lecteur) { setError("Fiche introuvable"); return; }

        setLecteur(data.lecteur);
        setHistory(Array.isArray(data.history) ? data.history : []);

        // Chargement séparé des évaluations publiées (best-effort).
        void fetch(`/api/lecteurs/${id}/evaluations`)
          .then(async (er) => {
            if (!er.ok) return;
            const evData = await er.json().catch(() => []);
            if (cancelled) return;
            setEvaluations(Array.isArray(evData) ? (evData as LecteurEvaluationPublished[]) : []);
          })
          .catch(() => { /* best-effort */ });
      } catch {
        if (!cancelled) setError("Erreur réseau");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-900/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
          </div>
          <p className="text-sm font-medium text-slate-500">Chargement de la fiche…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="font-bold text-slate-800 mb-1">{error}</p>
        <Link href="/lecteurs" className="text-sm text-amber-800 underline">Retour à la liste</Link>
      </div>
    );
  }

  if (!lecteur) return null;

  const avatarSrc  = displayAvatarSrc(lecteur);
  const idPhotoSrc = displayIdPhotoSrc(lecteur);
  const initials   = lecteurInitials(lecteur);
  const age        = calcAge(lecteur.dateNaissance);
  const { vicariat, paroisse } = rattachementLines(lecteur);
  const grade      = gradeLabel(lecteur);

  return (
    <div className="min-h-screen pb-16">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl mb-8
                      bg-gradient-to-br from-amber-50/80 via-white/60 to-slate-50/40
                      border border-slate-200/60 shadow-sm">

        {/* Subtle decorative glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/10 blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-amber-100/30 blur-[60px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        </div>

        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">

          {/* Retour (gauche) · Carte (droite) */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/lecteurs"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition-all hover:bg-white hover:text-slate-800 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour à la liste
            </Link>
            <div className="flex w-full justify-end sm:w-auto sm:justify-start">
              <LecteurCarteMembre lecteur={lecteur} showHelperText={false} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-8">

            {/* Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 min-w-0">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-xl scale-125" />
                <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl shadow-amber-900/10 ring-1 ring-slate-200/60">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt="" className="object-cover" />}
                  <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-900 text-white font-extrabold text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm
                  ${lecteur.sexe === "M" ? "bg-blue-400" : "bg-pink-400"}`} title={lecteur.sexe === "M" ? "Masculin" : "Féminin"} />
              </div>

              {/* Name block */}
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-amber-700/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                  Fiche Lecteur
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
                  {lecteur.prenoms} {lecteur.nom}
                </h1>

                {/* Unique ID */}
                <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-mono text-sm font-bold text-amber-800 tracking-widest">{lecteur.uniqueId}</span>
                </div>

                {/* Grade + Paroisse pills */}
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {grade !== "—" && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {grade}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                    <Church className="w-3.5 h-3.5 text-amber-700" />
                    {paroisse}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                    <Map className="w-3.5 h-3.5 text-amber-700" />
                    {vicariat}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-3 shrink-0">
              {age !== null && (
                <StatChip icon={User} label="Âge" value={`${age} ans`} accent />
              )}
              <StatChip icon={Calendar} label="Adhésion" value={lecteur.anneeAdhesion} />
              <StatChip icon={Activity} label="Activités" value={history.length} />
              <StatChip icon={GraduationCap} label="Niveau" value={lecteur.niveau.length > 8 ? lecteur.niveau.slice(0, 7) + "…" : lecteur.niveau} />
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      {/* ── TABS ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-8">
        {([
          { key: "infos",     label: "Informations",       icon: User },
          { key: "activites", label: `Activités (${history.length})`, icon: Activity },
          { key: "evaluations", label: `Évaluations (${evaluations.length})`, icon: GraduationCap },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${tab === key
                ? "bg-white text-amber-900 shadow-sm shadow-slate-200/60"
                : "text-slate-500 hover:text-slate-700"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      {tab === "infos" ? (

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT: Info cards ── */}
          <div className="space-y-6 min-w-0">

            {/* Section: Identité */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/80 p-6">
              <SectionTitle icon={User}>Informations personnelles</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <InfoCard icon={Calendar} label="Date de naissance">
                  {formatDateFr(lecteur.dateNaissance)}
                  {age !== null && (
                    <span className="ml-2 text-xs font-medium text-slate-400">({age} ans)</span>
                  )}
                </InfoCard>

                <InfoCard icon={ShieldCheck} label="Sexe" color="blue">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-0.5 rounded-lg
                    ${lecteur.sexe === "M" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                    {lecteur.sexe === "M" ? "♂ Masculin" : "♀ Féminin"}
                  </span>
                </InfoCard>

                <InfoCard icon={BookOpen} label="Niveau scolaire / professionnel" color="green">
                  {lecteur.niveau}
                  {lecteur.details && (
                    <span className="block text-slate-500 font-medium text-xs mt-1">{lecteur.details}</span>
                  )}
                </InfoCard>

                <InfoCard icon={Hash} label="Année d'adhésion">
                  {lecteur.anneeAdhesion}
                </InfoCard>
              </div>
            </div>

            {/* Section: Contact & Localisation */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/80 p-6">
              <SectionTitle icon={Phone}>Contact & Localisation</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <InfoCard icon={Phone} label="Téléphone">
                  <a href={`tel:${lecteur.contact}`} className="hover:text-amber-800 transition-colors">
                    {lecteur.contact}
                  </a>
                </InfoCard>

                <InfoCard icon={PhoneCall} label="Contact d'urgence" color="red">
                  <a href={`tel:${lecteur.contactUrgence}`} className="hover:text-red-700 transition-colors">
                    {lecteur.contactUrgence}
                  </a>
                </InfoCard>

                <InfoCard icon={MapPin} label="Adresse" className="sm:col-span-2">
                  {lecteur.adresse}
                </InfoCard>
              </div>
            </div>

            {/* Section: Maux particuliers */}
            {lecteur.maux && (
              <div className="bg-amber-50 rounded-3xl border border-amber-200/60 shadow-sm p-6">
                <SectionTitle icon={HeartPulse}>Maux particuliers</SectionTitle>
                <p className="text-sm text-amber-900/80 leading-relaxed bg-white/60 rounded-2xl px-4 py-3 border border-amber-100">
                  {lecteur.maux}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Photo d'identité (sticky) ── */}
          <aside className="xl:sticky xl:top-6 h-fit space-y-5">

            {/* Grade card */}
            <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-3xl p-5 text-white shadow-lg shadow-amber-900/20">
              <p className="text-amber-400/70 text-[10px] font-bold uppercase tracking-widest mb-3">Grade actuel</p>
              {grade !== "—" ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-white">{grade}</p>
                    <p className="text-amber-400/70 text-xs">Niveau atteint</p>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm italic">Aucun grade assigné</p>
              )}
            </div>

            {/* Photo ID card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/80 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Photo d&apos;identité
              </p>
              {idPhotoSrc ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img
                      src={idPhotoSrc}
                      alt="Photo d'identité"
                      className="w-full object-contain max-h-72 mx-auto"
                    />
                  </div>
                  <a
                    href={idPhotoSrc}
                    download
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium text-center">
                    Aucune photo<br />enregistrée
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

      ) : tab === "activites" ? (

        /* ── TAB ACTIVITÉS ── */
        <div className="max-w-2xl">

          {history.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-bold text-slate-700 mb-1">Aucune participation</p>
              <p className="text-sm text-slate-400">Ce lecteur n&apos;a pas encore participé à une activité.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <SectionTitle icon={Activity}>
                Historique des participations ({history.length})
              </SectionTitle>
              <div className="mt-4">
              {history.map((h, i) => (
                <ActivityTimelineItem key={i} h={h} />
              ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── TAB ÉVALUATIONS ── */
        <div className="max-w-3xl">
          {evaluations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-bold text-slate-700 mb-1">Aucune évaluation publiée</p>
              <p className="text-sm text-slate-400">Les résultats apparaîtront ici après publication.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <SectionTitle icon={GraduationCap}>Évaluations annuelles ({evaluations.length})</SectionTitle>
              <div className="space-y-4">
                {evaluations.map((ev) => (
                  <div key={ev.evaluationId} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-base truncate">
                          {ev.nom} · {ev.annee}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {ev.grade.abbreviation} · {formatDateShort(ev.activite.dateDebut)} → {formatDateShort(ev.activite.dateFin)}
                        </p>
                      </div>
                      {typeof ev.moyenne === "number" ? (
                        <span className="inline-flex items-center gap-2 self-start md:self-auto px-3 py-1 rounded-full border border-amber-100 bg-amber-50 text-amber-900 text-xs font-bold">
                          Moyenne {ev.moyenne.toFixed(2)}/10
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {ev.notes.map((n) => (
                        <span
                          key={`${ev.evaluationId}:${n.noteIndex}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
                        >
                          N{n.noteIndex}: {typeof n.valeur === "number" ? n.valeur.toFixed(1) : "—"}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {(() => {
                        const badge =
                          ev.decision === "PROMU"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200";

                        const label = ev.decision === "PROMU" ? "Promu" : "Maintenu";

                        return (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold ${badge}`}
                          >
                            {label} → {ev.gradeAffecte.abbreviation}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
