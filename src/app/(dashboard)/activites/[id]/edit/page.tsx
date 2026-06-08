"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FileEdit, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActiviteForm, type ActiviteFormInitial } from "@/modules/activites/components/ActiviteForm";

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

type ActiviteDetail = ActiviteFormInitial & {
  _id: string;
  terminee: boolean;
};

export default function EditActivitePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  const [activite, setActivite] = useState<ActiviteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !isManager || !id) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/activites/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Activité introuvable");
        if (!cancelled) {
          setActivite({
            ...data,
            _id: String(data._id),
            nom: data.nom ?? "",
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            lieu: data.lieu ?? "",
            montant: data.montant ?? 0,
            delaiPaiement: data.delaiPaiement,
            grillePenalite: data.grillePenalite ?? [],
            image: data.image,
            terminee: Boolean(data.terminee),
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
          setActivite(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, status, isManager]);

  if (status === "loading" || (isManager && loading)) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Accès réservé aux administrateurs diocésains.
      </div>
    );
  }

  if (error || !activite) {
    return (
      <DashboardPageShell
        title="Activité introuvable"
        description={error ?? "Cette activité n'existe pas ou a été supprimée."}
        actions={
          <Link
            href="/activites"
            title="Retour à la liste"
            aria-label="Retour à la liste"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-xl border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">
          Impossible de charger l&apos;activité.
        </div>
      </DashboardPageShell>
    );
  }

  if (activite.terminee) {
    return (
      <DashboardPageShell
        title="Modification impossible"
        description="Une activité terminée ne peut plus être modifiée."
        actions={
          <Link
            href="/activites"
            title="Retour à la liste"
            aria-label="Retour à la liste"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-xl border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">
          <p className="font-medium text-slate-700">{activite.nom}</p>
          <p className="mt-2 text-sm">Cette activité est clôturée.</p>
          <Link
            href={`/activites/${activite._id}`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 rounded-xl")}
          >
            Voir la fiche activité
          </Link>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Modifier l'activité"
      description="Mettez à jour les informations, la tarification et la grille de pénalités."
      actions={
        <Link
          href="/activites"
          title="Retour à la liste"
          aria-label="Retour à la liste"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "rounded-xl border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
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
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Édition</p>
              <h2 className="line-clamp-2 text-xl font-extrabold text-amber-50 sm:text-2xl">{activite.nom}</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-200/80">
                Ajustez la période, le lieu, le tarif, les pénalités et le visuel de l&apos;activité.
              </p>
            </div>
          </div>
        </div>

        <ActiviteForm
          key={activite._id}
          mode="edit"
          variant="page"
          activiteId={activite._id}
          initialData={activite}
          onCancel={() => router.push("/activites")}
          onSuccess={(message) => router.push(`/activites?toast=${encodeURIComponent(message)}`)}
        />
      </div>
    </DashboardPageShell>
  );
}
