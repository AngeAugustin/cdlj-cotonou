import { NextResponse } from "next/server";
import { buildActivitePaymentEmailHtml } from "@/lib/email/activitePaymentTemplate";
import { assertDevRouteAccess } from "@/lib/devRouteAccess";

/**
 * Prévisualisation du mail « confirmation paiement activité ».
 * Dev local : ouvert. Ailleurs : header `x-dev-secret` = EMAIL_PREVIEW_SECRET.
 */
export async function GET(request: Request) {
  const denied = assertDevRouteAccess(request);
  if (denied) return denied;

  const html = buildActivitePaymentEmailHtml({
    activiteNom: "Journée diocésaine des lecteurs (exemple)",
    montantTotal: 15000,
    montantUnitaire: 5000,
    nombreLecteurs: 3,
    reference: "FP-TXN-EXEMPLE-0001",
    detailsUrl: "https://cdlj-cotonou.com/activites/exemple?tab=paiements&paymentId=exemple",
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
