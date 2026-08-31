import { isPaymentPastPendingTimeout } from "@/lib/resultatConsultationPayments";
import { fedapayRetrieveTransaction } from "@/lib/fedapay";
import { ResultatPaiementsRepository } from "@/modules/evaluations/resultatPaiementsRepository";

const PAID = new Set(["approved", "transferred"]);
const FULLY_REFUNDED = new Set(["refunded"]);
const PARTIALLY_REFUNDED = new Set(["approved_partially_refunded", "transferred_partially_refunded"]);

type SyncResult = { ok: boolean; error?: string; found?: boolean };

function normalizeGatewayStatus(raw: string | undefined) {
  return (raw ?? "").toLowerCase().trim();
}

function isCanceledGatewayStatus(rawStatus: string) {
  return rawStatus.includes("canceled") || rawStatus.includes("cancelled");
}

function matchesGatewayStatus(rawStatus: string, tokens: string[], allowed: Set<string>) {
  return tokens.some((t) => allowed.has(t)) || allowed.has(rawStatus);
}

async function syncKnownResultatPayment(
  payment: NonNullable<Awaited<ReturnType<ResultatPaiementsRepository["findPaiementById"]>>>,
  eventHint: string,
  forcedFedapayTxId?: number
): Promise<SyncResult> {
  const repo = new ResultatPaiementsRepository();
  const paymentId = payment._id.toString();
  const fedapayTxId = forcedFedapayTxId ?? payment.fedapayTransactionId ?? null;
  if (fedapayTxId == null) {
    return { ok: false, error: "Aucune transaction FedaPay liée à ce paiement", found: true };
  }

  if (payment.fedapayTransactionId == null || payment.fedapayTransactionId !== fedapayTxId) {
    await repo.updatePaiementById(paymentId, { fedapayTransactionId: fedapayTxId });
  }

  let tx: { status?: string; reference?: string; wasPaid?: () => boolean };
  try {
    tx = (await fedapayRetrieveTransaction(fedapayTxId)) as typeof tx;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "FedaPay retrieve failed", found: true };
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
    await repo.updatePaiementById(paymentId, {
      ...basePatch,
      status: "declined",
      statusReason: null,
      timedOutAt: null,
    });
    return { ok: true, found: true };
  }

  if (eventHint.includes("canceled") || isCanceledGatewayStatus(rawStatus)) {
    await repo.updatePaiementById(paymentId, {
      ...basePatch,
      status: "canceled",
      statusReason: null,
      timedOutAt: null,
    });
    return { ok: true, found: true };
  }

  if (isFullyRefunded) {
    await repo.updatePaiementById(paymentId, {
      ...basePatch,
      status: "refunded",
      statusReason: null,
      refundedAt: payment.refundedAt ?? new Date(),
      timedOutAt: null,
    });
    return { ok: true, found: true };
  }

  if (isPartiallyRefunded) {
    await repo.updatePaiementById(paymentId, {
      ...basePatch,
      status: payment.status === "refunded" ? "refunded" : "approved",
      processedAt: payment.processedAt ?? new Date(),
      statusReason: "partial_refund_not_supported",
      timedOutAt: null,
    });
    return { ok: true, found: true };
  }

  if (!isPaid) {
    if (payment.status === "pending" && isPaymentPastPendingTimeout(payment.createdAt)) {
      await repo.updatePaiementById(paymentId, {
        ...basePatch,
        status: "non_finalized",
        statusReason: "gateway_pending_timeout",
        timedOutAt: payment.timedOutAt ?? new Date(),
      });
      return { ok: true, found: true };
    }

    await repo.updatePaiementById(paymentId, { ...basePatch });
    return { ok: true, found: true };
  }

  if (payment.status === "approved") {
    await repo.updatePaiementById(paymentId, {
      ...basePatch,
      statusReason: null,
      refundedAt: null,
      timedOutAt: null,
    });
    return { ok: true, found: true };
  }

  await repo.updatePaiementById(paymentId, {
    ...basePatch,
    status: "approved",
    processedAt: payment.processedAt ?? new Date(),
    statusReason: null,
    refundedAt: null,
    timedOutAt: null,
  });

  return { ok: true, found: true };
}

export async function syncResultatPaymentFromFedapayTransactionId(
  fedapayTxId: number,
  eventHint: string
): Promise<SyncResult> {
  const repo = new ResultatPaiementsRepository();
  const payment = await repo.findPaiementByFedapayTransactionId(fedapayTxId);
  if (!payment) {
    return { ok: true, found: false };
  }
  const result = await syncKnownResultatPayment(payment, eventHint, fedapayTxId);
  return { ...result, found: true };
}

export async function syncResultatPaymentFromInternalPaymentId(
  internalPaymentId: string,
  eventHint: string,
  fedapayTxId?: number | null
): Promise<SyncResult> {
  const repo = new ResultatPaiementsRepository();
  const payment = await repo.findPaiementById(internalPaymentId);
  if (!payment) {
    return { ok: true, found: false };
  }
  const result = await syncKnownResultatPayment(payment, eventHint, fedapayTxId ?? undefined);
  return { ...result, found: true };
}
