import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserService, createUserSchema } from "@/modules/users/service";

function isSuperAdmin(roles: string[] | undefined) {
  return roles?.includes("SUPERADMIN");
}

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSuperAdmin(session.user.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const service = new UserService();
    const users = await service.getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSuperAdmin(session.user.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const validated = createUserSchema.parse(body);
    const service = new UserService();
    const user = await service.createUser(validated);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
