import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, Hash, UserPlus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { LecteurForm } from "@/modules/lecteurs/components/LecteurForm";
import connectToDatabase from "@/lib/mongoose";
import { Vicariat } from "@/modules/vicariats/model";
import { Paroisse } from "@/modules/paroisses/model";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

export default async function NewLecteurPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { roles?: string[]; parishId?: string; vicariatId?: string } | undefined;
  const roles: string[] = user?.roles ?? [];
  const isParoissial = roles.includes("PAROISSIAL");

  await connectToDatabase();

  let vicariats: { _id: string; name: string }[] = [];
  let paroisses: { _id: string; name: string; vicariatId: string }[] = [];

  if (isParoissial && user?.vicariatId && user?.parishId) {
    const [vList, pList] = await Promise.all([
      Vicariat.find({ _id: user.vicariatId }).sort({ name: 1 }).lean(),
      Paroisse.find({ _id: user.parishId }).sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: v._id.toString(), name: v.name }));
    paroisses = pList.map((p) => ({ _id: p._id.toString(), name: p.name, vicariatId: String(p.vicariatId) }));
  } else {
    const [vList, pList] = await Promise.all([
      Vicariat.find().sort({ name: 1 }).lean(),
      Paroisse.find().sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: v._id.toString(), name: v.name }));
    paroisses = pList.map((p) => ({ _id: p._id.toString(), name: p.name, vicariatId: String(p.vicariatId) }));
  }

  const lockParishVicariat =
    isParoissial && user?.parishId && user?.vicariatId
      ? {
          paroisseId: String(user.parishId),
          vicariatId: String(user.vicariatId),
          paroisseName: paroisses[0]?.name,
          vicariatName: vicariats[0]?.name,
        }
      : undefined;

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
          <ArrowLeft className="w-4 h-4" />
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-800/20 shadow-xl shadow-amber-900/10">
          {HERO_AMBER_BG}
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
          vicariats={vicariats}
          paroisses={paroisses}
          lockParishVicariat={lockParishVicariat}
        />
      </div>
    </DashboardPageShell>
  );
}
