"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Hash, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { LecteurForm } from "@/modules/lecteurs/components/LecteurForm";
import type { LecteurFormContext } from "@/modules/lecteurs/formContext";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CREATE_ROLES = ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"];

export default function NewLecteurPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const canCreate = roles.some((r) => CREATE_ROLES.includes(r));

  const [formContext, setFormContext] = useState<LecteurFormContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!canCreate) {
      setLoadingContext(false);
      return;
    }

    let cancelled = false;
    setLoadingContext(true);
    setLoadError(null);

    fetch("/api/lecteurs/form-context")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Impossible de charger le formulaire");
        return data as LecteurFormContext;
      })
      .then((data) => {
        if (!cancelled) setFormContext(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
          setFormContext(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, canCreate]);

  if (status === "loading" || loadingContext) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Vous n&apos;avez pas l&apos;autorisation d&apos;inscrire un lecteur.
      </div>
    );
  }

  if (loadError || !formContext) {
    return (
      <DashboardPageShell
        title="Enregistrer un lecteur"
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
            {loadError ?? "Impossible de préparer le formulaire."}
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

  return (
    <DashboardPageShell
      title="Enregistrer un lecteur"
      description="Renseignez les informations prévues par le référentiel. Le numéro unique est généré automatiquement à l'enregistrement."
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
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-800/20 shadow-xl shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
          <div className="relative flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-7">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
              <UserPlus className="h-7 w-7 text-amber-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Nouvelle fiche</p>
              <h2 className="text-xl font-extrabold text-amber-50 sm:text-2xl">Création d&apos;un lecteur</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-200/80">
                Identité, parcours scolaire, rattachement paroissial et contacts — complétez les étapes du formulaire
                ci-dessous.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-950/40 px-4 py-3 backdrop-blur-sm">
              <Hash className="h-4 w-4 text-amber-300/70" />
              <span className="text-xs font-medium text-amber-200/80">Numéro auto-généré</span>
            </div>
          </div>
        </div>

        <LecteurForm
          mode="create"
          variant="page"
          vicariats={formContext.vicariats}
          paroisses={formContext.paroisses}
          lockParishVicariat={formContext.lockParishVicariat}
        />
      </div>
    </DashboardPageShell>
  );
}
