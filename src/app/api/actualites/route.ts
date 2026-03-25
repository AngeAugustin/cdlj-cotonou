import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActualiteService } from "@/modules/actualites/service";
import { createActualiteSchema } from "@/modules/actualites/schema";

function isAdmin(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const service = new ActualiteService();

    if (all) {
      const session: any = await getServerSession(authOptions);
      if (!session || !isAdmin(session.user.roles ?? [])) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(await service.getActualites(false));
    }

    // Public endpoint — published only
    return NextResponse.json(await service.getActualites(true));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.user.roles ?? [])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createActualiteSchema.parse(body);
    const service = new ActualiteService();
    const result = await service.createActualite(validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
