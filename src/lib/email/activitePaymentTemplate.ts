export function buildActivitePaymentEmailHtml(params: {
  activiteNom: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  reference: string | null;
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
  const ref = params.reference ? `<p><strong>Référence :</strong> ${escapeHtml(params.reference)}</p>` : "";
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1e293b;">
  <h2 style="color: #78350f;">Paiement enregistré</h2>
  <p>Votre paiement pour l’activité <strong>${escapeHtml(params.activiteNom)}</strong> a bien été pris en compte.</p>
  <ul>
    <li><strong>Montant unitaire (par lecteur) :</strong> ${fmt(params.montantUnitaire)}</li>
    <li><strong>Nombre de lecteurs :</strong> ${params.nombreLecteurs}</li>
    <li><strong>Total payé :</strong> ${fmt(params.montantTotal)}</li>
  </ul>
  ${ref}
  <p style="color: #64748b; font-size: 14px;">— Portail CDLJ</p>
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
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
  const lines = [
    "Paiement enregistré",
    "",
    `Activité : ${params.activiteNom}`,
    `Montant unitaire : ${fmt(params.montantUnitaire)}`,
    `Nombre de lecteurs : ${params.nombreLecteurs}`,
    `Total payé : ${fmt(params.montantTotal)}`,
  ];
  if (params.reference) lines.push(`Référence : ${params.reference}`);
  lines.push("", "— Portail CDLJ");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
