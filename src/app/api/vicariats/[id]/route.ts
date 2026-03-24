import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { VicariatService } from "@/modules/vicariats/service";
import { updateVicariatSchema } from "@/modules/vicariats/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const service = new VicariatService();
    const result = await service.getVicariatById(resolvedParams.id);

    if (!result) return NextResponse.json({ error: "Vicariat non trouvé" }, { status: 404 });
    return NextResponse.json(result);
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

    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    if (!isDiocesain && !isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateVicariatSchema.parse(body);

    const service = new VicariatService();
    const updatedVicariat = await service.updateVicariat(resolvedParams.id, validatedData);

    if (!updatedVicariat) return NextResponse.json({ error: "Vicariat non trouvé" }, { status: 404 });
    return NextResponse.json(updatedVicariat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    if (!isDiocesain && !isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resolvedParams = await params;
    const service = new VicariatService();
    const success = await service.deleteVicariat(resolvedParams.id);

    if (!success) return NextResponse.json({ error: "Vicariat non trouvé" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
