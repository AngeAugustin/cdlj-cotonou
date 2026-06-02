import { buildActivitePaymentDetailsUrl } from "@/lib/appBaseUrl";
import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";
import { Lecteur } from "@/modules/lecteurs/model";
import {
  sendActivitePaymentAdminNotificationEmail,
  sendActivitePaymentConfirmationEmail,
} from "@/lib/resendMail";

const DEFAULT_PAYMENT_NOTIFY_EMAIL = "paiement@cdlj-cotonou.com";

export function getPaymentNotifyEmail(): string {
  return process.env.CDLJ_PAYMENT_NOTIFY_EMAIL?.trim() || DEFAULT_PAYMENT_NOTIFY_EMAIL;
}

export type ActivitePaymentNotificationInput = {
  activiteId: string;
  paymentId: string;
  userEmail: string;
  activiteNom: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  reference: string | null;
  fedapayTransactionId?: number | null;
  paroisseId: string;
  lecteurIds: string[];
  channel?: "fedapay" | "gratuit";
  processedAt?: Date | null;
};

async function loadPaymentContext(paroisseId: string, lecteurIds: string[]) {
  await connectToDatabase();
  const [paroisse, lecteurs] = await Promise.all([
    Paroisse.findById(paroisseId).select("name").lean(),
    lecteurIds.length > 0
      ? Lecteur.find({ _id: { $in: lecteurIds } })
          .select("nom prenoms uniqueId")
          .lean()
      : Promise.resolve([]),
  ]);

  return {
    paroisseName: paroisse?.name ?? "—",
    lecteurs: lecteurs.map((l) => ({
      uniqueId: l.uniqueId,
      nom: l.nom,
      prenoms: l.prenoms,
    })),
  };
}

function formatProcessedAt(processedAt?: Date | null): string {
  const date = processedAt ?? new Date();
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Porto-Novo",
  }).format(date);
}

/** Envoie la confirmation au payeur et la notification interne à paiement@cdlj-cotonou.com */
export async function sendActivitePaymentNotifications(
  input: ActivitePaymentNotificationInput
): Promise<void> {
  const { paroisseName, lecteurs } = await loadPaymentContext(input.paroisseId, input.lecteurIds);
  const channel = input.channel ?? (input.montantTotal < 1 ? "gratuit" : "fedapay");
  const processedAt = formatProcessedAt(input.processedAt);
  const detailsUrl = buildActivitePaymentDetailsUrl(input.activiteId, input.paymentId);

  const userParams = {
    activiteNom: input.activiteNom,
    montantTotal: input.montantTotal,
    montantUnitaire: input.montantUnitaire,
    nombreLecteurs: input.nombreLecteurs,
    reference: input.reference,
    detailsUrl,
  };

  await sendActivitePaymentConfirmationEmail(input.userEmail, userParams);

  try {
    await sendActivitePaymentAdminNotificationEmail(getPaymentNotifyEmail(), {
      ...userParams,
      userEmail: input.userEmail,
      paroisseName,
      paymentId: input.paymentId,
      fedapayTransactionId: input.fedapayTransactionId ?? null,
      channel,
      processedAt,
      lecteurs,
      detailsUrl,
    });
  } catch {
    // La notification interne ne doit pas bloquer la confirmation utilisateur déjà envoyée.
  }
}
