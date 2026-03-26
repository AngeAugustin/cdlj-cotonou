import { NextResponse } from "next/server";
import { buildActivitePaymentEmailHtml } from "@/lib/email/activitePaymentTemplate";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Diagnostic : vérifie que le serveur Node charge bien le template paiement v2.
 * GET http://localhost:3000/api/dev/email-sanity
 *
 * Si `usesV2Template` est false ou le sujet ne contient pas « Paiement confirmé »,
 * le processus en cours n’utilise pas le bon bundle (autre dossier, vieux `next start`, cache).
 */
export async function GET() {
  const hideOnVercelProd =
    process.env.VERCEL === "1" &&
    process.env.NODE_ENV === "production" &&
    !process.env.EMAIL_PREVIEW_SECRET?.trim();
  if (hideOnVercelProd) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sample = buildActivitePaymentEmailHtml({
    activiteNom: "SANITY CHECK",
    montantTotal: 1000,
    montantUnitaire: 1000,
    nombreLecteurs: 1,
    reference: "ref_test",
  });

  const usesV2 =
    sample.includes("activite-payment v2") &&
    sample.includes("postimg.cc") &&
    !sample.includes("font-family: system-ui") &&
    sample.includes('role="presentation"');

  let fileSnippet = "";
  try {
    const p = join(process.cwd(), "src", "lib", "email", "activitePaymentTemplate.ts");
    const raw = readFileSync(p, "utf8");
    fileSnippet = raw.slice(0, 120).replace(/\s+/g, " ");
  } catch {
    fileSnippet = "(lecture fichier impossible)";
  }

  const paidSubject = `Paiement confirmé — TEST (Portail CDLJ)`;

  return NextResponse.json({
    ok: usesV2,
    usesV2Template: usesV2,
    htmlLength: sample.length,
    htmlFirst300Chars: sample.slice(0, 300),
    checks: {
      hasV2Comment: sample.includes("activite-payment v2"),
      hasPostimgLogos: sample.includes("postimg.cc"),
      hasOldSystemUiBody: sample.includes("font-family: system-ui"),
      hasPresentationTables: sample.includes('role="presentation"'),
    },
    expectedPaidSubjectPattern: "Paiement confirmé — … (Portail CDLJ)",
    examplePaidSubject: paidSubject,
    diskFileStartsWith: fileSnippet,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    hint:
      usesV2
        ? "Le bundle chargé en mémoire correspond au template v2. Si Resend montre encore l’ancien HTML, l’envoi venait d’un autre processus (autre terminal, `next start` sans rebuild)."
        : "Le serveur qui répond à cette route n’exécute PAS le template du dépôt. Arrête tous les `node`/`next`, supprime `.next`, relance `npm run dev` depuis ce dossier uniquement.",
  });
}
