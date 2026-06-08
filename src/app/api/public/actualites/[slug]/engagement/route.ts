import { NextResponse } from "next/server";
import { getVisitorContext } from "@/lib/visitor";
import { ActualiteEngagementService } from "@/modules/actualites/engagement/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const visitor = await getVisitorContext(request);
    const service = new ActualiteEngagementService();
    const data = await service.getPublicEngagement(slug, visitor);
    if (!data) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
