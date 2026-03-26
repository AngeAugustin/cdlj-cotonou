/** URLs publiques des logos. */
const LOGO_EM = "https://i.postimg.cc/zGGW7CSV/EM.png";
const LOGO_CDLJ = "https://i.postimg.cc/BnnDpTc2/CDLJ.png";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Template ticket premium — tables + styles inline (compat email universelle).
 */
export function buildActivitePaymentEmailHtml(params: {
  activiteNom: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  reference: string | null;
}): string {
  const orgName = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  const isFree = params.montantTotal < 1;
  const nom = escapeHtml(params.activiteNom);

  const preheaderRaw = isFree
    ? `Participation enregistrée pour « ${params.activiteNom.slice(0, 80)} » — Portail CDLJ.`
    : `Paiement de ${fmtMoney(params.montantTotal)} enregistré pour « ${params.activiteNom.slice(0, 60)} » — Portail CDLJ.`;
  const preheader = escapeHtml(preheaderRaw);

  /* ── Palette ── */
  const A900 = "#78350f";   // amber-900
  const A800 = "#92400e";   // amber-800
  const A400 = "#fbbf24";   // amber-400
  const A100 = "#fef3c7";   // amber-100
  const A50  = "#fffbeb";   // amber-50
  const S900 = "#0f172a";   // slate-900
  const S700 = "#334155";   // slate-700
  const S500 = "#64748b";   // slate-500
  const S400 = "#94a3b8";   // slate-400
  const S200 = "#e2e8f0";   // slate-200
  const S100 = "#f1f5f9";   // slate-100
  const S50  = "#f8fafc";   // slate-50
  const BG   = "#eef2f7";   // page background
  const WHITE = "#ffffff";

  /* ── Amount block ── */
  const amountBlock = isFree
    ? `
      <td align="center" style="padding:28px 32px 0 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="background-color:${A50};border:1.5px dashed ${A400};border-radius:14px;padding:22px 24px;">
              <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#b45309;">Montant</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:${A900};letter-spacing:-0.02em;">Participation gratuite</p>
            </td>
          </tr>
        </table>
      </td>`
    : `
      <td align="center" style="padding:28px 32px 0 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,${A900} 0%,${A800} 100%);border-radius:14px;padding:26px 24px;">
              <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Total payé</p>
              <p style="margin:0;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:800;color:${WHITE};letter-spacing:-0.02em;line-height:1;">${escapeHtml(fmtMoney(params.montantTotal))}</p>
            </td>
          </tr>
        </table>
      </td>`;

  /* ── Detail rows (only for paid) ── */
  const detailRows = isFree
    ? `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${S200};font-size:14px;color:${S500};">Lecteurs inscrits</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${S200};font-size:14px;font-weight:700;color:${S900};">${params.nombreLecteurs}</td>
      </tr>`
    : `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${S200};font-size:13px;color:${S500};">Tarif unitaire</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${S200};font-size:13px;font-weight:600;color:${S700};">${escapeHtml(fmtMoney(params.montantUnitaire))}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${S200};font-size:13px;color:${S500};">Nombre de lecteurs</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${S200};font-size:13px;font-weight:600;color:${S700};">${params.nombreLecteurs}</td>
      </tr>`;

  /* ── Stub: reference (uniquement si payant) ── */
  const stubRef = isFree
    ? ""
    : params.reference
      ? `
      <tr>
        <td style="padding:0 0 16px 0;">
          <p style="margin:0 0 6px 0;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${S400};">Référence transaction</p>
          <p style="margin:0;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;font-weight:700;color:${S900};letter-spacing:0.06em;">${escapeHtml(params.reference)}</p>
        </td>
      </tr>`
      : `
      <tr>
        <td style="padding:0 0 16px 0;">
          <p style="margin:0 0 6px 0;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${S400};">Référence transaction</p>
          <p style="margin:0;font-size:13px;color:${S400};font-style:italic;">En attente de confirmation bancaire</p>
        </td>
      </tr>`;

  /* ── Status badge ── */
  const statusBadge = isFree
    ? `<span style="display:inline-block;background-color:#ecfdf5;border:1px solid #6ee7b7;border-radius:100px;padding:4px 12px;font-size:11px;font-weight:700;color:#065f46;letter-spacing:0.04em;">&#10003;&nbsp; Inscription confirmée</span>`
    : `<span style="display:inline-block;background-color:#ecfdf5;border:1px solid #6ee7b7;border-radius:100px;padding:4px 12px;font-size:11px;font-weight:700;color:#065f46;letter-spacing:0.04em;">&#10003;&nbsp; Paiement approuvé</span>`;

  return `<!DOCTYPE html>
<!-- CDLJ template activite-payment v3 ticket (tables + inline styles) -->
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${isFree ? "Participation enregistrée" : "Confirmation de paiement"} — ${escapeHtml(orgName)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader invisible -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BG}" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:48px 16px 48px 16px;">

        <!-- ══ Ticket wrapper 600px ══ -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

          <!-- ══ TICKET CARD ══ -->
          <tr>
            <td style="background-color:${WHITE};border-radius:20px;border:1px solid ${S200};overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,0.13);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

                <!-- ▌ Header ambré — logos + titre ▌ -->
                <tr>
                  <td style="background-color:${A900};padding:28px 32px 24px 32px;border-radius:20px 20px 0 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:14px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                            <tr>
                              <td style="padding:0 10px;vertical-align:middle;">
                                <img src="${LOGO_EM}" width="68" height="50" alt="Enfance Missionnaire" style="display:block;border:0;outline:none;text-decoration:none;" />
                              </td>
                              <td style="padding:0 2px;vertical-align:middle;">
                                <div style="width:1px;height:36px;background-color:rgba(255,255,255,0.2);"></div>
                              </td>
                              <td style="padding:0 10px;vertical-align:middle;">
                                <img src="${LOGO_CDLJ}" width="44" height="44" alt="CDLJ" style="display:block;border:0;outline:none;text-decoration:none;" />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);">Portail intranet diocésain</p>
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:19px;font-weight:800;color:${WHITE};letter-spacing:-0.01em;">${isFree ? "Inscription confirmée" : "Confirmation de paiement"}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ▌ Accent stripe amber-400 ▌ -->
                <tr>
                  <td style="background-color:${A400};height:3px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- ▌ Status + Activity name ▌ -->
                <tr>
                  <td style="padding:28px 32px 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom:14px;">${statusBadge}</td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${S400};">Activité</p>
                          <p style="margin:0;font-size:20px;font-weight:800;color:${S900};line-height:1.3;letter-spacing:-0.02em;">${nom}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ▌ Amount block ▌ -->
                <tr>${amountBlock}</tr>

                <!-- ▌ Detail rows ▌ -->
                <tr>
                  <td style="padding:24px 32px 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${detailRows}
                    </table>
                  </td>
                </tr>

                <!-- ▌ Perforation — notch gauche + tirets + notch droite ▌ -->
                <tr>
                  <td style="padding:28px 0 0 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <!-- notch gauche -->
                        <td width="16" style="background-color:${BG};width:16px;border-radius:0 16px 16px 0;height:28px;font-size:0;line-height:0;">&nbsp;</td>
                        <!-- tirets -->
                        <td style="border-top:2px dashed ${S200};height:0;font-size:0;line-height:0;">&nbsp;</td>
                        <!-- notch droite -->
                        <td width="16" style="background-color:${BG};width:16px;border-radius:16px 0 0 16px;height:28px;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ▌ Stub — référence + rappel ▌ -->
                <tr>
                  <td style="background-color:${S50};border-radius:0 0 20px 20px;padding:24px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${stubRef}
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color:${WHITE};border:1px solid ${S200};border-radius:10px;padding:12px 16px;">
                                <p style="margin:0;font-size:12px;line-height:1.6;color:${S500};">
                                  <strong style="color:${S700};">Rappel&nbsp;:</strong> conservez cet e-mail comme justificatif. En cas de question, contactez votre responsable de paroisse ou l'équipe CDLJ. Le traitement bancaire peut apparaître sous un libellé FedaPay sur votre relevé.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ══ Footer sous le ticket ══ -->
          <tr>
            <td style="padding:24px 8px 0 8px;text-align:center;">
              <p style="margin:0 0 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${S500};">${escapeHtml(orgName)} · Communauté Diocésaine des Lecteurs Juniors</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:${S400};">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
            </td>
          </tr>

        </table>
        <!-- ══ /Ticket wrapper ══ -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function buildActivitePaymentEmailText(params: {
  activiteNom: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  reference: string | null;
}): string {
  const org = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  const isFree = params.montantTotal < 1;
  const lines = [
    `${org} — ${isFree ? "Inscription confirmée" : "Confirmation de paiement"}`,
    "",
    "Bonjour,",
    "",
    isFree
      ? `Votre inscription pour l'activité « ${params.activiteNom} » a bien été enregistrée (${params.nombreLecteurs} lecteur(s)).`
      : `Nous avons bien reçu votre paiement pour l'activité « ${params.activiteNom} ».`,
    "",
  ];
  if (!isFree) {
    lines.push(
      `Tarif unitaire     : ${fmtMoney(params.montantUnitaire)}`,
      `Nombre de lecteurs : ${params.nombreLecteurs}`,
      `Total payé         : ${fmtMoney(params.montantTotal)}`,
      ""
    );
  } else {
    lines.push(`Lecteurs inscrits : ${params.nombreLecteurs}`, "");
  }
  if (params.reference) lines.push(`Référence transaction : ${params.reference}`, "");
  lines.push(
    "─────────────────────────────────────────",
    "Conservez cet e-mail comme justificatif.",
    "Cet e-mail est envoyé automatiquement, merci de ne pas y répondre."
  );
  return lines.join("\n");
}
