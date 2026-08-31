import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EvaluationService } from "@/modules/evaluations/service";
import { syncResultatPaymentFromFedapayTransactionId } from "@/lib/resultatPaymentFinalize";
import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";

function isManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: { roles?: string[]; parishId?: string; vicariatId?: string };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const { id: evaluationId } = await params;

    const service = new EvaluationService();
    const evaluation = await service.getEvaluationDetails(evaluationId);
    if (!evaluation) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });

    let rows;

    if (roles.includes("PAROISSIAL")) {
      const pid = session.user.parishId;
      if (!pid) return NextResponse.json({ error: "Paroisse non définie" }, { status: 400 });
      rows = await service.listResultatPaiementsForEvaluation(evaluationId, { paroisseId: pid });
    } else if (roles.includes("VICARIAL")) {
      const vid = session.user.vicariatId;
      if (!vid) return NextResponse.json({ error: "Vicariat non défini" }, { status: 400 });
      await connectToDatabase();
      const plist = await Paroisse.find({ vicariatId: vid }).select("_id").lean();
      const paroisseIds = plist.map((p) => p._id.toString());
      rows = await service.listResultatPaiementsForEvaluation(evaluationId, { vicariatId: vid, paroisseIds });
    } else if (isManager(roles)) {
      rows = await service.listResultatPaiementsForEvaluation(evaluationId);
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const openRows = (rows as Array<{ status?: string; fedapayTransactionId?: number | null }>).filter(
      (p) =>
        (p.status === "pending" || p.status === "non_finalized" || p.status === "approved_pending_registration") &&
        p.fedapayTransactionId != null
    );

    if (openRows.length > 0) {
      await Promise.all(
        openRows.map((p) =>
          syncResultatPaymentFromFedapayTransactionId(Number(p.fedapayTransactionId), "paiements_list_refresh").catch(
            () => ({ ok: false })
          )
        )
      );

      if (roles.includes("PAROISSIAL")) {
        const pid = session.user.parishId;
        rows = await service.listResultatPaiementsForEvaluation(evaluationId, { paroisseId: pid });
      } else if (roles.includes("VICARIAL")) {
        const vid = session.user.vicariatId;
        await connectToDatabase();
        const plist = await Paroisse.find({ vicariatId: vid }).select("_id").lean();
        const paroisseIds = plist.map((p) => p._id.toString());
        rows = await service.listResultatPaiementsForEvaluation(evaluationId, { vicariatId: vid, paroisseIds });
      } else {
        rows = await service.listResultatPaiementsForEvaluation(evaluationId);
      }
    }

    return NextResponse.json(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
