import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { syncPaymentFromInternalPaymentId } from "@/lib/activitePaymentFinalize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!roles.includes("SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: activiteId, paymentId } = await params;
    const service = new ActiviteService();
    const payment = await service.findPaiementById(paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }
    if (String(payment.activiteId) !== activiteId) {
      return NextResponse.json({ error: "Paiement hors périmètre" }, { status: 403 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({
        ok: true,
        status: "approved",
        message: "Le paiement est déjà finalisé.",
      });
    }

    if (payment.status !== "approved_pending_registration") {
      return NextResponse.json(
        { error: "Seuls les paiements à finaliser peuvent être repris manuellement." },
        { status: 409 }
      );
    }

    const sync = await syncPaymentFromInternalPaymentId(paymentId, "superadmin_manual_finalize", payment.fedapayTransactionId);
    if (!sync.ok) {
      return NextResponse.json(
        { error: sync.error ?? "La reprise manuelle a échoué." },
        { status: 502 }
      );
    }

    const fresh = await service.findPaiementById(paymentId);
    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable après reprise." }, { status: 404 });
    }

    if (fresh.status === "approved") {
      return NextResponse.json({
        ok: true,
        status: fresh.status,
        message: "La finalisation du paiement a été rejouée avec succès.",
      });
    }

    return NextResponse.json(
      {
        error:
          fresh.status === "approved_pending_registration"
            ? "La reprise a été tentée, mais la finalisation locale reste en anomalie."
            : `La reprise n’a pas abouti. Statut courant : ${fresh.status}.`,
        status: fresh.status,
      },
      { status: 409 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
