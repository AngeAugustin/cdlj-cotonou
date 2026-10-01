import { NextResponse } from "next/server";
import { EvaluationService } from "@/modules/evaluations/service";
import { syncResultatPaymentFromFedapayTransactionId } from "@/lib/resultatPaymentFinalize";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

async function getPayment(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("pid") ?? searchParams.get("paymentId");
  if (!paymentId?.trim()) {
    return { error: NextResponse.json({ error: "pid ou paymentId requis" }, { status: 400 }) };
  }

  // ObjectId-looking only — réduit l'énumération brute
  if (!/^[a-f\d]{24}$/i.test(paymentId.trim())) {
    return { error: NextResponse.json({ error: "Paiement introuvable" }, { status: 404 }) };
  }

  const service = new EvaluationService();
  const payment = await service.findResultatPaiementById(paymentId.trim());
  if (!payment) {
    return { error: NextResponse.json({ error: "Paiement introuvable" }, { status: 404 }) };
  }

  return { service, paymentId: paymentId.trim(), payment };
}

export async function GET(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`resultats:pay-status:${ip}`, { limit: 60, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const scoped = await getPayment(request);
    if ("error" in scoped) return scoped.error;

    if (
      (scoped.payment.status === "pending" ||
        scoped.payment.status === "non_finalized" ||
        scoped.payment.status === "approved_pending_registration") &&
      scoped.payment.fedapayTransactionId != null
    ) {
      const sync = await syncResultatPaymentFromFedapayTransactionId(
        scoped.payment.fedapayTransactionId,
        "client_poll"
      );
      if (!sync.ok) {
        return NextResponse.json({ error: sync.error ?? "Synchronisation FedaPay impossible" }, { status: 502 });
      }
    }

    const fresh = await scoped.service.findResultatPaiementById(scoped.paymentId);
    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      status: fresh.status,
      fedapayReference: fresh.status === "approved" ? (fresh.fedapayReference ?? null) : null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`resultats:pay-status-patch:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const scoped = await getPayment(request);
    if ("error" in scoped) return scoped.error;

    if (
      (scoped.payment.status === "pending" ||
        scoped.payment.status === "non_finalized" ||
        scoped.payment.status === "approved_pending_registration") &&
      scoped.payment.fedapayTransactionId != null
    ) {
      const sync = await syncResultatPaymentFromFedapayTransactionId(
        scoped.payment.fedapayTransactionId,
        "client_timeout_non_finalized"
      );
      if (!sync.ok) {
        return NextResponse.json({ error: sync.error ?? "Synchronisation FedaPay impossible" }, { status: 502 });
      }
    }

    let fresh = await scoped.service.findResultatPaiementById(scoped.paymentId);
    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (fresh.status === "pending") {
      await scoped.service.updateResultatPaiementById(scoped.paymentId, {
        status: "non_finalized",
        lastWebhookEvent: "client_timeout_non_finalized",
        statusReason: "gateway_pending_timeout",
        timedOutAt: new Date(),
      });
      fresh = await scoped.service.findResultatPaiementById(scoped.paymentId);
    }

    if (!fresh) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      status: fresh.status,
      fedapayReference: fresh.status === "approved" ? (fresh.fedapayReference ?? null) : null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
