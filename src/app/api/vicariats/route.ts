import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { VicariatService } from "@/modules/vicariats/service";
import { createVicariatSchema } from "@/modules/vicariats/schema";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new VicariatService();
    const result = await service.getVicariats();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    
    if (!isDiocesain && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createVicariatSchema.parse(body);

    const service = new VicariatService();
    const result = await service.createVicariat(validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
