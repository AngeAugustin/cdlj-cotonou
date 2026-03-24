import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { createLecteurSchema } from "@/modules/lecteurs/schema";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paroisseId = searchParams.get("paroisseId");
    const vicariatId = searchParams.get("vicariatId");

    const service = new LecteurService();
    let result;

    if (session.user.roles.includes("SUPERADMIN") || session.user.roles.includes("DIOCESAIN")) {
      if (paroisseId) result = await service.getLecteursByParish(paroisseId);
      else if (vicariatId) result = await service.getLecteursByVicariat(vicariatId);
      else result = await service.getLecteurs();
    } else if (session.user.roles.includes("VICARIAL")) {
       result = await service.getLecteursByVicariat(session.user.vicariatId);
    } else if (session.user.roles.includes("PAROISSIAL")) {
       result = await service.getLecteursByParish(session.user.parishId);
    } else {
       return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

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
    
    // Check role, at least Paroissial or above can create
    const isParoissial = session.user.roles.includes("PAROISSIAL");
    const isVicarial = session.user.roles.includes("VICARIAL");
    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    
    if (!isParoissial && !isVicarial && !isDiocesain && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Force inject context from auth if needed
    if (isParoissial && session.user.parishId) body.paroisseId = session.user.parishId;
    if (isParoissial && session.user.vicariatId) body.vicariatId = session.user.vicariatId;

    const validatedData = createLecteurSchema.parse(body);

    const service = new LecteurService();
    const result = await service.createLecteur(validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
