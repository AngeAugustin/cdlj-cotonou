"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfDay, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart3, Loader2, Users, Banknote, Receipt } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { palierDateToInput, sortPaliers, type PalierPenalite } from "../penalites";

type PaymentDayRow = {
  date: string;
  montant: number;
  participations: number;
};

type PaymentTarifRow = {
  montantUnitaire: number;
  count: number;
};

type ActiviteStats = {
  totalParticipants: number;
  totalMontant: number;
  paymentsByDay: PaymentDayRow[];
  paymentsByTarif: PaymentTarifRow[];
};

type TarifCountRow = {
  key: string;
  label: string;
  period: string;
  montant: number;
  count: number;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

type ChartPoint = PaymentDayRow & {
  montantCumule: number;
  label: string;
};

function buildChartSeries(paymentsByDay: PaymentDayRow[]): ChartPoint[] {
  if (paymentsByDay.length === 0) return [];

  const byDate = new Map(paymentsByDay.map((row) => [row.date, row]));
  const firstDateStr = [...paymentsByDay].map((r) => r.date).sort()[0];
  if (!firstDateStr) return [];

  const start = startOfDay(parseISO(firstDateStr));
  const end = startOfDay(new Date());
  if (start > end) return [];

  let montantCumule = 0;
  return eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const row = byDate.get(date);
    const montant = row?.montant ?? 0;
    const participations = row?.participations ?? 0;
    montantCumule += montant;
    return {
      date,
      montant,
      participations,
      montantCumule,
      label: format(day, "d MMM", { locale: fr }),
    };
  });
}

function chartTickInterval(dayCount: number) {
  if (dayCount <= 14) return 0;
  if (dayCount <= 31) return 2;
  if (dayCount <= 90) return 6;
  return Math.ceil(dayCount / 12);
}

function buildTarifBreakdown(
  montantInitial: number,
  delaiPaiement: string,
  grille: PalierPenalite[] | null | undefined,
  paymentsByTarif: PaymentTarifRow[]
): TarifCountRow[] {
  const countMap = new Map(paymentsByTarif.map((row) => [row.montantUnitaire, row.count]));
  const usedMontants = new Set<number>();
  const rows: TarifCountRow[] = [];

  if (montantInitial === 0) {
    return [
      {
        key: "free",
        label: "Gratuit",
        period: "—",
        montant: 0,
        count: countMap.get(0) ?? 0,
      },
    ];
  }

  rows.push({
    key: "initial",
    label: "Tarif initial",
    period: `Jusqu'au ${format(new Date(delaiPaiement), "d MMM yyyy · HH:mm", { locale: fr })}`,
    montant: montantInitial,
    count: countMap.get(montantInitial) ?? 0,
  });
  usedMontants.add(montantInitial);

  const paliers = sortPaliers(grille ?? []);
  paliers.forEach((palier, index) => {
    const montant = montantInitial + palier.montantSupplementaire;
    usedMontants.add(montant);
    const periodStart = format(new Date(palierDateToInput(palier.dateDebut)), "d MMM yyyy", { locale: fr });
    const periodEnd = format(new Date(palierDateToInput(palier.dateFin)), "d MMM yyyy", { locale: fr });
    rows.push({
      key: `palier-${index}`,
      label: paliers.length > 1 ? `Pénalité — palier ${index + 1}` : "Pénalité",
      period: index === paliers.length - 1 ? `${periodStart} → puis indéfini` : `${periodStart} → ${periodEnd}`,
      montant,
      count: countMap.get(montant) ?? 0,
    });
  });

  for (const [montant, count] of countMap) {
    if (!usedMontants.has(montant) && count > 0) {
      rows.push({
        key: `other-${montant}`,
        label: "Autre tarif",
        period: "Tarif non répertorié dans la grille actuelle",
        montant,
        count,
      });
    }
  }

  return rows;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChartPoint }[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  let dateLabel = point.date;
  try {
    dateLabel = format(parseISO(point.date), "EEEE d MMMM yyyy", { locale: fr });
  } catch {
    /* keep raw date */
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-800 mb-1 capitalize">{dateLabel}</p>
      <p className="text-amber-800 font-semibold">Cumul : {formatMoney(point.montantCumule)}</p>
      {point.montant > 0 ? (
        <p className="text-slate-600 mt-0.5">Jour : {formatMoney(point.montant)}</p>
      ) : null}
      {point.participations > 0 ? (
        <p className="text-slate-500 mt-0.5">
          {point.participations} participation{point.participations > 1 ? "s" : ""} ce jour
        </p>
      ) : null}
    </div>
  );
}

export function ActiviteStatsPanel({
  activiteId,
  montantInitial,
  delaiPaiement,
  grillePenalite,
}: {
  activiteId: string;
  montantInitial: number;
  delaiPaiement: string;
  grillePenalite?: PalierPenalite[] | null;
}) {
  const [stats, setStats] = useState<ActiviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/activites/${encodeURIComponent(activiteId)}/stats`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les statistiques");
      setStats({
        totalParticipants: Number(data.totalParticipants ?? 0),
        totalMontant: Number(data.totalMontant ?? 0),
        paymentsByDay: Array.isArray(data.paymentsByDay) ? data.paymentsByDay : [],
        paymentsByTarif: Array.isArray(data.paymentsByTarif) ? data.paymentsByTarif : [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [activiteId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const chartData = useMemo(() => buildChartSeries(stats?.paymentsByDay ?? []), [stats?.paymentsByDay]);
  const tickInterval = chartData.length > 0 ? chartTickInterval(chartData.length) : 0;
  const tarifBreakdown = useMemo(
    () => buildTarifBreakdown(montantInitial, delaiPaiement, grillePenalite, stats?.paymentsByTarif ?? []),
    [montantInitial, delaiPaiement, grillePenalite, stats?.paymentsByTarif]
  );
  const totalPaiements = useMemo(
    () => tarifBreakdown.reduce((sum, row) => sum + row.count, 0),
    [tarifBreakdown]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Chargement des statistiques…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-red-700 text-sm">
        {error ?? "Statistiques indisponibles."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-amber-800" />
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">Participations</span>
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-amber-950">{stats.totalParticipants}</p>
          <p className="text-xs text-amber-800/70 mt-1">Inscriptions confirmées (paiement approuvé)</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Montant total</span>
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-emerald-950">{formatMoney(stats.totalMontant)}</p>
          <p className="text-xs text-emerald-800/70 mt-1">Somme des paiements approuvés</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-amber-900" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Évolution des paiements</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Montant cumulé du premier paiement ({chartData[0] ? format(parseISO(chartData[0].date), "d MMM yyyy", { locale: fr }) : "—"})
          {" "}au {format(new Date(), "d MMM yyyy", { locale: fr })}
        </p>

        {chartData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-sm text-slate-400">
            Aucun paiement approuvé pour le moment.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="montantGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                  width={48}
                  domain={[0, "auto"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="montantCumule"
                  stroke="#b45309"
                  strokeWidth={2}
                  fill="url(#montantGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#92400e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-5 h-5 text-amber-900" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Répartition par tarif</h2>
            </div>
            <p className="text-xs text-slate-500">
              Nombre de paiements approuvés pour le tarif initial et chaque palier de pénalité
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {totalPaiements} paiement{totalPaiements > 1 ? "s" : ""} au total
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Tarif</th>
                <th className="px-4 py-3 hidden sm:table-cell">Période</th>
                <th className="px-4 py-3">Montant unitaire</th>
                <th className="px-4 py-3 text-right">Paiements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tarifBreakdown.map((row) => (
                <tr key={row.key} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{row.label}</p>
                    <p className="mt-1 text-xs text-slate-500 sm:hidden">{row.period}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{row.period}</td>
                  <td className="px-4 py-3 font-bold text-amber-900">
                    {montantInitial === 0 && row.montant === 0 ? "Gratuit" : formatMoney(row.montant)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${
                        row.count > 0 ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {row.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
