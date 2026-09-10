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

/** Client FedaPay unique pour toutes les consultations de résultats (évite les conflits d'e-mail par lecteur). */
export const RESULTAT_SHARED_CUSTOMER = {
  email: "resultats@consultation.cdlj.local",
  firstname: "Consultation",
  lastname: "CDLJ",
} as const;

export function resultatSharedCustomerEmail() {
  return (
    process.env.FEDAPAY_RESULTAT_CUSTOMER_EMAIL?.trim() || RESULTAT_SHARED_CUSTOMER.email
  );
}

/** ID FedaPay du client partagé, si déjà connu (évite create/search). */
export function resultatSharedCustomerId(): number | null {
  const raw = process.env.FEDAPAY_RESULTAT_CUSTOMER_ID?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** @deprecated Prefer resultatSharedCustomerEmail() — un client unique pour tous les lecteurs. */
export function syntheticResultatCustomerEmail(_uniqueId?: string) {
  return resultatSharedCustomerEmail();
}
