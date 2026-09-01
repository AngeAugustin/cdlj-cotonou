export const EVALUATION_ADMISSIBLE_MIN_MOYENNE = 12;

export type EvaluationDecisionValue = "PROMU" | "MAINTENU";

/** Moyenne sur 20 : admissible si >= 12 (12,00 inclus). */
export function decisionFromMoyenne(moyenne: number): EvaluationDecisionValue {
  return moyenne >= EVALUATION_ADMISSIBLE_MIN_MOYENNE ? "PROMU" : "MAINTENU";
}
