import { NextResponse } from "next/server";
import { buildActivitePaymentEmailHtml } from "@/lib/email/activitePaymentTemplate";
import { assertDevRouteAccess } from "@/lib/devRouteAccess";

/**
 * Diagnostic template paiement v2.
 * Dev local : ouvert. Ailleurs : header `x-dev-secret` = EMAIL_PREVIEW_SECRET.
 * Ne lit plus de fichiers disque en dehors du développement.
 */
export async function GET(request: Request) {
  const denied = assertDevRouteAccess(request);
  if (denied) return denied;

  const sample = buildActivitePaymentEmailHtml({
    activiteNom: "SANITY CHECK",
    montantTotal: 1000,
    montantUnitaire: 1000,
    nombreLecteurs: 1,
    reference: "ref_test",
    detailsUrl: "https://cdlj-cotonou.com/activites/test?tab=paiements&paymentId=test",
  });

  const usesV2 =
    sample.includes("activite-payment v2") &&
    sample.includes("postimg.cc") &&
    !sample.includes("font-family: system-ui") &&
    sample.includes('role="presentation"');

  return NextResponse.json({
    ok: usesV2,
    usesV2Template: usesV2,
    htmlLength: sample.length,
    checks: {
      hasV2Comment: sample.includes("activite-payment v2"),
      hasPostimgLogos: sample.includes("postimg.cc"),
      hasOldSystemUiBody: sample.includes("font-family: system-ui"),
      hasPresentationTables: sample.includes('role="presentation"'),
    },
    nodeEnv: process.env.NODE_ENV,
  });
}
