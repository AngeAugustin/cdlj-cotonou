export const MEDIATHEQUE_CATEGORIES = [
  "Session Diocésaine",
  "Weekend de formation",
  "JAV",
  "Assemblée Générale",
  "Formation",
  "Liturgie",
  "Événements",
  "Ressources",
  "Autre",
] as const;

export const MOIS_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export function formatMediathequeDate(mois: number, annee: number): string {
  const label = MOIS_LABELS[mois - 1];
  return label ? `${label} ${annee}` : `${annee}`;
}
