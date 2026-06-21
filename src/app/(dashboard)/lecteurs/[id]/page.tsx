import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";
import type { ApiLecteur } from "@/modules/lecteurs/lecteurViewUtils";
import { LecteurDetailClient } from "./LecteurDetailClient";
import { canAccessLecteur } from "@/lib/rolePermissions";

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
