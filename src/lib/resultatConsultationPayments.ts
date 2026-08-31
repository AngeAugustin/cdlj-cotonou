import { createHash } from "crypto";

export { PAYMENT_PENDING_TIMEOUT_MS, isPaymentPastPendingTimeout } from "@/lib/activitePayments";

export function buildResultatConsultationFingerprint(input: { uniqueId: string; annee: number; montantTotal: number }) {
  const normalized = {
    uniqueId: input.uniqueId.trim().toUpperCase(),
    annee: input.annee,
    montantTotal: input.montantTotal,
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function syntheticResultatCustomerEmail(uniqueId: string) {
  const safe = uniqueId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `resultats.${safe || "lecteur"}@consultation.cdlj.local`;
}
