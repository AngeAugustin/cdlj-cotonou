import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getLecteurFormContext } from "@/modules/lecteurs/formContext";

const CREATE_ROLES = ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] as const;

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string | null; vicariatId?: string | null };
    } | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = session.user.roles ?? [];
    const canCreate = roles.some((r) => (CREATE_ROLES as readonly string[]).includes(r));
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await getLecteurFormContext(session.user);
    return NextResponse.json(context);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[lecteurs/form-context]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
