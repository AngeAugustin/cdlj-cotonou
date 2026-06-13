import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { assertParoisseInVicariat } from "@/lib/activiteEnrollmentScope";
import { LecteurService } from "@/modules/lecteurs/service";
import { GradeService } from "@/modules/grades/service";
import { createLecteurSchema, lecteurImportRowSchema } from "@/modules/lecteurs/schema";
import type { LecteurImportRow } from "@/modules/lecteurs/importExcel";
import { z } from "zod";

const importBodySchema = z.object({
  vicariatId: z.string().min(24, "Vicariat invalide"),
  paroisseId: z.string().min(24, "Paroisse invalide"),
  rows: z.array(lecteurImportRowSchema).min(1, "Aucune ligne à importer"),
});

function canImportLecteurs(roles: string[]) {
  return roles.some((r) => ["SUPERADMIN", "DIOCESAIN", "VICARIAL"].includes(r));
}

type GradeRef = { _id: { toString(): string }; name: string; abbreviation: string };

function resolveGradeId(value: string | undefined, grades: GradeRef[]): string | undefined {
  if (!value?.trim()) return undefined;
  const q = value.trim().toLowerCase();
  const match = grades.find(
    (g) => g.name.toLowerCase() === q || g.abbreviation.toLowerCase() === q
  );
  return match ? match._id.toString() : undefined;
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; vicariatId?: string; parishId?: string };
    } | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = session.user.roles ?? [];
    if (!canImportLecteurs(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = importBodySchema.parse(await request.json());
    const { vicariatId, paroisseId, rows } = body;

    const isVicarial = roles.includes("VICARIAL");
    const isElevated = roles.includes("SUPERADMIN") || roles.includes("DIOCESAIN");

    if (isVicarial && !isElevated) {
      if (!session.user.vicariatId) {
        return NextResponse.json(
          { error: "Compte vicarial sans vicariat associé." },
          { status: 400 }
        );
      }
      if (vicariatId !== String(session.user.vicariatId)) {
        return NextResponse.json({ error: "Vicariat hors périmètre." }, { status: 403 });
      }
    }

    const inScope = await assertParoisseInVicariat(paroisseId, vicariatId);
    if (!inScope) {
      return NextResponse.json(
        { error: "La paroisse sélectionnée n'appartient pas au vicariat." },
        { status: 400 }
      );
    }

    const gradeService = new GradeService();
    const grades = (await gradeService.getGrades()) as GradeRef[];

    const lecteurService = new LecteurService();
    const errors: Array<{ row: number; message: string }> = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as LecteurImportRow;
      const excelRow = i + 2;

      try {
        let gradeId: string | undefined;
        if (row.grade?.trim()) {
          gradeId = resolveGradeId(row.grade, grades);
          if (!gradeId) {
            throw new Error(`Grade « ${row.grade} » introuvable.`);
          }
        }

        const payload = createLecteurSchema.parse({
          nom: row.nom,
          prenoms: row.prenoms,
          dateNaissance: row.dateNaissance,
          sexe: row.sexe,
          gradeId,
          anneeAdhesion: row.anneeAdhesion,
          niveau: row.niveau,
          details: row.details,
          contact: row.contact,
          contactUrgence: row.contactUrgence,
          adresse: row.adresse,
          maux: row.maux,
          vicariatId,
          paroisseId,
        });

        await lecteurService.createLecteur(payload);
        created++;
      } catch (error: unknown) {
        let message = "Erreur inconnue";
        if (error instanceof z.ZodError) {
          message = error.issues[0]?.message ?? message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        errors.push({ row: excelRow, message });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
