import { getSiteUrl } from "@/lib/site-url";

/**
 * URL publique de l’app (sans slash final). Utilisée pour callback FedaPay, e-mails, etc.
 * Priorité : NEXT_PUBLIC_APP_URL → NEXTAUTH_URL → VERCEL_URL (voir getSiteUrl).
 */
export function getAppBaseUrl(): string {
  const url = getSiteUrl();
  if (url === "http://localhost:3000" && process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL (ou NEXTAUTH_URL) doit être défini en production pour les paiements FedaPay."
    );
  }
  return url;
}
/** URL à enregistrer dans le tableau de bord FedaPay (webhook POST). */
export function getFedapayWebhookUrl(): string {
  return `${getAppBaseUrl()}/api/webhooks/fedapay`;
}
