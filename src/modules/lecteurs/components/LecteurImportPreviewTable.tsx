"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NIVEAU_SCOLAIRE_OPTIONS } from "../schema";
import {
  isKnownGradeName,
  LECTEUR_IMPORT_COLUMNS,
  type EditableLecteurImportRow,
  type GradeImportOpt,
} from "../importExcel";

type EditableField = keyof Omit<EditableLecteurImportRow, "excelLine">;

const INPUT_CLASS =
  "w-full min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-900/20";

function gradeOptionLabel(g: GradeImportOpt): string {
  return g.abbreviation ? `${g.name} (${g.abbreviation})` : g.name;
}

export function LecteurImportPreviewTable({
  rows,
  grades,
  rowErrors,
  onChange,
  onDelete,
}: {
  rows: EditableLecteurImportRow[];
  grades: GradeImportOpt[];
  rowErrors: Record<number, string>;
  onChange: (index: number, field: EditableField, value: string) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className="h-full max-h-full min-h-[68vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner">
      <table className="w-full min-w-[1400px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-amber-50/95 backdrop-blur-sm">
          <tr className="border-b border-amber-100">
            <th className="w-12 px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              #
            </th>
            {LECTEUR_IMPORT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-600"
              >
                {col.header}
                {!col.required ? (
                  <span className="ml-1 font-medium normal-case text-slate-400">(fac.)</span>
                ) : null}
              </th>
            ))}
            <th className="w-12 px-3 py-3" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const hasError = Boolean(rowErrors[index]);
            return (
              <tr
                key={`${row.excelLine}-${index}`}
                className={cn(
                  "align-top transition-colors",
                  hasError ? "bg-red-50/60" : "hover:bg-slate-50/80"
                )}
              >
                <td className="px-3 py-2.5 text-sm font-mono font-bold text-slate-400">{row.excelLine}</td>
                <td className="px-3 py-2.5">
                  <input
                    className={INPUT_CLASS}
                    value={row.nom}
                    onChange={(e) => onChange(index, "nom", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={INPUT_CLASS}
                    value={row.prenoms}
                    onChange={(e) => onChange(index, "prenoms", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={cn(INPUT_CLASS, "min-w-[8.5rem]")}
                    value={row.dateNaissance}
                    placeholder="AAAA-MM-JJ"
                    onChange={(e) => onChange(index, "dateNaissance", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <select
                    className={INPUT_CLASS}
                    value={row.sexe}
                    onChange={(e) => onChange(index, "sexe", e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <select
                    className={cn(INPUT_CLASS, "min-w-[11rem]")}
                    value={row.grade}
                    onChange={(e) => onChange(index, "grade", e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choisir un grade…
                    </option>
                    {row.grade && !isKnownGradeName(row.grade, grades) ? (
                      <option value={row.grade}>{row.grade} (valeur Excel)</option>
                    ) : null}
                    {grades.map((g, gi) => (
                      <option key={`${g.name}-${g.abbreviation ?? gi}`} value={g.name}>
                        {gradeOptionLabel(g)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    className={cn(INPUT_CLASS, "min-w-[5rem]")}
                    value={row.anneeAdhesion}
                    onChange={(e) => onChange(index, "anneeAdhesion", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <select
                    className={cn(INPUT_CLASS, "min-w-[10rem]")}
                    value={row.niveau}
                    onChange={(e) => onChange(index, "niveau", e.target.value)}
                  >
                    <option value="">—</option>
                    {row.niveau &&
                    !(NIVEAU_SCOLAIRE_OPTIONS as readonly string[]).includes(row.niveau) ? (
                      <option value={row.niveau}>{row.niveau}</option>
                    ) : null}
                    {NIVEAU_SCOLAIRE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={cn(INPUT_CLASS, "min-w-[9rem]")}
                    value={row.details}
                    onChange={(e) => onChange(index, "details", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={INPUT_CLASS}
                    value={row.contact}
                    onChange={(e) => onChange(index, "contact", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={INPUT_CLASS}
                    value={row.contactUrgence}
                    onChange={(e) => onChange(index, "contactUrgence", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={cn(INPUT_CLASS, "min-w-[12rem]")}
                    value={row.adresse}
                    onChange={(e) => onChange(index, "adresse", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    className={cn(INPUT_CLASS, "min-w-[9rem]")}
                    value={row.maux}
                    onChange={(e) => onChange(index, "maux", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Retirer cette ligne"
                    onClick={() => onDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
