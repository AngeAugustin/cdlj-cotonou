import { NextResponse } from "next/server";
import { getVisitorContext } from "@/lib/visitor";
import { ActualiteEngagementService } from "@/modules/actualites/engagement/service";

const CONSENT_REQUIRED = {
  error: "CONSENT_REQUIRED",
  message: "Acceptez les cookies pour enregistrer une vue.",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const visitor = await getVisitorContext(request);
    if (!visitor) {
      return NextResponse.json(CONSENT_REQUIRED, { status: 403 });
    }
    const service = new ActualiteEngagementService();
    const counters = await service.recordView(slug, visitor);
    if (!counters) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    return NextResponse.json(counters);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
