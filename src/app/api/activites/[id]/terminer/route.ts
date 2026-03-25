import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";

function isActiviteManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isActiviteManager(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const service = new ActiviteService();
    const result = await service.marquerTerminee(id);
    if (!result) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
