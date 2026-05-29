"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediathequeForm } from "@/modules/mediatheque/components/MediathequeForm";

export default function NewMediathequePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-3" /> Chargement…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Accès réservé aux Super Admin et Diocésains.
      </div>
    );
  }

  return (
    <DashboardPageShell
      title="Nouvelle médiathèque"
      description="Renseignez les informations de l'album et le lien d'hébergement de vos fichiers."
      actions={
        <Link
          href="/gestion-mediatheque"
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-xl")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      }
    >
      <div className="relative overflow-hidden rounded-3xl border border-amber-800/20 shadow-xl shadow-amber-900/10 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
        <div className="relative flex items-center gap-4 px-6 py-6 sm:px-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
            <ImageIcon className="h-7 w-7 text-amber-200" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Création</p>
            <h2 className="text-xl font-extrabold text-amber-50">Nouvelle médiathèque</h2>
          </div>
        </div>
      </div>

      <MediathequeForm
        onCancel={() => router.push("/gestion-mediatheque")}
        onSuccess={(message) => router.push(`/gestion-mediatheque?toast=${encodeURIComponent(message)}`)}
        onError={(message) => router.push(`/gestion-mediatheque?toast=${encodeURIComponent(message)}&type=error`)}
      />
    </DashboardPageShell>
  );
}
