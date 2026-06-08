"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { computeMontantApplicable, palierDateToInput, sortPaliers, type PalierPenalite } from "../penalites";

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

export function GrillePenaliteDisplay({
  montantInitial,
  delaiPaiement,
  grille,
  showCurrentAmount = true,
}: {
  montantInitial: number;
  delaiPaiement: string | Date;
  grille?: PalierPenalite[] | null;
  showCurrentAmount?: boolean;
}) {
  const paliers = sortPaliers(grille ?? []);
  const montantActuel = computeMontantApplicable(montantInitial, delaiPaiement, paliers);

  if (montantInitial === 0) {
    return <p className="text-sm font-semibold text-slate-800">Gratuit</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Montant initial</p>
          <p className="text-sm font-semibold text-slate-800">{formatMoney(montantInitial)}</p>
        </div>
        {showCurrentAmount ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/80">Tarif actuel</p>
            <p className="text-sm font-extrabold text-amber-950">{formatMoney(montantActuel)}</p>
          </div>
        ) : null}
      </div>

      {paliers.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Supplément</th>
                <th className="px-4 py-3">Tarif total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paliers.map((palier, index) => (
                <tr key={`${palier.dateDebut}-${index}`} className="bg-white">
                  <td className="px-4 py-3 text-slate-700">
                    {format(new Date(palierDateToInput(palier.dateDebut)), "d MMM yyyy", { locale: fr })}
                    <span className="mx-1 text-slate-300">→</span>
                    {format(new Date(palierDateToInput(palier.dateFin)), "d MMM yyyy", { locale: fr })}
                    {index === paliers.length - 1 ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        puis indéfini
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    +{formatMoney(palier.montantSupplementaire).replace(" FCFA", "")}
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-900">
                    {formatMoney(montantInitial + palier.montantSupplementaire)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Aucune pénalité configurée après le délai de paiement.</p>
      )}
    </div>
  );
}
