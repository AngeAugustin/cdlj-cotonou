"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FileEdit, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArticleForm, type Actualite } from "@/modules/actualites/components/ArticleForm";

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

export default function EditActualitePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");

  const [article, setArticle] = useState<Actualite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin || !id) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/actualites/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Article introuvable");
        }
        const data = await res.json();
        if (!cancelled) setArticle({ ...data, _id: String(data._id) });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
          setArticle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, status, isAdmin]);

  if (status === "loading" || (isAdmin && loading)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-3" /> Chargement…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Accès réservé aux administrateurs diocésains.
      </div>
    );
  }

  if (error || !article) {
    return (
      <DashboardPageShell
        title="Article introuvable"
        description={error ?? "Cet article n'existe pas ou a été supprimé."}
        actions={
          <Link
            href="/actualites"
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
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">
          Impossible de charger l&apos;article.
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Modifier l'article"
      description="Modifiez le contenu puis enregistrez ou publiez."
      actions={
        <Link
          href="/actualites"
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
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Édition</p>
              <h2 className="text-xl font-extrabold text-amber-50 sm:text-2xl line-clamp-2">{article.title}</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-200/80">
                Mettez à jour le titre, le résumé, le contenu et les paramètres de publication de l&apos;article.
              </p>
            </div>
          </div>
        </div>

        <ArticleForm
          key={article._id}
          editItem={article}
          onCancel={() => router.push("/actualites")}
          onSuccess={(message) => router.push(`/actualites?toast=${encodeURIComponent(message)}`)}
          onError={(message) => router.push(`/actualites?toast=${encodeURIComponent(message)}&type=error`)}
        />
      </div>
    </DashboardPageShell>
  );
}
