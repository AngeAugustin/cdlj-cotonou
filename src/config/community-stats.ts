/**
 * Chiffres publics officiels de la CDLJ — source unique pour l'UI et le SEO.
 * Basés sur les données communautaires (~1 500 lecteurs actifs, 2013).
 */

/** Nombre total de lecteurs juniors actifs (chiffre officiel communautaire). */
export const LECTEURS_TOTAL = 1_500;

/** Nombre de vicariats forains dans l'Archidiocèse de Cotonou. */
export const VICARIATS_TOTAL = 15;

/** Nombre de paroisses affiliées. */
export const PAROISHES_TOTAL = 124;

/** Année de fondation officielle de la CDLJ. */
export const FOUNDED_YEAR = 2013;

/** Formatage locale fr-FR pour affichage UI. */
export function formatLecteursCount(compact = false): string {
  if (compact) {
    return LECTEURS_TOTAL >= 1_000
      ? `${Math.round(LECTEURS_TOTAL / 100) / 10}k`.replace(".0k", "k")
      : String(LECTEURS_TOTAL);
  }
  return LECTEURS_TOTAL.toLocaleString("fr-FR");
}

/** Libellé marketing court, ex. « ~1 500 lecteurs ». */
export function lecteursLabel(options?: { prefix?: string; suffix?: string }): string {
  const prefix = options?.prefix ?? "~";
  const suffix = options?.suffix ?? " lecteurs";
  return `${prefix}${formatLecteursCount()}${suffix}`;
}

/** Phrase SEO réutilisable. */
export function lecteursSeoPhrase(): string {
  return `plus de ${formatLecteursCount()} jeunes lecteurs`;
}

/** Stats pour les cartes workflow (page vicariats). */
export const COMMUNITY_WORKFLOW_STATS = [
  { count: "1", unit: "diocèse" },
  { count: String(VICARIATS_TOTAL), unit: "vicariats" },
  { count: String(PAROISHES_TOTAL), unit: "paroisses" },
  { count: formatLecteursCount(), unit: "lecteurs" },
] as const;
