"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Activity, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActiviteForm } from "@/modules/activites/components/ActiviteForm";

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

export default function NewActivitePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  if (status === "loading") {
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

  return (
    <DashboardPageShell
      title="Créer une activité"
      description="Renseignez les informations de l'activité : dates, lieu, tarif, délai de paiement et visuel."
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
              <Activity className="h-7 w-7 text-amber-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Nouvelle activité</p>
              <h2 className="text-xl font-extrabold text-amber-50 sm:text-2xl">Planifier une activité diocésaine</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-200/80">
                Définissez la période, le lieu et les conditions de participation. Les vicariats pourront ensuite
                inscrire les lecteurs de leurs paroisses.
              </p>
            </div>
          </div>
        </div>

        <ActiviteForm
          mode="create"
          variant="page"
          onCancel={() => router.push("/activites")}
          onSuccess={(message) => router.push(`/activites?toast=${encodeURIComponent(message)}`)}
        />
      </div>
    </DashboardPageShell>
  );
}
