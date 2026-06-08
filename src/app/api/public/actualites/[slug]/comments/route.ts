import { NextResponse } from "next/server";
import { getVisitorContext } from "@/lib/visitor";
import { ActualiteEngagementService } from "@/modules/actualites/engagement/service";
import { createCommentSchema } from "@/modules/actualites/engagement/schema";

const CONSENT_REQUIRED = {
  error: "CONSENT_REQUIRED",
  message: "Acceptez les cookies pour publier un commentaire.",
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
    const body = await request.json();
    const validated = createCommentSchema.parse(body);
    const service = new ActualiteEngagementService();
    const result = await service.addComment(slug, visitor, validated);
    if (!result) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SPAM_LIMIT") {
      return NextResponse.json(
        { error: "Veuillez attendre 5 minutes avant de publier un autre commentaire." },
        { status: 429 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
