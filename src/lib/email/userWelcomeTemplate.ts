const LOGO_EM = "https://i.postimg.cc/zGGW7CSV/EM.png";
const LOGO_CDLJ = "https://i.postimg.cc/BnnDpTc2/CDLJ.png";

const BRAND_AMBER = "#78350f";
const BRAND_AMBER_LIGHT = "#fef3c7";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG_PAGE = "#f1f5f9";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super administrateur",
  DIOCESAIN: "Diocésain",
  VICARIAL: "Vicarial",
  PAROISSIAL: "Paroissial",
};

type UserWelcomeEmailParams = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  numero?: string;
  roles: string[];
  parishName: string;
  vicariatName: string;
  vicariatAbbreviation?: string;
  temporaryPassword: string;
  loginUrl: string;
};

function formatRoles(roles: string[]): string {
  return roles.map((role) => ROLE_LABELS[role] ?? role).join(", ");
}

function formatVicariat(name: string, abbreviation?: string): string {
  return abbreviation?.trim() ? `${name} (${abbreviation})` : name;
}

export function buildUserWelcomeEmailHtml(params: UserWelcomeEmailParams): string {
  const orgName = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  const fullName = `${params.lastName} ${params.firstName}`.trim();
  const phone = params.phone?.trim() || "Non renseigné";
  const numero = params.numero?.trim() || "Attribué à la création";
  const roles = formatRoles(params.roles);
  const vicariat = formatVicariat(params.vicariatName, params.vicariatAbbreviation);

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Votre compte a été créé</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BG_PAGE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Votre compte CDLJ a été créé. Votre mot de passe temporaire est ${escapeHtml(params.temporaryPassword)}.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG_PAGE};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 40px rgba(15,23,42,0.08);">
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
                          Votre compte a été créé
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
                      Bonjour ${escapeHtml(params.firstName)},
                    </p>
                    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${TEXT_MUTED};">
                      Un compte vient d'être créé pour vous sur le portail CDLJ. Vous trouverez ci-dessous vos informations de connexion ainsi que les détails du compte.
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
                      <tr>
                        <td align="center" style="background-color:${BRAND_AMBER_LIGHT};border:1px dashed #d97706;border-radius:12px;padding:24px 20px;">
                          <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;">
                            Mot de passe temporaire
                          </p>
                          <p style="margin:0;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:0.18em;color:${BRAND_AMBER};line-height:1.2;">
                            ${escapeHtml(params.temporaryPassword)}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 20px;background-color:#ffffff;">
                          <p style="margin:0 0 14px 0;font-size:14px;font-weight:700;color:${TEXT_PRIMARY};">Détails du compte</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Nom :</strong> ${escapeHtml(fullName)}</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Email :</strong> ${escapeHtml(params.email)}</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Téléphone :</strong> ${escapeHtml(phone)}</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Numéro utilisateur :</strong> ${escapeHtml(numero)}</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Rôles :</strong> ${escapeHtml(roles)}</p>
                          <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Paroisse :</strong> ${escapeHtml(params.parishName)}</p>
                          <p style="margin:0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};"><strong style="color:${TEXT_PRIMARY};">Vicariat :</strong> ${escapeHtml(vicariat)}</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px 0;">
                      <tr>
                        <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border-left:4px solid #f59e0b;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:${TEXT_MUTED};">
                            <strong style="color:${TEXT_PRIMARY};">Conseil de sécurité :</strong> connectez-vous puis changez votre mot de passe dès votre première connexion.
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:${TEXT_MUTED};">
                      Accéder au portail :
                      <a href="${escapeHtml(params.loginUrl)}" style="color:${BRAND_AMBER};font-weight:700;text-decoration:none;">${escapeHtml(params.loginUrl)}</a>
                    </p>
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
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildUserWelcomeEmailText(params: UserWelcomeEmailParams): string {
  const orgName = process.env.SMTP_FROM_NAME ?? "CDLJ Cotonou";
  const fullName = `${params.lastName} ${params.firstName}`.trim();
  const phone = params.phone?.trim() || "Non renseigné";
  const numero = params.numero?.trim() || "Attribué à la création";
  const roles = formatRoles(params.roles);
  const vicariat = formatVicariat(params.vicariatName, params.vicariatAbbreviation);

  return [
    `${orgName} — Votre compte a été créé`,
    "",
    `Bonjour ${params.firstName},`,
    "",
    "Un compte vient d'être créé pour vous sur le portail CDLJ.",
    "",
    "Mot de passe temporaire :",
    `  ${params.temporaryPassword}`,
    "",
    "Détails du compte :",
    `- Nom : ${fullName}`,
    `- Email : ${params.email}`,
    `- Téléphone : ${phone}`,
    `- Numéro utilisateur : ${numero}`,
    `- Rôles : ${roles}`,
    `- Paroisse : ${params.parishName}`,
    `- Vicariat : ${vicariat}`,
    "",
    `Connexion : ${params.loginUrl}`,
    "",
    "Nous vous conseillons de changer votre mot de passe après votre première connexion.",
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
    .replace(/\"/g, "&quot;");
}
