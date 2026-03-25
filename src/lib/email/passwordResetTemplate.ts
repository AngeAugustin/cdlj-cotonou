/** URLs publiques des logos (identiques au portail de connexion). */
const LOGO_EM = "https://i.postimg.cc/zGGW7CSV/EM.png";
const LOGO_CDLJ = "https://i.postimg.cc/BnnDpTc2/CDLJ.png";

const BRAND_AMBER = "#78350f";
const BRAND_AMBER_LIGHT = "#fef3c7";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG_PAGE = "#f1f5f9";

/**
 * HTML e-mail transactionnel (tables + styles inline) pour compatibilité Outlook, Gmail, Apple Mail.
 */
export function buildPasswordResetEmailHtml(code: string): string {
  const safeCode = code.replace(/\D/g, "").slice(0, 6);
  const orgName = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Réinitialisation du mot de passe</title>
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
    Votre code de réinitialisation : ${safeCode} — valide 15 minutes.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG_PAGE};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">
          <!-- Carte principale -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 40px rgba(15,23,42,0.08);">
              <!-- En-tête marque -->
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
                          Réinitialisation du mot de passe
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Corps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:36px 32px 28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${TEXT_PRIMARY};">
                      Bonjour,
                    </p>
                    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${TEXT_MUTED};">
                      Vous avez demandé à réinitialiser votre mot de passe sur le portail CDLJ. Utilisez le code ci-dessous pour continuer. Ce code est personnel&nbsp;; ne le partagez avec personne.
                    </p>
                    <!-- Bloc code -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
                      <tr>
                        <td align="center" style="background-color:${BRAND_AMBER_LIGHT};border:1px dashed #d97706;border-radius:12px;padding:24px 20px;">
                          <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;">
                            Code de vérification
                          </p>
                          <p style="margin:0;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.35em;color:${BRAND_AMBER};line-height:1.2;">
                            ${safeCode}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border-left:4px solid #f59e0b;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:${TEXT_MUTED};">
                            <strong style="color:${TEXT_PRIMARY};">Validité :</strong> ce code expire dans <strong style="color:${TEXT_PRIMARY};">15 minutes</strong>. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe actuel reste inchangé.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Pied -->
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
          <!-- Sous-pied légal -->
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

export function buildPasswordResetEmailText(code: string): string {
  const safeCode = code.replace(/\D/g, "").slice(0, 6);
  const org = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  return [
    `${org} — Réinitialisation du mot de passe`,
    "",
    "Bonjour,",
    "",
    "Votre code de vérification (valide 15 minutes) :",
    "",
    `  ${safeCode}`,
    "",
    "Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.",
    "",
    "---",
    "Cet e-mail est envoyé automatiquement, merci de ne pas répondre.",
  ].join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
