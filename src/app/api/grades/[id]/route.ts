import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GradeService } from "@/modules/grades/service";
import { updateGradeSchema } from "@/modules/grades/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const service = new GradeService();
    const result = await service.getGradeById(resolvedParams.id);

    if (!result) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    
    if (!isDiocesain && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateGradeSchema.parse(body);

    const service = new GradeService();
    const updatedGrade = await service.updateGrade(resolvedParams.id, validatedData);

    if (!updatedGrade) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    return NextResponse.json(updatedGrade);
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    
    if (!isDiocesain && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const service = new GradeService();
    const success = await service.deleteGrade(resolvedParams.id);

    if (!success) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
