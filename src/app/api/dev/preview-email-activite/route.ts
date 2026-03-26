import { NextResponse } from "next/server";
import { buildActivitePaymentEmailHtml } from "@/lib/email/activitePaymentTemplate";

/**
 * Prévisualisation du mail « confirmation paiement activité » dans le navigateur.
 * Utile pour vérifier le design sans envoyer un vrai paiement.
 *
 * - En production : désactivé (404), sauf si `EMAIL_PREVIEW_SECRET` est défini et
 *   la requête contient `?secret=<valeur>`.
 *
 * Usage dev : GET http://localhost:3000/api/dev/preview-email-activite
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const secretOk =
    process.env.NODE_ENV === "development" ||
    (process.env.EMAIL_PREVIEW_SECRET?.trim() &&
      secret === process.env.EMAIL_PREVIEW_SECRET.trim());

  if (!secretOk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = buildActivitePaymentEmailHtml({
    activiteNom: "Journée diocésaine des lecteurs (exemple)",
    montantTotal: 15000,
    montantUnitaire: 5000,
    nombreLecteurs: 3,
    reference: "FP-TXN-EXEMPLE-0001",
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
