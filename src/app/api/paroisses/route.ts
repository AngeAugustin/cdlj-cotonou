import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParoisseService } from "@/modules/paroisses/service";
import { createParoisseSchema } from "@/modules/paroisses/schema";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const service = new ParoisseService();

    if (roles.includes("VICARIAL")) {
      // VICARIAL : uniquement ses paroisses
      const data = await service.getParoisses({ vicariatId: session.user.vicariatId });
      return NextResponse.json(data);
    }

    if (roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN")) {
      const { searchParams } = new URL(request.url);
      const vicariatId = searchParams.get("vicariatId") ?? undefined;
      const data = await service.getParoisses(vicariatId ? { vicariatId } : undefined);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!roles.includes("DIOCESAIN") && !roles.includes("SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createParoisseSchema.parse(body);
    const service = new ParoisseService();
    const result = await service.createParoisse(validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
