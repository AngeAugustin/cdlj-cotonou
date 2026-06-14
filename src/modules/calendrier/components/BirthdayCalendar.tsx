"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardPanel } from "@/components/dashboard/page-shell";
import {
  type ApiLecteur,
  displayAvatarSrc,
  formatAgeLabel,
  lecteurInitials,
  rattachementLines,
} from "@/modules/lecteurs/lecteurViewUtils";
import {
  formatDayLabel,
  formatMonthLabel,
  groupLecteursByBirthday,
  isSameMonth,
  isToday,
  keyFromDate,
  monthGridDays,
  nextMonth,
  prevMonth,
  WEEKDAY_LABELS,
} from "@/modules/calendrier/birthdayCalendarUtils";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_AVATARS = 4;

type BirthdayCalendarProps = {
  lecteurs: ApiLecteur[];
  loading?: boolean;
};

export function BirthdayCalendar({ lecteurs, loading }: BirthdayCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const birthdayMap = useMemo(() => groupLecteursByBirthday(lecteurs), [lecteurs]);
  const gridDays = useMemo(() => monthGridDays(viewMonth), [viewMonth]);

  const selectedLecteurs = useMemo(() => {
    if (!selectedDay) return [];
    return birthdayMap.get(keyFromDate(selectedDay)) ?? [];
  }, [birthdayMap, selectedDay]);

  const monthBirthdayCount = useMemo(() => {
    let count = 0;
    for (const [key, group] of birthdayMap) {
      const month = Number(key.split("-")[0]);
      if (month === viewMonth.getMonth() + 1) count += group.length;
    }
    return count;
  }, [birthdayMap, viewMonth]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <DashboardPanel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl border-slate-200"
              onClick={() => setViewMonth((m) => prevMonth(m))}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[10rem] text-center text-lg font-bold capitalize text-slate-900 sm:min-w-[12rem] sm:text-xl">
              {formatMonthLabel(viewMonth)}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl border-slate-200"
              onClick={() => setViewMonth((m) => nextMonth(m))}
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-amber-900 hover:bg-amber-50"
            onClick={() => {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(today);
            }}
          >
            Aujourd&apos;hui
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const today = isToday(day);
              const dayLecteurs = birthdayMap.get(keyFromDate(day)) ?? [];
              const hasBirthdays = dayLecteurs.length > 0;
              const isSelected =
                selectedDay != null &&
                selectedDay.getDate() === day.getDate() &&
                selectedDay.getMonth() === day.getMonth();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(new Date(day.getFullYear(), day.getMonth(), day.getDate()))}
                  className={cn(
                    "group relative flex min-h-[72px] flex-col border-b border-r border-slate-100 p-1.5 text-left transition-colors sm:min-h-[88px] sm:p-2",
                    !inMonth && "bg-slate-50/60",
                    inMonth && "bg-white hover:bg-amber-50/40",
                    isSelected && "ring-2 ring-inset ring-amber-500/70 bg-amber-50/50",
                    hasBirthdays && inMonth && "cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm",
                      !inMonth && "text-slate-300",
                      inMonth && !today && "text-slate-600",
                      today && "bg-amber-600 text-white shadow-sm"
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {hasBirthdays && inMonth ? (
                    <div className="mt-auto flex items-center -space-x-1.5">
                      {dayLecteurs.slice(0, MAX_VISIBLE_AVATARS).map((l) => (
                        <Avatar
                          key={l._id}
                          size="sm"
                          className="h-5 w-5 border-2 border-white shadow-sm ring-0 sm:h-6 sm:w-6"
                          title={`${l.prenoms} ${l.nom}`}
                        >
                          <AvatarImage src={displayAvatarSrc(l)} alt={`${l.prenoms} ${l.nom}`} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-[9px] font-bold text-white">
                            {lecteurInitials(l)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {dayLecteurs.length > MAX_VISIBLE_AVATARS ? (
                        <span
                          className="relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-[9px] font-bold text-amber-900 shadow-sm sm:h-6 sm:w-6 sm:text-[10px]"
                          title={`Voir les ${dayLecteurs.length - MAX_VISIBLE_AVATARS} autres`}
                        >
                          +{dayLecteurs.length - MAX_VISIBLE_AVATARS}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:px-6">
          <span className="flex items-center gap-1.5">
            <Cake className="h-4 w-4 text-amber-600" />
            {monthBirthdayCount} anniversaire{monthBirthdayCount !== 1 ? "s" : ""} ce mois
          </span>
        </div>
      </DashboardPanel>

      <DashboardPanel className="flex flex-col">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">
            {selectedDay ? formatDayLabel(selectedDay) : "Sélectionnez un jour"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {selectedDay
              ? selectedLecteurs.length > 0
                ? `${selectedLecteurs.length} anniversaire${selectedLecteurs.length !== 1 ? "s" : ""}`
                : "Aucun anniversaire ce jour"
              : "Cliquez sur une date ou sur + pour voir tous les anniversaires"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {selectedLecteurs.length > 0 ? (
            <ul className="space-y-2">
              {selectedLecteurs.map((l) => {
                const { paroisse } = rattachementLines(l);
                return (
                  <li key={l._id}>
                    <Link
                      href={`/lecteurs/${l._id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-amber-200 hover:bg-amber-50/60"
                    >
                      <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                        <AvatarImage src={displayAvatarSrc(l)} alt={`${l.prenoms} ${l.nom}`} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-sm font-bold text-white">
                          {lecteurInitials(l)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {l.prenoms} {l.nom}
                        </p>
                        <p className="truncate text-xs text-slate-500">{paroisse}</p>
                        <p className="text-xs font-medium text-amber-800">{formatAgeLabel(l.dateNaissance)}</p>
                      </div>
                      <Cake className="h-4 w-4 shrink-0 text-amber-500" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : selectedDay ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Cake className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">Pas d&apos;anniversaire à cette date</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Cake className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">Les avatars apparaissent sur les dates d&apos;anniversaire</p>
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
