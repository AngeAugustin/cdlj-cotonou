import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, FileEdit, Hash } from "lucide-react";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import { Vicariat } from "@/modules/vicariats/model";
import { Paroisse } from "@/modules/paroisses/model";
import { LecteurService } from "@/modules/lecteurs/service";
import { EvaluationService } from "@/modules/evaluations/service";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";
import type { LecteurFormInitial } from "@/modules/lecteurs/components/LecteurForm";
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

function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as { _id: unknown })._id);
  return "";
}

function canAccessLecteur(
  user: { roles?: string[]; parishId?: string; vicariatId?: string },
  lecteur: Record<string, unknown>
) {
  const roles: string[] = user.roles ?? [];
  if (roles.includes("SUPERADMIN") || roles.includes("DIOCESAIN")) return true;

  const pid = refId(lecteur.paroisseId);
  const vid = refId(lecteur.vicariatId);

  if (roles.includes("VICARIAL") && user.vicariatId && vid === String(user.vicariatId)) return true;
  if (roles.includes("PAROISSIAL") && user.parishId && pid === String(user.parishId)) return true;

  return false;
}

function canEdit(user: { roles?: string[] }) {
  return (user.roles ?? []).some((r) => ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"].includes(r));
}

export default async function EditLecteurPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const user = session.user as { roles?: string[]; parishId?: string; vicariatId?: string };
  if (!canEdit(user)) redirect("/lecteurs");

  const { id } = await params;

  await connectToDatabase();

  const lecteurService = new LecteurService();
  const lecteurDoc = await lecteurService.getLecteurById(id);
  if (!lecteurDoc) notFound();

  const lecteurRaw = lecteurDoc as unknown as Record<string, unknown>;
  if (!canAccessLecteur(user, lecteurRaw)) redirect("/lecteurs");

  const lecteur = serializeLecteur(lecteurDoc) as LecteurFormInitial & {
    nom?: string;
    prenoms?: string;
    uniqueId?: string;
    paroisseId?: { name?: string } | string | null;
    vicariatId?: { name?: string } | string | null;
  };

  const evaluationService = new EvaluationService();
  const lockGradeId = await evaluationService.hasAnyEvaluationForLecteur(id);

  const roles = user.roles ?? [];
  const isParoissial = roles.includes("PAROISSIAL");
  const isVicarial = roles.includes("VICARIAL");

  let vicariats: { _id: string; name: string }[] = [];
  let paroisses: { _id: string; name: string; vicariatId: string }[] = [];

  let lockParishVicariat:
    | {
        paroisseId: string;
        vicariatId: string;
        paroisseName?: string;
        vicariatName?: string;
      }
    | undefined;

  if (isParoissial || isVicarial) {
    lockParishVicariat = {
      paroisseId: refId(lecteur.paroisseId),
      vicariatId: refId(lecteur.vicariatId),
      paroisseName:
        lecteur.paroisseId && typeof lecteur.paroisseId === "object" && "name" in lecteur.paroisseId
          ? String((lecteur.paroisseId as { name?: string }).name ?? "")
          : undefined,
      vicariatName:
        lecteur.vicariatId && typeof lecteur.vicariatId === "object" && "name" in lecteur.vicariatId
          ? String((lecteur.vicariatId as { name?: string }).name ?? "")
          : undefined,
    };
  } else {
    const [vList, pList] = await Promise.all([
      Vicariat.find().sort({ name: 1 }).lean(),
      Paroisse.find().sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: v._id.toString(), name: v.name }));
    paroisses = pList.map((p) => ({ _id: p._id.toString(), name: p.name, vicariatId: String(p.vicariatId) }));
  }

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
