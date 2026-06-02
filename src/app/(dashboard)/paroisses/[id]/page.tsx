"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Building2,
  Church,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Vicariat = { _id: string; name: string; abbreviation: string };

type Paroisse = {
  _id: string;
  name: string;
  cureName?: string;
  coordonnateur?: string;
  logo?: string;
  vicariatId: string;
  vicariat?: Vicariat;
  lecteurCount: number;
};

type Lecteur = {
  _id: string;
  nom: string;
  prenoms: string;
  uniqueId: string;
  sexe: "M" | "F";
  gradeId?: { name: string; abbreviation: string } | null;
};

export default function ParoisseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paroisseId } = usePromise(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [paroisse, setParoisse] = useState<Paroisse | null>(null);
  const [lecteurs, setLecteurs] = useState<Lecteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [lecteursLoading, setLecteursLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading" || !paroisseId) return;

    let cancelled = false;
    setLoading(true);
    setLecteursLoading(true);
    setLoadError(null);

    void fetch(`/api/paroisses/${encodeURIComponent(paroisseId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Paroisse introuvable");
        if (!cancelled) setParoisse(data as Paroisse);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Erreur de chargement");
          setParoisse(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    void fetch(`/api/lecteurs?paroisseId=${encodeURIComponent(paroisseId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ([]));
        if (!cancelled) setLecteurs(Array.isArray(data) ? (data as Lecteur[]) : []);
      })
      .catch(() => {
        if (!cancelled) setLecteurs([]);
      })
      .finally(() => {
        if (!cancelled) setLecteursLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, paroisseId]);

  const filteredLecteurs = useMemo(() => {
    if (!searchQuery.trim()) return lecteurs;
    const q = searchQuery.toLowerCase();
    return lecteurs.filter(
      (l) =>
        `${l.nom} ${l.prenoms}`.toLowerCase().includes(q) ||
        l.uniqueId.toLowerCase().includes(q) ||
        (l.gradeId?.name ?? "").toLowerCase().includes(q) ||
        (l.gradeId?.abbreviation ?? "").toLowerCase().includes(q)
    );
  }, [lecteurs, searchQuery]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (loadError || !paroisse) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => router.push("/paroisses")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux paroisses
        </Button>
        <div className="rounded-3xl border border-red-100 bg-white p-8 text-red-800 shadow-sm">
          {loadError ?? "Paroisse introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-5">
          <Button
            variant="outline"
            className="inline-flex h-9 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            onClick={() => router.push("/paroisses")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Retour
          </Button>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 text-amber-900 shadow-sm">
            {paroisse.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paroisse.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 opacity-40" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70">Fiche paroisse</p>
              <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{paroisse.name}</h1>
              {paroisse.vicariat?.name ? (
                <p className="mt-1 text-sm text-slate-500">
                  {paroisse.vicariat.abbreviation ? `${paroisse.vicariat.abbreviation} · ` : ""}
                  {paroisse.vicariat.name}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Curé</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{paroisse.cureName || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Coordonnateur</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{paroisse.coordonnateur || "—"}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700/70">Lecteurs inscrits</p>
                <p className="mt-0.5 text-sm font-bold text-amber-950">{paroisse.lecteurCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-900" />
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">Lecteurs de la paroisse</h2>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule ou grade…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-all focus:border-amber-900/20 focus:ring-2 focus:ring-amber-900/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          {lecteursLoading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-900" />
              <span className="font-medium text-slate-500">Chargement des lecteurs…</span>
            </div>
          ) : filteredLecteurs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Church className="h-12 w-12 text-slate-200" />
              <p className="font-medium text-slate-500">
                {searchQuery
                  ? "Aucun lecteur ne correspond à la recherche."
                  : "Aucun lecteur enregistré dans cette paroisse."}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                {filteredLecteurs.length} lecteur{filteredLecteurs.length > 1 ? "s" : ""}
                {searchQuery ? " trouvé(s)" : ""}
              </p>
              <div className="space-y-2">
                {filteredLecteurs.map((l) => (
                  <Link
                    key={l._id}
                    href={`/lecteurs/${l._id}`}
                    className="flex items-center gap-4 rounded-xl border border-transparent bg-slate-50 p-3.5 transition-all hover:border-amber-100 hover:bg-amber-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-extrabold text-amber-900">
                      {l.nom.charAt(0)}
                      {l.prenoms.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold leading-tight text-slate-900">
                        {l.nom} {l.prenoms}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{l.uniqueId}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {l.gradeId ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {l.gradeId.abbreviation ?? l.gradeId.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium italic text-slate-400">Sans grade</span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">{l.sexe}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
