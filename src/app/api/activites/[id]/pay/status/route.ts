import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { syncPaymentFromFedapayTransactionId } from "@/lib/activitePaymentFinalize";

type SessionShape = {
  user?: {
    roles?: string[];
    parishId?: string;
    email?: string | null;
    id?: string;
  };
} | null;

async function getScopedPayment(request: Request, params: Promise<{ id: string }>) {
  const session = (await getServerSession(authOptions)) as SessionShape;
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const roles: string[] = session.user.roles ?? [];
  if (!roles.includes("PAROISSIAL")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const paroisseId = session.user.parishId;
  if (!paroisseId) {
    return { error: NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 }) };
  }

  const userEmail = session.user.email?.trim();
  const userId = session.user.id ?? userEmail ?? "";
  const { id: activiteId } = await params;
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId") ?? searchParams.get("pid");
  if (!paymentId?.trim()) {
    return { error: NextResponse.json({ error: "pid ou paymentId requis" }, { status: 400 }) };
  }

  const service = new ActiviteService();
  const payment = await service.findPaiementById(paymentId.trim());
  if (!payment) {
    return { error: NextResponse.json({ error: "Paiement introuvable" }, { status: 404 }) };
  }

  if (String(payment.activiteId) !== activiteId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (String(payment.paroisseId) !== paroisseId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const sameUser =
    (userEmail != null && userEmail !== "" && payment.userEmail === userEmail) ||
    (userId !== "" && payment.userId === userId);
  if (!sameUser) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { service, paymentId: paymentId.trim(), payment };
}

/**
 * GET /api/activites/:id/pay/status?pid=...&paymentId=...
 * Pour le rôle PAROISSIAL : retourne le statut du paiement et, si encore en attente,
 * synchronise avec FedaPay (comme le webhook) pour refléter le paiement réel.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scoped = await getScopedPayment(request, params);
    if ("error" in scoped) return scoped.error;

    if (
      (scoped.payment.status === "pending" ||
        scoped.payment.status === "non_finalized" ||
        scoped.payment.status === "approved_pending_registration") &&
      scoped.payment.fedapayTransactionId != null
    ) {
      const sync = await syncPaymentFromFedapayTransactionId(
        scoped.payment.fedapayTransactionId,
        "client_poll"
      );
      if (!sync.ok) {
        return NextResponse.json(
          { error: sync.error ?? "Synchronisation FedaPay impossible" },
          { status: 502 }
        );
      }
    }

    const fresh = await scoped.service.findPaiementById(scoped.paymentId);
    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      status: fresh.status,
      fedapayReference: fresh.fedapayReference ?? null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scoped = await getScopedPayment(request, params);
    if ("error" in scoped) return scoped.error;

    if (
      (scoped.payment.status === "pending" ||
        scoped.payment.status === "non_finalized" ||
        scoped.payment.status === "approved_pending_registration") &&
      scoped.payment.fedapayTransactionId != null
    ) {
      const sync = await syncPaymentFromFedapayTransactionId(
        scoped.payment.fedapayTransactionId,
        "client_timeout_non_finalized"
      );
      if (!sync.ok) {
        return NextResponse.json(
          { error: sync.error ?? "Synchronisation FedaPay impossible" },
          { status: 502 }
        );
      }
    }

    let fresh = await scoped.service.findPaiementById(scoped.paymentId);
    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (fresh.status === "pending") {
      await scoped.service.updatePaiementById(scoped.paymentId, {
        status: "non_finalized",
        lastWebhookEvent: "client_timeout_non_finalized",
        statusReason: "gateway_pending_timeout",
        timedOutAt: new Date(),
      });
      fresh = await scoped.service.findPaiementById(scoped.paymentId);
    }

    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      status: fresh.status,
      fedapayReference: fresh.fedapayReference ?? null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
