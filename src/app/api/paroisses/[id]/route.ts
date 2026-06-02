import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParoisseService } from "@/modules/paroisses/service";
import { updateParoisseSchema } from "@/modules/paroisses/schema";
import { assertParoisseInVicariat } from "@/lib/activiteEnrollmentScope";

function isAdmin(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

function canViewParoisses(roles: string[]) {
  return isAdmin(roles) || roles.includes("VICARIAL");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!canViewParoisses(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const service = new ParoisseService();
    const paroisse = await service.getParoisseDetail(id);
    if (!paroisse) return NextResponse.json({ error: "Paroisse introuvable" }, { status: 404 });

    if (roles.includes("VICARIAL")) {
      if (!session.user.vicariatId) {
        return NextResponse.json({ error: "Vicariat non défini pour ce compte" }, { status: 400 });
      }
      const inScope = await assertParoisseInVicariat(id, session.user.vicariatId);
      if (!inScope) {
        return NextResponse.json({ error: "Cette paroisse n'appartient pas à votre vicariat" }, { status: 403 });
      }
    }

    return NextResponse.json(paroisse);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateParoisseSchema.parse(body);
    const service = new ParoisseService();
    const result = await service.updateParoisse(id, validated);
    if (!result) return NextResponse.json({ error: "Paroisse not found" }, { status: 404 });
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
    if (!isAdmin(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const service = new ParoisseService();
    const deleted = await service.deleteParoisse(id);
    if (!deleted) return NextResponse.json({ error: "Paroisse not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
