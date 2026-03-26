/** URLs publiques des logos (alignés sur le mail de réinitialisation). */
const LOGO_EM = "https://i.postimg.cc/zGGW7CSV/EM.png";
const LOGO_CDLJ = "https://i.postimg.cc/BnnDpTc2/CDLJ.png";

const BRAND_AMBER = "#78350f";
const BRAND_AMBER_LIGHT = "#fef3c7";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG_PAGE = "#f1f5f9";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

/**
 * HTML transactionnel (tables + styles inline) — même langage visuel que `passwordResetTemplate`.
 */
export function buildActivitePaymentEmailHtml(params: {
  activiteNom: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  reference: string | null;
}): string {
  const orgName = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  const nom = escapeHtml(params.activiteNom);
  const isFree = params.montantTotal < 1;
  const preheaderRaw = isFree
    ? `Participation enregistrée pour « ${params.activiteNom.slice(0, 80)} » — Portail CDLJ.`
    : `Paiement de ${fmtMoney(params.montantTotal)} enregistré pour « ${params.activiteNom.slice(0, 60)} » — Portail CDLJ.`;
  const preheader = escapeHtml(preheaderRaw);

  const refRow = params.reference
    ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0 0;">
                      <tr>
                        <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border-left:4px solid #f59e0b;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:${TEXT_MUTED};">
                            <strong style="color:${TEXT_PRIMARY};">Référence transaction :</strong>
                            <span style="font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:${TEXT_PRIMARY};">${escapeHtml(params.reference)}</span>
                          </p>
                        </td>
                      </tr>
                    </table>`
    : "";

  const totalBlock = isFree
    ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
                      <tr>
                        <td align="center" style="background-color:${BRAND_AMBER_LIGHT};border:1px dashed #d97706;border-radius:12px;padding:22px 20px;">
                          <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;">
                            Montant
                          </p>
                          <p style="margin:0;font-size:22px;font-weight:700;color:${BRAND_AMBER};line-height:1.25;">
                            Participation gratuite
                          </p>
                        </td>
                      </tr>
                    </table>`
    : `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
                      <tr>
                        <td align="center" style="background-color:${BRAND_AMBER_LIGHT};border:1px dashed #d97706;border-radius:12px;padding:22px 20px;">
                          <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;">
                            Total payé
                          </p>
                          <p style="margin:0;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:28px;font-weight:700;color:${BRAND_AMBER};line-height:1.2;">
                            ${escapeHtml(fmtMoney(params.montantTotal))}
                          </p>
                        </td>
                      </tr>
                    </table>`;

  const detailRows = isFree
    ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px 0;">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT_MUTED};">Lecteurs inscrits</td>
                        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${params.nombreLecteurs}</td>
                      </tr>
                    </table>`
    : `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px 0;">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT_MUTED};">Montant unitaire (par lecteur)</td>
                        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${escapeHtml(fmtMoney(params.montantUnitaire))}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT_MUTED};">Nombre de lecteurs</td>
                        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${params.nombreLecteurs}</td>
                      </tr>
                    </table>`;

  return `<!DOCTYPE html>
<!-- CDLJ template activite-payment v2 (tables + inline styles) -->
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Confirmation de paiement</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BG_PAGE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BG_PAGE}" style="background-color:${BG_PAGE};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;" bgcolor="${BG_PAGE}">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 40px rgba(15,23,42,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:${BRAND_AMBER};padding:28px 32px;text-align:center;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:16px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                            <tr>
                              <td style="padding:0 10px;vertical-align:middle;">
                                <img src="${LOGO_EM}" width="76" height="56" alt="Enfance Missionnaire" style="display:block;width:76px;height:56px;border:0;outline:none;text-decoration:none;" />
                              </td>
                              <td style="padding:0 10px;vertical-align:middle;">
                                <img src="${LOGO_CDLJ}" width="48" height="48" alt="CDLJ" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;" />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Georgia,'Times New Roman',Times,serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);padding-bottom:8px;">
                          Portail intranet diocésain
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;line-height:1.3;color:#ffffff;">
                          ${isFree ? "Participation enregistrée" : "Confirmation de paiement"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:36px 32px 28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${TEXT_PRIMARY};">
                      Bonjour,
                    </p>
                    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:${TEXT_MUTED};">
                      ${
                        isFree
                          ? `Votre inscription pour l’activité <strong style="color:${TEXT_PRIMARY};">${nom}</strong> a bien été enregistrée. Les lecteurs sélectionnés figurent désormais parmi les participants.`
                          : `Nous avons bien reçu votre paiement pour l’activité <strong style="color:${TEXT_PRIMARY};">${nom}</strong>. Vous trouverez le récapitulatif ci-dessous. Conservez cet e-mail comme justificatif.`
                      }
                    </p>
                    <p style="margin:0 0 18px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">
                      Détail
                    </p>
                    ${detailRows}
                    ${totalBlock}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border-left:4px solid #f59e0b;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:${TEXT_MUTED};">
                            <strong style="color:${TEXT_PRIMARY};">Rappel :</strong> en cas de question, contactez votre responsable de paroisse ou l’équipe CDLJ. Ce message confirme l’enregistrement dans le portail ; le traitement bancaire peut apparaître sous un libellé lié à FedaPay sur votre relevé.
                          </p>
                        </td>
                      </tr>
                    </table>
                    ${refRow}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:20px 32px 32px 32px;border-top:1px solid ${BORDER};">
                    <p style="margin:0 0 8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:${TEXT_MUTED};text-align:center;">
                      ${escapeHtml(orgName)} · Communauté Diocésaine des Lecteurs Juniors
                    </p>
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">
                      Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre directement.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0 8px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#94a3b8;line-height:1.5;">
                Aumônerie de l’Enfance Missionnaire · Cotonou
              </p>
            </td>
          </tr>
        </table>
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
    `${org} — ${isFree ? "Participation enregistrée" : "Confirmation de paiement"}`,
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
      `Montant unitaire : ${fmtMoney(params.montantUnitaire)}`,
      `Nombre de lecteurs : ${params.nombreLecteurs}`,
      `Total payé : ${fmtMoney(params.montantTotal)}`,
      ""
    );
  } else {
    lines.push(`Lecteurs inscrits : ${params.nombreLecteurs}`, "");
  }
  if (params.reference) lines.push(`Référence transaction : ${params.reference}`, "");
  lines.push("---", "Cet e-mail est envoyé automatiquement, merci de ne pas répondre.");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
