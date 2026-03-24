import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GradeService } from "@/modules/grades/service";
import { createGradeSchema } from "@/modules/grades/schema";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withCount = searchParams.get("withCount") === "true";

    const service = new GradeService();
    let result;
    
    if (withCount) {
      result = await service.getGradesWithLecteurCount();
    } else {
      result = await service.getGrades();
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
    
    const isDiocesain = session.user.roles.includes("DIOCESAIN");
    const isSuperAdmin = session.user.roles.includes("SUPERADMIN");
    
    // Only Diocesain and SuperAdmin can create Grades
    if (!isDiocesain && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createGradeSchema.parse(body);

    const service = new GradeService();
    const result = await service.createGrade(validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
