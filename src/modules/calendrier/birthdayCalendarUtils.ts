import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { type ApiLecteur, parseBirthDate } from "@/modules/lecteurs/lecteurViewUtils";

export type BirthdayKey = `${number}-${number}`;

export function birthdayKey(month: number, day: number): BirthdayKey {
  return `${month}-${day}`;
}

export function keyFromDate(date: Date): BirthdayKey {
  return birthdayKey(date.getMonth() + 1, date.getDate());
}

export function groupLecteursByBirthday(lecteurs: ApiLecteur[]): Map<BirthdayKey, ApiLecteur[]> {
  const map = new Map<BirthdayKey, ApiLecteur[]>();
  for (const l of lecteurs) {
    const birth = parseBirthDate(l.dateNaissance);
    if (!birth) continue;
    const key = keyFromDate(birth);
    const existing = map.get(key);
    if (existing) existing.push(l);
    else map.set(key, [l]);
  }
  for (const [, group] of map) {
    group.sort((a, b) =>
      `${a.prenoms} ${a.nom}`.localeCompare(`${b.prenoms} ${b.nom}`, "fr", { sensitivity: "base" })
    );
  }
  return map;
}

export function monthGridDays(viewMonth: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy", { locale: fr });
}

export function formatDayLabel(date: Date): string {
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function prevMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export { isSameMonth, isToday };

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
