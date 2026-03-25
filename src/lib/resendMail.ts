import { Resend } from "resend";
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from "@/lib/email/passwordResetTemplate";
import {
  buildActivitePaymentEmailHtml,
  buildActivitePaymentEmailText,
} from "@/lib/email/activitePaymentTemplate";

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function fromHeader(): string {
  const name = process.env.SMTP_FROM_NAME ?? "CDLJ";
  const email = process.env.RESEND_FROM_EMAIL;
  if (!email) throw new Error("RESEND_FROM_EMAIL is not configured");
  return `${name} <${email}>`;
}

export async function sendActivitePaymentConfirmationEmail(
  to: string,
  params: {
    activiteNom: string;
    montantTotal: number;
    montantUnitaire: number;
    nombreLecteurs: number;
    reference: string | null;
  }
): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: fromHeader(),
    to: [to],
    subject: `Paiement enregistré — ${params.activiteNom.slice(0, 60)}`,
    html: buildActivitePaymentEmailHtml(params),
    text: buildActivitePaymentEmailText(params),
  });
  if (error) {
    throw new Error(error.message ?? "Échec d'envoi de l'e-mail");
  }
}

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: fromHeader(),
    to: [to],
    subject: "Code de réinitialisation — Portail CDLJ",
    html: buildPasswordResetEmailHtml(code),
    text: buildPasswordResetEmailText(code),
  });
  if (error) {
    throw new Error(error.message ?? "Échec d'envoi de l'e-mail");
  }
}
