import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LecteurService } from "@/modules/lecteurs/service";
import { createLecteurSchema } from "@/modules/lecteurs/schema";
import { serializeLecteur } from "@/modules/lecteurs/serializeApi";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(session.user?.roles) ? session.user.roles : [];

    const { searchParams } = new URL(request.url);
    const paroisseId = searchParams.get("paroisseId");
    const vicariatId = searchParams.get("vicariatId");

    const service = new LecteurService();
    let result;

    if (roles.includes("SUPERADMIN") || roles.includes("DIOCESAIN")) {
      if (paroisseId) result = await service.getLecteursByParish(paroisseId);
      else if (vicariatId) result = await service.getLecteursByVicariat(vicariatId);
      else result = await service.getLecteurs();
    } else if (roles.includes("VICARIAL")) {
      // VICARIAL can filter by paroisseId (within their vicariat scope)
      if (paroisseId) result = await service.getLecteursByParish(paroisseId);
      else {
        if (!session.user?.vicariatId) {
          return NextResponse.json(
            { error: "Compte vicarial sans vicariat associé. Reconnectez-vous ou contactez un administrateur." },
            { status: 400 }
          );
        }
        result = await service.getLecteursByVicariat(session.user.vicariatId);
      }
    } else if (roles.includes("PAROISSIAL")) {
      if (!session.user?.parishId) {
        return NextResponse.json(
          { error: "Compte paroissial sans paroisse associée. Reconnectez-vous ou contactez un administrateur." },
          { status: 400 }
        );
      }
      result = await service.getLecteursByParish(session.user.parishId);
    } else {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    const payload = Array.isArray(result) ? result.map((row) => serializeLecteur(row)) : serializeLecteur(result);
    return NextResponse.json(payload);
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

    const roles: string[] = Array.isArray(session.user?.roles) ? session.user.roles : [];

    // Check role, at least Paroissial or above can create
    const isParoissial = roles.includes("PAROISSIAL");
    const isVicarial = roles.includes("VICARIAL");
    const isDiocesain = roles.includes("DIOCESAIN");
    const isSuperAdmin = roles.includes("SUPERADMIN");
    
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

    return NextResponse.json(serializeLecteur(result), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
