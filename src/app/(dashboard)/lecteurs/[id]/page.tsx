import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";
import type { ApiLecteur } from "@/modules/lecteurs/lecteurViewUtils";
import { LecteurDetailClient } from "./LecteurDetailClient";

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

export default async function LecteurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const user = session.user as { roles?: string[]; parishId?: string; vicariatId?: string };
  const { id } = await params;

  const service = new LecteurService();
  const lecteurDoc = await service.getLecteurById(id);
  if (!lecteurDoc) notFound();

  if (!canAccessLecteur(user, lecteurDoc as unknown as Record<string, unknown>)) {
    redirect("/lecteurs");
  }

  const lecteur = serializeLecteur(lecteurDoc) as ApiLecteur;
  return <LecteurDetailClient lecteurId={id} lecteur={lecteur} />;
}
