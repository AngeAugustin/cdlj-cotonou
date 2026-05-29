import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MediathequeService } from "@/modules/mediatheque/service";
import { createMediathequeSchema } from "@/modules/mediatheque/schema";

function isAdmin(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const service = new MediathequeService();

    if (all) {
      const session = await getServerSession(authOptions);
      const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
      if (!session || !isAdmin(roles)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(await service.getMediatheques(false));
    }

    return NextResponse.json(await service.getMediatheques(true));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createMediathequeSchema.parse(body);
    const service = new MediathequeService();
    const result = await service.createMediatheque(validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
