import { ActiviteService } from "@/modules/activites/service";
import { fedapayRetrieveTransaction } from "@/lib/fedapay";
import { sendActivitePaymentConfirmationEmail } from "@/lib/resendMail";

/** Statuts FedaPay considérés comme payés (aligné sur le SDK) */
const PAID = new Set([
  "approved",
  "transferred",
  "refunded",
  "approved_partially_refunded",
  "transferred_partially_refunded",
]);

export async function syncPaymentFromFedapayTransactionId(
  fedapayTxId: number,
  eventHint: string
): Promise<{ ok: boolean; error?: string }> {
  const service = new ActiviteService();
  const payment = await service.findPaiementByFedapayTransactionId(fedapayTxId);
  if (!payment) {
    return { ok: true };
  }

  if (payment.status === "approved") {
    return { ok: true };
  }

  let tx: { status?: string; reference?: string; wasPaid?: () => boolean };
  try {
    tx = (await fedapayRetrieveTransaction(fedapayTxId)) as typeof tx;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "FedaPay retrieve failed" };
  }

  const rawStatus = (tx.status ?? "").toLowerCase();
  const statusTokens = rawStatus.split(/[,\s]+/).filter(Boolean);
  const isPaid =
    typeof tx.wasPaid === "function"
      ? tx.wasPaid()
      : statusTokens.some((t) => PAID.has(t)) || PAID.has(rawStatus);

  const ref = typeof tx.reference === "string" ? tx.reference : payment.fedapayReference;

  if (eventHint.includes("declined") || rawStatus.includes("declined")) {
    await service.updatePaiementById(payment._id.toString(), {
      status: "declined",
      fedapayReference: ref ?? null,
      lastWebhookEvent: eventHint,
    });
    return { ok: true };
  }

  if (eventHint.includes("canceled") || rawStatus.includes("canceled")) {
    await service.updatePaiementById(payment._id.toString(), {
      status: "canceled",
      fedapayReference: ref ?? null,
      lastWebhookEvent: eventHint,
    });
    return { ok: true };
  }

  if (!isPaid) {
    await service.updatePaiementById(payment._id.toString(), {
      lastWebhookEvent: eventHint,
      fedapayReference: ref ?? null,
    });
    return { ok: true };
  }

  const lecteurIds = (payment.lecteurIds as { toString: () => string }[]).map((x) => x.toString());
  const paroisseId = payment.paroisseId.toString();
  const activiteId = payment.activiteId.toString();

  try {
    await service.enregistrerPaiement(activiteId, lecteurIds, paroisseId, payment._id.toString());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Participation failed" };
  }

  await service.updatePaiementById(payment._id.toString(), {
    status: "approved",
    fedapayReference: ref ?? null,
    processedAt: new Date(),
    lastWebhookEvent: eventHint,
  });

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
    await service.updatePaiementById(payment._id.toString(), {
      emailSentAt: new Date(),
    });
  } catch {
    // L’e-mail est secondaire : le paiement et les participations sont déjà enregistrés
  }

  return { ok: true };
}
