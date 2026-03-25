import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";
import { updateAssembleeGeneraleSchema } from "@/modules/assemblees/schema";

function isAssembleeManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

function canViewAssemblees(roles: string[]) {
  return roles.includes("VICARIAL") || roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!canViewAssemblees(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new AssembleeGeneraleService();
    const a = await service.getAssemblee(id);
    if (!a) return NextResponse.json({ error: "Assemblée générale introuvable" }, { status: 404 });
    return NextResponse.json(a);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!isAssembleeManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const validated = updateAssembleeGeneraleSchema.parse(body);

    const service = new AssembleeGeneraleService();
    const result = await service.updateAssemblee(id, validated);
    if (!result) return NextResponse.json({ error: "Assemblée générale introuvable" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { roles?: string[] } } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!isAssembleeManager(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new AssembleeGeneraleService();
    const ok = await service.deleteAssemblee(id);
    if (!ok) return NextResponse.json({ error: "Assemblée générale introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

