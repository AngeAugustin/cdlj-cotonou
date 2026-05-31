"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
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
  downloadLecteurImportTemplate,
  parseLecteurImportWorkbook,
  type LecteurImportRow,
} from "@/modules/lecteurs/importExcel";

type VicariatOpt = { _id: string; name: string };
type ParoisseOpt = { _id: string; name: string; vicariatId?: string };
type GradeOpt = { _id: string; name: string; abbreviation?: string };

type ImportResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

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

  const [vicariats, setVicariats] = useState<VicariatOpt[]>([]);
  const [paroisses, setParoisses] = useState<ParoisseOpt[]>([]);
  const [grades, setGrades] = useState<GradeOpt[]>([]);
  const [vicariatId, setVicariatId] = useState("");
  const [paroisseId, setParoisseId] = useState("");
  const [parsedRows, setParsedRows] = useState<LecteurImportRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetForm = useCallback(() => {
    setVicariatId(isVicarialOnly && userVicariatId ? userVicariatId : "");
    setParoisseId("");
    setParsedRows(null);
    setFileName(null);
    setParseError(null);
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

    return () => { cancelled = true; };
  }, [open, vicariatId, isVicarialOnly]);

  const filteredParoisses = useMemo(() => {
    if (isVicarialOnly) return paroisses;
    if (!vicariatId) return [];
    return paroisses.filter((p) => !p.vicariatId || p.vicariatId === vicariatId);
  }, [paroisses, vicariatId, isVicarialOnly]);

  const handleFileChange = async (file: File | null) => {
    setParseError(null);
    setParsedRows(null);
    setResult(null);
    setFileName(file?.name ?? null);

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseLecteurImportWorkbook(buffer);
      if (!parsed.ok) {
        setParseError(parsed.error);
        return;
      }
      setParsedRows(parsed.rows);
    } catch {
      setParseError("Impossible de lire le fichier.");
    }
  };

  const handleImport = async () => {
    if (!vicariatId || !paroisseId || !parsedRows?.length) return;

    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/lecteurs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vicariatId, paroisseId, rows: parsedRows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import impossible");

      setResult(data as ImportResult);
      if ((data as ImportResult).created > 0) onImported();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setImporting(false);
    }
  };

  const canSubmit = Boolean(vicariatId && paroisseId && parsedRows?.length && !importing && !result);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des lecteurs</DialogTitle>
          <DialogDescription>
            Sélectionnez le vicariat et la paroisse, puis chargez le fichier Excel rempli.
          </DialogDescription>
        </DialogHeader>

        {loadingContext ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
          </div>
        ) : (
          <div className="space-y-4">
            {!isVicarialOnly ? (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                  Vicariat
                </label>
                <select
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-amber-900"
                  value={vicariatId}
                  onChange={(e) => {
                    setVicariatId(e.target.value);
                    setParoisseId("");
                  }}
                >
                  <option value="">Choisir un vicariat…</option>
                  {vicariats.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                Paroisse
              </label>
              <select
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-amber-900 disabled:opacity-50"
                value={paroisseId}
                onChange={(e) => setParoisseId(e.target.value)}
                disabled={!isVicarialOnly && !vicariatId}
              >
                <option value="">Choisir une paroisse…</option>
                {filteredParoisses.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
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
                className="w-full rounded-xl h-11 justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                {fileName ?? "Choisir un fichier…"}
              </Button>
              {parsedRows ? (
                <p className="mt-2 text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {parsedRows.length} lecteur{parsedRows.length > 1 ? "s" : ""} prêt{parsedRows.length > 1 ? "s" : ""} à importer
                </p>
              ) : null}
              {parseError ? (
                <p className="mt-2 text-sm text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {parseError}
                </p>
              ) : null}
            </div>

            {result ? (
              <div className={`rounded-2xl border p-4 text-sm ${result.failed ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="font-bold text-slate-800">
                  {result.created} lecteur{result.created > 1 ? "s" : ""} importé{result.created > 1 ? "s" : ""}
                  {result.failed ? ` · ${result.failed} échec${result.failed > 1 ? "s" : ""}` : ""}
                </p>
                {result.errors.length ? (
                  <ul className="mt-2 space-y-1 text-slate-600 max-h-32 overflow-y-auto">
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

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
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
            Télécharger le template
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              {result ? "Fermer" : "Annuler"}
            </Button>
            {!result ? (
              <Button
                type="button"
                className="rounded-xl bg-amber-900 hover:bg-amber-800 flex-1 sm:flex-none"
                disabled={!canSubmit}
                onClick={() => void handleImport()}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importer"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
