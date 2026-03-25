import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserService, updateUserSchema } from "@/modules/users/service";

function isSuperAdmin(roles: string[] | undefined) {
  return roles?.includes("SUPERADMIN");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSuperAdmin(session.user.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const service = new UserService();
    const user = await service.getUser(id);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    return NextResponse.json(user);
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
    if (!isSuperAdmin(session.user.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const service = new UserService();
    const current = await service.getUser(id);
    if (!current) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const nextRoles = validated.roles ?? (current as any).roles;
    const wasSuper = (current as any).roles?.includes("SUPERADMIN");
    const willSuper = nextRoles.includes("SUPERADMIN");
    if (wasSuper && !willSuper) {
      const n = await service.countSuperAdmins();
      if (n <= 1) {
        return NextResponse.json(
          { error: "Impossible de retirer le rôle SuperAdmin au dernier compte de ce type" },
          { status: 400 }
        );
      }
    }

    const user = await service.updateUser(id, validated);
    return NextResponse.json(user);
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
    if (!isSuperAdmin(session.user.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (session.user.id === id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    const service = new UserService();
    const current = await service.getUser(id);
    if (!current) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if ((current as any).roles?.includes("SUPERADMIN")) {
      const n = await service.countSuperAdmins();
      if (n <= 1) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier SuperAdmin" },
          { status: 400 }
        );
      }
    }

    await service.deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
