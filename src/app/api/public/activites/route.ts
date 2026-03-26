import { NextResponse } from "next/server";
import { ActiviteService } from "@/modules/activites/service";

export async function GET() {
  try {
    const service = new ActiviteService();
    const activites = await service.listOpenActivitesForPresence();
    return NextResponse.json(activites);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
