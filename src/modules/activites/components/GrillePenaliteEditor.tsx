"use client";

import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { nextDayAfterDelai, nextDayAfterPalier } from "../penalites";

export type PalierFormRow = {
  id: string;
  dateDebut: string;
  dateFin: string;
  montantSupplementaire: string;
};

function newRow(partial?: Partial<PalierFormRow>): PalierFormRow {
  return {
    id: crypto.randomUUID(),
    dateDebut: "",
    dateFin: "",
    montantSupplementaire: "",
    ...partial,
  };
}

export function rowsFromGrille(
  grille: { dateDebut: string | Date; dateFin: string | Date; montantSupplementaire: number }[] | undefined
): PalierFormRow[] {
  if (!grille?.length) return [];
  return grille.map((p) =>
    newRow({
      id: crypto.randomUUID(),
      dateDebut:
        typeof p.dateDebut === "string" && p.dateDebut.length >= 10
          ? p.dateDebut.slice(0, 10)
          : new Date(p.dateDebut).toISOString().slice(0, 10),
      dateFin:
        typeof p.dateFin === "string" && p.dateFin.length >= 10
          ? p.dateFin.slice(0, 10)
          : new Date(p.dateFin).toISOString().slice(0, 10),
      montantSupplementaire: String(p.montantSupplementaire),
    })
  );
}

export function rowsToPayload(rows: PalierFormRow[]) {
  return rows.map((r) => ({
    dateDebut: r.dateDebut,
    dateFin: r.dateFin,
    montantSupplementaire: Number(r.montantSupplementaire),
  }));
}

export function GrillePenaliteEditor({
  rows,
  onChange,
  delaiPaiement,
  isPage = true,
  error,
}: {
  rows: PalierFormRow[];
  onChange: (rows: PalierFormRow[]) => void;
  delaiPaiement: string;
  isPage?: boolean;
  error?: string | null;
}) {
  const addPalier = () => {
    if (!delaiPaiement) return;
    const last = rows[rows.length - 1];
    const dateDebut = last?.dateFin ? nextDayAfterPalier(last.dateFin) : nextDayAfterDelai(delaiPaiement);
    onChange([...rows, newRow({ dateDebut, dateFin: dateDebut, montantSupplementaire: "" })]);
  };

  const updateRow = (id: string, patch: Partial<PalierFormRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className={cn(isPage && "font-semibold text-slate-800")}>Grille de pénalités</Label>
        <p className="mt-1 text-xs text-slate-500">
          Après le délai de paiement, des paliers peuvent augmenter le tarif. Chaque palier remplace le précédent
          (montant initial + supplément du palier actif). Le dernier palier reste en vigueur indéfiniment après sa
          date de fin.
        </p>
      </div>

      {!delaiPaiement ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Renseignez d&apos;abord le délai de paiement pour configurer les paliers.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          Aucun palier défini — le montant initial s&apos;applique après le délai de paiement.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Palier {index + 1}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Supprimer le palier ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs text-slate-600">Du</Label>
                  <Input
                    type="date"
                    value={row.dateDebut}
                    onChange={(e) => updateRow(row.id, { dateDebut: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Au</Label>
                  <Input
                    type="date"
                    value={row.dateFin}
                    min={row.dateDebut || undefined}
                    onChange={(e) => updateRow(row.id, { dateFin: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Supplément (FCFA)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={row.montantSupplementaire}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      updateRow(row.id, { montantSupplementaire: digits });
                    }}
                    className="mt-1 rounded-xl"
                    placeholder="Ex. 1000"
                  />
                </div>
              </div>
              {row.dateDebut && row.dateFin && row.montantSupplementaire !== "" ? (
                <p className="text-xs text-slate-500">
                  Tarif sur cette période : montant initial + {Number(row.montantSupplementaire).toLocaleString("fr-FR")} FCFA
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="rounded-xl border-amber-200 text-amber-900 hover:bg-amber-50"
        onClick={addPalier}
        disabled={!delaiPaiement}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un palier
      </Button>
    </div>
  );
}
