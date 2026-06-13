"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, AlertCircle, CheckCircle2, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  convertEditableToImportRow,
  downloadLecteurImportTemplate,
  isKnownGradeName,
  matchGradeFromImportText,
  parseLecteurImportWorkbookForPreview,
  type EditableLecteurImportRow,
  type LecteurImportRow,
} from "@/modules/lecteurs/importExcel";
import { LecteurImportPreviewTable } from "./LecteurImportPreviewTable";

type VicariatOpt = { _id: string; name: string };
type ParoisseOpt = { _id: string; name: string; vicariatId?: string };
type GradeOpt = { _id: string; name: string; abbreviation?: string };

type ImportResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

type Step = "setup" | "preview" | "result";

type LecteurImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
  userRoles: string[];
  userVicariatId?: string;
};

export function LecteurImportDialog({
  open,
  onOpenChange,
  onImported,
  userRoles,
  userVicariatId,
}: LecteurImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVicarialOnly =
    userRoles.includes("VICARIAL") &&
    !userRoles.includes("SUPERADMIN") &&
    !userRoles.includes("DIOCESAIN");

  const [step, setStep] = useState<Step>("setup");
  const [vicariats, setVicariats] = useState<VicariatOpt[]>([]);
  const [paroisses, setParoisses] = useState<ParoisseOpt[]>([]);
  const [grades, setGrades] = useState<GradeOpt[]>([]);
  const [vicariatId, setVicariatId] = useState("");
  const [paroisseId, setParoisseId] = useState("");
  const [editableRows, setEditableRows] = useState<EditableLecteurImportRow[]>([]);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [loadingContext, setLoadingContext] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetForm = useCallback(() => {
    setStep("setup");
    setVicariatId(isVicarialOnly && userVicariatId ? userVicariatId : "");
    setParoisseId("");
    setEditableRows([]);
    setSheetName(null);
    setFileName(null);
    setParseError(null);
    setRowErrors({});
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isVicarialOnly, userVicariatId]);

  useEffect(() => {
    if (!open) return;
    resetForm();
    setLoadingContext(true);

    const fetches: Promise<void>[] = [
      fetch("/api/grades")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setGrades(
              data.map((g: { _id: string; name: string; abbreviation?: string }) => ({
                _id: String(g._id),
                name: g.name,
                abbreviation: g.abbreviation,
              }))
            );
          }
        }),
    ];

    if (isVicarialOnly) {
      if (userVicariatId) setVicariatId(userVicariatId);
      fetches.push(
        fetch("/api/paroisses")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setParoisses(
                data.map((p: { _id: string; name: string; vicariatId?: string }) => ({
                  _id: String(p._id),
                  name: p.name,
                  vicariatId: p.vicariatId ? String(p.vicariatId) : undefined,
                }))
              );
            }
          })
      );
    } else {
      fetches.push(
        fetch("/api/vicariats")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setVicariats(
                data.map((v: { _id: string; name: string }) => ({
                  _id: String(v._id),
                  name: v.name,
                }))
              );
            }
          })
      );
    }

    void Promise.all(fetches).finally(() => setLoadingContext(false));
  }, [open, isVicarialOnly, userVicariatId, resetForm]);

  useEffect(() => {
    if (!open || isVicarialOnly || !vicariatId) {
      if (!isVicarialOnly) setParoisses([]);
      return;
    }

    let cancelled = false;
    void fetch(`/api/paroisses?vicariatId=${encodeURIComponent(vicariatId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setParoisses(
            data.map((p: { _id: string; name: string }) => ({
              _id: String(p._id),
              name: p.name,
              vicariatId,
            }))
          );
        } else {
          setParoisses([]);
        }
      })
      .catch(() => {
        if (!cancelled) setParoisses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, vicariatId, isVicarialOnly]);

  const filteredParoisses = useMemo(() => {
    if (isVicarialOnly) return paroisses;
    if (!vicariatId) return [];
    return paroisses.filter((p) => !p.vicariatId || p.vicariatId === vicariatId);
  }, [paroisses, vicariatId, isVicarialOnly]);

  const invalidRowCount = Object.keys(rowErrors).length;

  const handleFileChange = async (file: File | null) => {
    setParseError(null);
    setRowErrors({});
    setResult(null);
    setFileName(file?.name ?? null);

    if (!file) return;

    setParsingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseLecteurImportWorkbookForPreview(buffer);
      if (!parsed.ok) {
        setParseError(parsed.error);
        setEditableRows([]);
        setSheetName(null);
        return;
      }
      const gradeOpts = grades.map((g) => ({ name: g.name, abbreviation: g.abbreviation }));
      setEditableRows(
        parsed.rows.map((row) => ({
          ...row,
          grade: matchGradeFromImportText(row.grade, gradeOpts),
        }))
      );
      setSheetName(parsed.sheetName);
      setStep("preview");
    } catch {
      setParseError("Impossible de lire le fichier.");
      setEditableRows([]);
      setSheetName(null);
    } finally {
      setParsingFile(false);
    }
  };

  const updateRow = (index: number, field: keyof Omit<EditableLecteurImportRow, "excelLine">, value: string) => {
    setEditableRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    setRowErrors((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const deleteRow = (index: number) => {
    setEditableRows((prev) => prev.filter((_, i) => i !== index));
    setRowErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, message]) => {
        const i = Number(key);
        if (i < index) next[i] = message;
        else if (i > index) next[i - 1] = message;
      });
      return next;
    });
  };

  const validateAllRows = (): LecteurImportRow[] | null => {
    const errors: Record<number, string> = {};
    const apiRows: LecteurImportRow[] = [];

    const gradeOpts = grades.map((g) => ({ name: g.name, abbreviation: g.abbreviation }));

    editableRows.forEach((row, index) => {
      if (row.grade.trim() && !isKnownGradeName(row.grade, gradeOpts)) {
        errors[index] = `Grade « ${row.grade} » introuvable. Choisissez un grade dans la liste.`;
        return;
      }
      const converted = convertEditableToImportRow(row);
      if (!converted.ok) {
        errors[index] = converted.message;
      } else {
        apiRows.push(converted.data);
      }
    });

    setRowErrors(errors);
    if (Object.keys(errors).length > 0) return null;
    return apiRows;
  };

  const handleImport = async () => {
    if (!vicariatId || !paroisseId || !editableRows.length) return;

    const apiRows = validateAllRows();
    if (!apiRows) {
      setParseError("Corrigez les lignes en erreur avant de valider l'import.");
      return;
    }

    setParseError(null);
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/lecteurs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vicariatId, paroisseId, rows: apiRows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import impossible");

      setResult(data as ImportResult);
      setStep("result");
      if ((data as ImportResult).created > 0) onImported();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setImporting(false);
    }
  };

  const backToSetup = () => {
    setStep("setup");
    setEditableRows([]);
    setSheetName(null);
    setFileName(null);
    setRowErrors({});
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPreview = step === "preview";
  const isResult = step === "result";
  const canSubmit = Boolean(
    vicariatId && paroisseId && editableRows.length && !importing && !isResult
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent
        className={
          isPreview
            ? "flex h-[96vh] max-h-[96vh] w-[98vw] max-w-none flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-none"
            : "w-full max-w-3xl rounded-3xl sm:max-w-3xl"
        }
      >
        <div className={isPreview ? "shrink-0 border-b border-slate-100 px-8 py-6" : undefined}>
          <DialogHeader className={isPreview ? "text-left" : undefined}>
            <DialogTitle className={isPreview ? "text-xl" : undefined}>
              {isPreview ? "Vérification avant import" : "Importer des lecteurs"}
            </DialogTitle>
            <DialogDescription>
              {isPreview ? (
                <>
                  Onglet <span className="font-semibold text-slate-700">« {sheetName} »</span>
                  {fileName ? (
                    <>
                      {" "}
                      · <span className="font-medium text-slate-600">{fileName}</span>
                    </>
                  ) : null}
                  . Modifiez les données ci-dessous puis validez l&apos;import.
                </>
              ) : (
                <>
                  Sélectionnez le vicariat et la paroisse, puis chargez le fichier Excel. L&apos;année
                  d&apos;adhésion, les contacts et les maux particuliers sont facultatifs.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {loadingContext ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-900" />
          </div>
        ) : (
          <div
            className={
              isPreview
                ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-8 py-5"
                : "space-y-4 px-6 pb-2"
            }
          >
            {!isResult && !isPreview ? (
              <div className="space-y-4">
                {!isVicarialOnly ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                      Vicariat
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium text-slate-800 focus:border-amber-900 focus:outline-none"
                      value={vicariatId}
                      onChange={(e) => {
                        setVicariatId(e.target.value);
                        setParoisseId("");
                      }}
                    >
                      <option value="">Choisir un vicariat…</option>
                      {vicariats.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Paroisse
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium text-slate-800 focus:border-amber-900 focus:outline-none disabled:opacity-50"
                    value={paroisseId}
                    onChange={(e) => setParoisseId(e.target.value)}
                    disabled={!isVicarialOnly && !vicariatId}
                  >
                    <option value="">Choisir une paroisse…</option>
                    {filteredParoisses.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Fichier Excel
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-center gap-2 rounded-xl"
                    disabled={parsingFile || !vicariatId || !paroisseId}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {parsingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {fileName ?? "Choisir un fichier…"}
                  </Button>
                  {!vicariatId || !paroisseId ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Sélectionnez d&apos;abord le vicariat et la paroisse.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isPreview && editableRows.length ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="font-semibold text-slate-700">
                    {editableRows.length} lecteur{editableRows.length > 1 ? "s" : ""} à importer
                  </p>
                  {invalidRowCount > 0 ? (
                    <p className="font-medium text-red-600">
                      {invalidRowCount} ligne{invalidRowCount > 1 ? "s" : ""} à corriger
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Prêt pour l&apos;import
                    </p>
                  )}
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <LecteurImportPreviewTable
                    rows={editableRows}
                    grades={grades.map((g) => ({ name: g.name, abbreviation: g.abbreviation }))}
                    rowErrors={rowErrors}
                    onChange={updateRow}
                    onDelete={deleteRow}
                  />
                </div>
                {invalidRowCount > 0 ? (
                  <ul className="max-h-24 shrink-0 space-y-1 overflow-y-auto rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {Object.entries(rowErrors).map(([index, message]) => (
                      <li key={index}>
                        Ligne Excel {editableRows[Number(index)]?.excelLine ?? "?"} : {message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {parseError ? (
              <p className="flex items-start gap-1.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {parseError}
              </p>
            ) : null}

            {isResult && result ? (
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  result.failed ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <p className="font-bold text-slate-800">
                  {result.created} lecteur{result.created > 1 ? "s" : ""} importé{result.created > 1 ? "s" : ""}
                  {result.failed ? ` · ${result.failed} échec${result.failed > 1 ? "s" : ""}` : ""}
                </p>
                {result.errors.length ? (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-slate-600">
                    {result.errors.map((err) => (
                      <li key={`${err.row}-${err.message}`}>
                        Ligne {err.row} : {err.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter
          className={
            isPreview
              ? "shrink-0 gap-2 border-t border-slate-100 bg-slate-50/80 px-8 py-5 sm:justify-between"
              : "gap-2 px-6 pb-6 sm:gap-0 flex-col sm:flex-row"
          }
        >
          {isPreview ? (
            <Button type="button" variant="outline" className="rounded-xl gap-1.5" onClick={backToSetup}>
              <ArrowLeft className="h-4 w-4" />
              Changer de fichier
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                void downloadLecteurImportTemplate(
                  grades.map((g) => ({
                    name: g.name,
                    abbreviation: g.abbreviation ?? g.name.slice(0, 3).toUpperCase(),
                  }))
                )
              }
              disabled={!grades.length}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Télécharger le template
            </Button>
          )}

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              {isResult ? "Fermer" : "Annuler"}
            </Button>
            {isPreview && !isResult ? (
              <Button
                type="button"
                className="flex-1 rounded-xl bg-amber-900 hover:bg-amber-800 sm:flex-none"
                disabled={!canSubmit || invalidRowCount > 0}
                onClick={() => void handleImport()}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider l'import"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
