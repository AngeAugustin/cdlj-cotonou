import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";

function isVicarial(roles: string[]) {
  return roles.includes("VICARIAL");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; vicariatId?: string | null };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!isVicarial(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const vicariatId = session.user.vicariatId;
    if (!vicariatId) return NextResponse.json({ error: "Vicariat non défini pour ce compte" }, { status: 400 });

    const { id: assembleeId } = await params;
    const service = new AssembleeGeneraleService();
    const report = await service.getRapportForVicariat(assembleeId, vicariatId);
    // Rapport "global" non associé à un vicariat (mention DIOCESAIN)
    const globalReport = await service.getRapportForVicariat(assembleeId, null);
    return NextResponse.json({ report, globalReport });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

