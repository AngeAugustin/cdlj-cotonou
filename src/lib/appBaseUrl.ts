/**
 * URL publique de l’app (sans slash final). Utilisée pour callback FedaPay, e-mails, etc.
 */
export function getAppBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!u?.trim()) {
    throw new Error("NEXTAUTH_URL (ou NEXT_PUBLIC_APP_URL) doit être défini pour les paiements FedaPay.");
  }
  return u.replace(/\/$/, "");
}
