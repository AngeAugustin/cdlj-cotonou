"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FileEdit, Hash, Loader2, AlertCircle } from "lucide-react";
import type { LecteurFormInitial } from "@/modules/lecteurs/components/LecteurForm";
import type { LecteurFormContext } from "@/modules/lecteurs/formContext";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditLecteurFormClient } from "./EditLecteurFormClient";

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

const EDIT_ROLES = ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"];

function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as { _id: unknown })._id);
  return "";
}

function refName(v: unknown): string | undefined {
  if (v && typeof v === "object" && "name" in v) {
    const name = (v as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}

type EditPageState = {
  lecteur: LecteurFormInitial & { nom?: string; prenoms?: string; uniqueId?: string };
  lockGradeId: boolean;
  vicariats: { _id: string; name: string }[];
  paroisses: { _id: string; name: string; vicariatId: string }[];
  lockParishVicariat?: {
    paroisseId: string;
    vicariatId: string;
    paroisseName?: string;
    vicariatName?: string;
  };
};

export default function EditLecteurPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const canEdit = roles.some((r) => EDIT_ROLES.includes(r));
  const isParoissial = roles.includes("PAROISSIAL");
  const isVicarial = roles.includes("VICARIAL");

  const [state, setState] = useState<EditPageState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !canEdit || !id) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const [lecteurRes, evalRes, contextRes] = await Promise.all([
          fetch(`/api/lecteurs/${id}`),
          fetch(`/api/lecteurs/${id}/evaluations/concerned`),
          !isParoissial && !isVicarial ? fetch("/api/lecteurs/form-context") : Promise.resolve(null),
        ]);

        const lecteurData = await lecteurRes.json().catch(() => ({}));
        if (!lecteurRes.ok) throw new Error(lecteurData.error ?? "Lecteur introuvable");

        const evalData = await evalRes.json().catch(() => ({}));
        if (!evalRes.ok) throw new Error(evalData.error ?? "Impossible de vérifier les évaluations");

        let vicariats: { _id: string; name: string }[] = [];
        let paroisses: { _id: string; name: string; vicariatId: string }[] = [];
        let lockParishVicariat: EditPageState["lockParishVicariat"];

        const lecteur = lecteurData.lecteur as EditPageState["lecteur"];

        if (isParoissial || isVicarial) {
          lockParishVicariat = {
            paroisseId: refId(lecteur.paroisseId),
            vicariatId: refId(lecteur.vicariatId),
            paroisseName: refName(lecteur.paroisseId),
            vicariatName: refName(lecteur.vicariatId),
          };
        } else if (contextRes) {
          const contextData = await contextRes.json().catch(() => ({}));
          if (!contextRes.ok) throw new Error(contextData.error ?? "Impossible de charger le formulaire");
          const ctx = contextData as LecteurFormContext;
          vicariats = ctx.vicariats ?? [];
          paroisses = ctx.paroisses ?? [];
        }

        if (!cancelled) {
          setState({
            lecteur,
            lockGradeId: Boolean(evalData.hasEvaluations),
            vicariats,
            paroisses,
            lockParishVicariat,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
          setState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, status, canEdit, isParoissial, isVicarial]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Vous n&apos;avez pas l&apos;autorisation de modifier ce lecteur.
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <DashboardPageShell
        title="Modifier le lecteur"
        actions={
          <Link
            href="/lecteurs"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-xl border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      >
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-6 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="max-w-md text-sm font-medium text-red-800">
            {loadError ?? "Impossible de charger le formulaire de modification."}
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Réessayer
          </button>
        </div>
      </DashboardPageShell>
    );
  }

  const { lecteur, lockGradeId, vicariats, paroisses, lockParishVicariat } = state;
  const fullName = `${lecteur.nom ?? ""} ${lecteur.prenoms ?? ""}`.trim();

  return (
    <DashboardPageShell
      title="Modifier le lecteur"
      description="Mettez à jour les informations du lecteur via les étapes du formulaire."
      actions={
        <Link
          href="/lecteurs"
          title="Retour à la liste"
          aria-label="Retour à la liste"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "rounded-xl border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-800/20 shadow-xl shadow-amber-900/10">
          {HERO_AMBER_BG}
          <div className="relative flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-7">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
              <FileEdit className="h-7 w-7 text-amber-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Fiche lecteur</p>
              <h2 className="truncate text-xl font-extrabold text-amber-50 sm:text-2xl">
                {fullName || "Modification du lecteur"}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-200/80">
                Identité, parcours scolaire, rattachement paroissial et contacts — mettez à jour les informations
                ci-dessous.
              </p>
            </div>
            {lecteur.uniqueId ? (
              <div className="shrink-0 rounded-2xl border border-amber-400/20 bg-amber-950/40 px-4 py-3 text-center backdrop-blur-sm">
                <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/70">
                  <Hash className="h-3.5 w-3.5" />
                  N° lecteur
                </p>
                <p className="mt-1 text-lg font-black tabular-nums text-amber-50">{lecteur.uniqueId}</p>
              </div>
            ) : null}
          </div>
        </div>

        <EditLecteurFormClient
          lecteurId={id}
          initialData={lecteur}
          lockParishVicariat={lockParishVicariat}
          lockGradeId={lockGradeId}
          vicariats={lockParishVicariat ? [] : vicariats}
          paroisses={lockParishVicariat ? [] : paroisses}
        />
      </div>
    </DashboardPageShell>
  );
}
