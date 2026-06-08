import { addDays, endOfDay, format, startOfDay } from "date-fns";

export type PalierPenalite = {
  dateDebut: string | Date;
  dateFin: string | Date;
  montantSupplementaire: number;
};

export type PalierPenaliteInput = {
  dateDebut: string;
  dateFin: string;
  montantSupplementaire: number;
};

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00`);
  }
  return new Date(trimmed);
}

function dayStart(value: string | Date): Date {
  return startOfDay(toDate(value));
}

function dayEnd(value: string | Date): Date {
  return endOfDay(toDate(value));
}

function dateOnlyString(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function nextDayAfterDelai(delaiPaiement: string | Date): string {
  return dateOnlyString(addDays(startOfDay(toDate(delaiPaiement)), 1));
}

export function nextDayAfterPalier(dateFin: string): string {
  return dateOnlyString(addDays(dayStart(dateFin), 1));
}

export function sortPaliers<T extends PalierPenalite>(grille: T[]): T[] {
  return [...grille].sort((a, b) => dayStart(a.dateDebut).getTime() - dayStart(b.dateDebut).getTime());
}

/** Montant unitaire applicable à une date donnée (remplacement par palier, dernier palier indéfini). */
export function computeMontantApplicable(
  montantInitial: number,
  delaiPaiement: string | Date,
  grille: PalierPenalite[] | undefined | null,
  at: Date = new Date()
): number {
  if (montantInitial <= 0) return 0;
  if (at <= toDate(delaiPaiement)) return montantInitial;

  const paliers = sortPaliers(grille ?? []);
  if (paliers.length === 0) return montantInitial;

  for (const palier of paliers) {
    if (at >= dayStart(palier.dateDebut) && at <= dayEnd(palier.dateFin)) {
      return montantInitial + palier.montantSupplementaire;
    }
  }

  const last = paliers[paliers.length - 1];
  if (at > dayEnd(last.dateFin)) {
    return montantInitial + last.montantSupplementaire;
  }

  return montantInitial;
}

export function validateGrillePenalite(
  delaiPaiement: string | Date,
  grille: PalierPenaliteInput[]
): string | null {
  if (!grille.length) return null;

  const sorted = sortPaliers(grille);
  const expectedFirst = nextDayAfterDelai(delaiPaiement);

  if (sorted[0].dateDebut.slice(0, 10) !== expectedFirst) {
    return `Le premier palier doit commencer le ${expectedFirst} (lendemain du délai de paiement).`;
  }

  for (let i = 0; i < sorted.length; i++) {
    const palier = sorted[i];
    if (dayStart(palier.dateFin) < dayStart(palier.dateDebut)) {
      return `Palier ${i + 1} : la date de fin doit être postérieure ou égale à la date de début.`;
    }
    if (palier.montantSupplementaire < 0) {
      return `Palier ${i + 1} : le montant supplémentaire ne peut pas être négatif.`;
    }
    if (i < sorted.length - 1) {
      const expectedNext = nextDayAfterPalier(palier.dateFin.slice(0, 10));
      if (sorted[i + 1].dateDebut.slice(0, 10) !== expectedNext) {
        return `Palier ${i + 2} : doit commencer le ${expectedNext} (lendemain de la fin du palier précédent).`;
      }
    }
  }

  return null;
}

export function palierDateToInput(value: string | Date): string {
  return dateOnlyString(toDate(value));
}
