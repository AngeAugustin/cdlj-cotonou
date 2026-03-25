import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { updateActiviteSchema } from "@/modules/activites/schema";

function isActiviteManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

function canViewActivites(roles: string[]) {
  return (
    roles.includes("PAROISSIAL") ||
    roles.includes("VICARIAL") ||
    isActiviteManager(roles)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canViewActivites(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const service = new ActiviteService();
    const a = await service.getActivite(id);
    if (!a) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    return NextResponse.json(a);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isActiviteManager(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const validated = updateActiviteSchema.parse(body);
    const service = new ActiviteService();
    const result = await service.updateActivite(id, validated);
    if (!result) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles: string[] = session.user.roles ?? [];
    if (!roles.includes("SUPERADMIN")) {
      return NextResponse.json({ error: "Seul un super-administrateur peut supprimer une activité" }, { status: 403 });
    }
    const { id } = await params;
    const service = new ActiviteService();
    const deleted = await service.deleteActivite(id);
    if (!deleted) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
