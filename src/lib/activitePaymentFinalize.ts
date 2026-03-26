import { ActiviteService } from "@/modules/activites/service";
import { isPaymentPastPendingTimeout } from "@/lib/activitePayments";
import { fedapayRetrieveTransaction } from "@/lib/fedapay";
import { sendActivitePaymentConfirmationEmail } from "@/lib/resendMail";

/** Statuts FedaPay considérés comme payés (hors remboursement) */
const PAID = new Set([
  "approved",
  "transferred",
]);

const FULLY_REFUNDED = new Set([
  "refunded",
]);

const PARTIALLY_REFUNDED = new Set([
  "approved_partially_refunded",
  "transferred_partially_refunded",
]);

type SyncResult = { ok: boolean; error?: string };

function normalizeGatewayStatus(raw: string | undefined) {
  return (raw ?? "").toLowerCase().trim();
}

function isCanceledGatewayStatus(rawStatus: string) {
  return rawStatus.includes("canceled") || rawStatus.includes("cancelled");
}

function matchesGatewayStatus(rawStatus: string, tokens: string[], allowed: Set<string>) {
  return tokens.some((t) => allowed.has(t)) || allowed.has(rawStatus);
}

async function syncKnownPayment(
  payment: Awaited<ReturnType<ActiviteService["findPaiementById"]>>,
  eventHint: string,
  forcedFedapayTxId?: number
): Promise<SyncResult> {
  if (!payment) return { ok: true };

  const service = new ActiviteService();
  const paymentId = payment._id.toString();
  const fedapayTxId = forcedFedapayTxId ?? payment.fedapayTransactionId ?? null;
  if (fedapayTxId == null) {
    return { ok: false, error: "Aucune transaction FedaPay liée à ce paiement" };
  }

  if (payment.fedapayTransactionId == null || payment.fedapayTransactionId !== fedapayTxId) {
    await service.updatePaiementById(paymentId, { fedapayTransactionId: fedapayTxId });
  }

  let tx: { status?: string; reference?: string; wasPaid?: () => boolean };
  try {
    tx = (await fedapayRetrieveTransaction(fedapayTxId)) as typeof tx;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "FedaPay retrieve failed" };
  }

  const rawStatus = normalizeGatewayStatus(tx.status);
  const statusTokens = rawStatus.split(/[,\s]+/).filter(Boolean);
  const isFullyRefunded = matchesGatewayStatus(rawStatus, statusTokens, FULLY_REFUNDED);
  const isPartiallyRefunded = matchesGatewayStatus(rawStatus, statusTokens, PARTIALLY_REFUNDED);
  const isPaid =
    !isFullyRefunded &&
    !isPartiallyRefunded &&
    (typeof tx.wasPaid === "function"
      ? tx.wasPaid()
      : matchesGatewayStatus(rawStatus, statusTokens, PAID));
  const ref = typeof tx.reference === "string" ? tx.reference : payment.fedapayReference;

  const basePatch = {
    fedapayReference: ref ?? null,
    gatewayStatus: rawStatus || null,
    lastWebhookEvent: eventHint,
  } as const;

  if (eventHint.includes("declined") || rawStatus.includes("declined")) {
    await service.updatePaiementById(paymentId, {
      ...basePatch,
      status: "declined",
      statusReason: null,
      timedOutAt: null,
    });
    return { ok: true };
  }

  if (eventHint.includes("canceled") || isCanceledGatewayStatus(rawStatus)) {
    await service.updatePaiementById(paymentId, {
      ...basePatch,
      status: "canceled",
      statusReason: null,
      timedOutAt: null,
    });
    return { ok: true };
  }

  if (isFullyRefunded) {
    await service.annulerParticipationsPourRemboursement(paymentId, "payment_refunded");
    await service.updatePaiementById(paymentId, {
      ...basePatch,
      status: "refunded",
      statusReason: null,
      refundedAt: payment.refundedAt ?? new Date(),
      timedOutAt: null,
    });
    return { ok: true };
  }

  if (isPartiallyRefunded) {
    const partialRefundReason = "partial_refund_not_supported";

    if (payment.status !== "approved" && payment.status !== "refunded") {
      const lecteurIds = (payment.lecteurIds as { toString: () => string }[]).map((x) => x.toString());
      const paroisseId = payment.paroisseId.toString();
      const activiteId = payment.activiteId.toString();

      try {
        await service.enregistrerPaiement(activiteId, lecteurIds, paroisseId, paymentId);
      } catch (e) {
        const reason = e instanceof Error ? e.message.slice(0, 500) : "Participation failed";
        await service.updatePaiementById(paymentId, {
          ...basePatch,
          status: "approved_pending_registration",
          statusReason: reason,
        });
        return { ok: false, error: reason };
      }
    }

    await service.updatePaiementById(paymentId, {
      ...basePatch,
      status: payment.status === "refunded" ? "refunded" : "approved",
      processedAt: payment.processedAt ?? new Date(),
      statusReason: partialRefundReason,
      timedOutAt: null,
    });
    return { ok: true };
  }

  if (!isPaid) {
    if (payment.status === "pending" && isPaymentPastPendingTimeout(payment.createdAt)) {
      await service.updatePaiementById(paymentId, {
        ...basePatch,
        status: "non_finalized",
        statusReason: "gateway_pending_timeout",
        timedOutAt: payment.timedOutAt ?? new Date(),
      });
      return { ok: true };
    }

    await service.updatePaiementById(paymentId, {
      ...basePatch,
    });
    return { ok: true };
  }

  if (payment.status === "approved") {
    await service.updatePaiementById(paymentId, {
      ...basePatch,
      statusReason: null,
      refundedAt: null,
      timedOutAt: null,
    });
    return { ok: true };
  }

  const lecteurIds = (payment.lecteurIds as { toString: () => string }[]).map((x) => x.toString());
  const paroisseId = payment.paroisseId.toString();
  const activiteId = payment.activiteId.toString();

  try {
    await service.enregistrerPaiement(activiteId, lecteurIds, paroisseId, paymentId);
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 500) : "Participation failed";
    await service.updatePaiementById(paymentId, {
      ...basePatch,
      status: "approved_pending_registration",
      statusReason: reason,
    });
    return { ok: false, error: reason };
  }

  await service.updatePaiementById(paymentId, {
    ...basePatch,
    status: "approved",
    processedAt: payment.processedAt ?? new Date(),
    statusReason: null,
    refundedAt: null,
    timedOutAt: null,
  });

  if (!payment.emailSentAt) {
    const activite = await service.getActivite(activiteId);
    const activiteNom = activite?.nom ?? "Activité";

    try {
      await sendActivitePaymentConfirmationEmail(payment.userEmail, {
        activiteNom,
        montantTotal: payment.montantTotal,
        montantUnitaire: payment.montantUnitaire,
        nombreLecteurs: payment.nombreLecteurs,
        reference: ref ?? null,
      });
      await service.updatePaiementById(paymentId, {
        emailSentAt: new Date(),
      });
    } catch {
      // L’e-mail est secondaire : le paiement et les participations sont déjà enregistrés
    }
  }

  return { ok: true };
}

export async function syncPaymentFromFedapayTransactionId(
  fedapayTxId: number,
  eventHint: string
): Promise<SyncResult> {
  const service = new ActiviteService();
  const payment = await service.findPaiementByFedapayTransactionId(fedapayTxId);
  if (!payment) {
    return { ok: true };
  }
  return syncKnownPayment(payment, eventHint, fedapayTxId);
}

export async function syncPaymentFromInternalPaymentId(
  internalPaymentId: string,
  eventHint: string,
  fedapayTxId?: number | null
): Promise<SyncResult> {
  const service = new ActiviteService();
  const payment = await service.findPaiementById(internalPaymentId);
  if (!payment) {
    return { ok: true };
  }
  return syncKnownPayment(payment, eventHint, fedapayTxId ?? undefined);
}
