"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, CheckCircle, Loader2, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Role = string;

type EvaluationDetails = {
  _id: string;
  nom: string;
  annee: number;
  nombreNotes: number;
  terminee: boolean;
  publiee: boolean;
  gradeId?: { _id: string; name: string; abbreviation: string; level: number };
  activiteId?: {
    _id: string;
    nom: string;
    dateDebut: string | Date;
    dateFin: string | Date;
    lieu: string;
    montant?: number;
    image?: string;
  };
};

type ReaderRow = {
  _id: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    sexe: "M" | "F";
    gradeIdAtEvaluation?: { _id: string; name: string; abbreviation: string; level: number };
  };
  vicariat?: { _id: string; name: string; abbreviation: string };
  paroisse?: { _id: string; name: string };
  notes: Array<{ noteIndex: number; valeur?: number; validated: boolean }>;
  moyenne?: number;
  decision?: "PROMU" | "MAINTENU" | string;
};

type Toast = { message: string; type: "success" | "error" };

function formatDecision(d?: string) {
  if (!d) return "—";
  if (d === "PROMU") return "Promu";
  if (d === "MAINTENU") return "Maintenu";
  return String(d);
}

export default function EvaluationDetailsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const { data: session, status } = useSession();
  const user = session?.user as { roles?: Role[] } | undefined;
  const roles = user?.roles ?? [];
  const canManage = roles.some((r) => ["DIOCESAIN", "SUPERADMIN"].includes(r));

  const [evaluation, setEvaluation] = useState<EvaluationDetails | null>(null);
  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [vicariats, setVicariats] = useState<{ _id: string; name: string; abbreviation: string }[]>([]);
  const [paroisses, setParoisses] = useState<{ _id: string; name: string }[]>([]);
  const [vicariatId, setVicariatId] = useState<string>("");
  const [paroisseId, setParoisseId] = useState<string>("");

  // Modal de modification globale des notes d’un lecteur.
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [modifyTarget, setModifyTarget] = useState<ReaderRow | null>(null);
  const [modifyValues, setModifyValues] = useState<Record<string, string>>({});
  const [savingModify, setSavingModify] = useState(false);

  // Modal d’ajout d’une seule note.
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<ReaderRow | null>(null);
  const [addNoteIndex, setAddNoteIndex] = useState<number>(1);
  const [addValue, setAddValue] = useState<string>("");
  const [savingAdd, setSavingAdd] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchEvaluation = useCallback(async () => {
    const res = await fetch(`/api/evaluations/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Impossible de charger l'évaluation");
    setEvaluation(data as EvaluationDetails);
  }, [id]);

  const fetchVicariats = useCallback(async () => {
    const res = await fetch("/api/vicariats");
    const data = await res.json().catch(() => []);
    if (Array.isArray(data)) setVicariats(data);
  }, []);

  const fetchParoisses = useCallback(async (vid: string) => {
    const url = vid ? `/api/paroisses?vicariatId=${encodeURIComponent(vid)}` : "/api/paroisses";
    const res = await fetch(url);
    const data = await res.json().catch(() => []);
    if (Array.isArray(data)) setParoisses(data);
  }, []);

  const fetchReaders = useCallback(async () => {
    const params = new URLSearchParams();
    if (vicariatId) params.set("vicariatId", vicariatId);
    if (paroisseId) params.set("paroisseId", paroisseId);

    const url = params.toString() ? `/api/evaluations/${id}/lecteurs?${params.toString()}` : `/api/evaluations/${id}/lecteurs`;

    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Impossible de charger les lecteurs");

    const apiMembers = Array.isArray(data.members) ? data.members : [];
    setReaders(apiMembers as ReaderRow[]);

    // Les valeurs de note sont gérées via les modales (ajout/modification),
    // donc aucun "draft" UI n’est conservé.
  }, [id, vicariatId, paroisseId]);

  const hasFetchedInitialReadersRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Optimisation: charger l'évaluation + les lecteurs en parallèle.
        // Les listes de filtres sont lancées ensuite (sans bloquer le rendu principal).
        const readersPromise = fetchReaders();
        const evaluationPromise = fetchEvaluation();

        await Promise.all([evaluationPromise, readersPromise]);

        hasFetchedInitialReadersRef.current = true;

        if (canManage) {
          void (async () => {
            try {
              await fetchVicariats();
              await fetchParoisses(vicariatId);
            } catch {
              // Si les listes de filtres échouent, on garde l'affichage principal.
            }
          })();
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!canManage) return;
    void (async () => {
      await fetchParoisses(vicariatId);
      setParoisseId("");
    })();
  }, [vicariatId, canManage, fetchParoisses]);

  useEffect(() => {
    if (!id) return;
    // Evite un double chargement au mount: le premier chargement est fait dans le useEffect ci-dessus.
    if (!hasFetchedInitialReadersRef.current) return;
    void fetchReaders();
  }, [id, vicariatId, paroisseId, fetchReaders]);

  // ─────────────────────────────────────────────
  // Termination / Publication
  // ─────────────────────────────────────────────
  const [termineeModalOpen, setTermineeModalOpen] = useState(false);
  const [publierModalOpen, setPublierModalOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  type TerminationMissingByReader = {
    lecteurId: string;
    nomPrenoms: string;
    missingNoteIndexes: number[];
    missingCount: number;
  };

  const [terminationPreview, setTerminationPreview] = useState<{
    missingByReader: TerminationMissingByReader[];
  } | null>(null);

  const [zeroNotesModalOpen, setZeroNotesModalOpen] = useState(false);
  const [zeroNotesPreview, setZeroNotesPreview] = useState<TerminationMissingByReader[] | null>(null);

  const confirmTerminer = async () => {
    setTerminating(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/terminer`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Opération impossible");
      showToast("Évaluation terminée (moyennes calculées)");
      await fetchEvaluation();
      await fetchReaders();
      setTerminationPreview(null);
      setZeroNotesPreview(null);
      setZeroNotesModalOpen(false);
      setTermineeModalOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setTerminating(false);
    }
  };

  const requestTerminer = () => {
    if (!evaluation) return;
    if (evaluation.terminee) return;

    const maxNotes = evaluation.nombreNotes;
    const perReader = readers.map((row) => {
      const validatedCount = row.notes.filter((n) => n.validated).length;
      const missingNoteIndexes = row.notes.filter((n) => !n.validated).map((n) => n.noteIndex);
      const missingCount = missingNoteIndexes.length;
      return { row, validatedCount, missingNoteIndexes, missingCount };
    });

    if (perReader.some((r) => r.validatedCount === 0)) {
      const missingAll = perReader.filter((r) => r.validatedCount === 0);
      setZeroNotesPreview(
        missingAll.map((r) => ({
          lecteurId: r.row._id,
          nomPrenoms: `${r.row.lecteur.nom} ${r.row.lecteur.prenoms}`,
          missingNoteIndexes: r.missingNoteIndexes,
          missingCount: r.missingCount,
        }))
      );
      setZeroNotesModalOpen(true);
      return;
    }

    const partial = perReader.filter((r) => r.validatedCount > 0 && r.validatedCount < maxNotes);

    if (partial.length > 0) {
      setTerminationPreview({
        missingByReader: partial.map((r) => ({
          lecteurId: r.row._id,
          nomPrenoms: `${r.row.lecteur.nom} ${r.row.lecteur.prenoms}`,
          missingNoteIndexes: r.missingNoteIndexes,
          missingCount: r.missingCount,
        })),
      });
    } else {
      setTerminationPreview(null);
    }

    setTermineeModalOpen(true);
  };

  const confirmPublier = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/publier`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Opération impossible");
      showToast("Évaluation publiée");
      await fetchEvaluation();
      setPublierModalOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ─────────────────────────────────────────────
  // NoteKey pour les modales (ajout/modification)
  const noteKey = (lecteurId: string, noteIndex: number) => `${lecteurId}:${noteIndex}`;

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto mt-16">
        <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {loadError}
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const openModifyModal = (row: ReaderRow) => {
    const lecteurId = row.lecteur._id;
    const nextValues: Record<string, string> = {};
    row.notes
      .filter((n) => n.validated)
      .forEach((n) => {
        const k = noteKey(lecteurId, n.noteIndex);
        nextValues[k] = n.valeur !== undefined ? String(n.valeur) : "";
      });

    setModifyTarget(row);
    setModifyValues(nextValues);
    setModifyModalOpen(true);
  };

  const confirmModifyNotes = async () => {
    if (!modifyTarget) return;
    if (!canManage) return;
    if (!evaluation || evaluation.terminee) return;

    const lecteurId = modifyTarget.lecteur._id;
    const toModify = modifyTarget.notes.filter((n) => n.validated);
    if (!toModify.length) {
      showToast("Aucune note à modifier pour ce lecteur", "error");
      return;
    }

    setSavingModify(true);
    try {
      const promises = toModify.map(async (slot) => {
        const raw = modifyValues[noteKey(lecteurId, slot.noteIndex)];
        if (raw === undefined || raw === "") throw new Error(`Entrez la valeur pour la note ${slot.noteIndex}`);
        const value = Number(raw);
        if (!Number.isFinite(value)) throw new Error(`Valeur invalide pour la note ${slot.noteIndex}`);
        if (value < 0 || value > 20) throw new Error(`La note ${slot.noteIndex} doit être comprise entre 0 et 20`);

        const res = await fetch(`/api/evaluations/${id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lecteurId, noteIndex: slot.noteIndex, valeur: value }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Enregistrement impossible");
      });

      await Promise.all(promises);
      showToast("Notes modifiées");
      setModifyModalOpen(false);
      setModifyTarget(null);
      setModifyValues({});
      await fetchReaders();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setSavingModify(false);
    }
  };

  const openAddModal = (row: ReaderRow) => {
    if (!canManage) return;
    if (!evaluation || evaluation.terminee) return;

    const nextSlot = row.notes.find((n) => !n.validated);
    if (!nextSlot) return;

    setAddTarget(row);
    setAddNoteIndex(nextSlot.noteIndex);
    setAddValue("");
    setAddModalOpen(true);
  };

  const confirmAddNote = async () => {
    if (!addTarget) return;
    if (!canManage) return;
    if (!evaluation || evaluation.terminee) return;

    const lecteurId = addTarget.lecteur._id;
    const raw = addValue.trim();
    if (raw === "") {
      showToast("Entrez une valeur de note", "error");
      return;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      showToast("Entrez une valeur de note valide", "error");
      return;
    }
    if (value < 0 || value > 20) {
      showToast("La note doit être comprise entre 0 et 20", "error");
      return;
    }

    setSavingAdd(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecteurId, noteIndex: addNoteIndex, valeur: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enregistrement impossible");

      showToast("Note ajoutée");
      setAddModalOpen(false);
      setAddTarget(null);
      setAddValue("");
      await fetchReaders();
      await fetchEvaluation();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setSavingAdd(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Évaluation</h1>
          <p className="text-slate-500 mt-2 text-lg">
            {evaluation.nom} · {evaluation.annee} · {evaluation.gradeId?.abbreviation ?? "—"} ·{" "}
            {evaluation.activiteId?.nom ?? "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {format(new Date(evaluation.activiteId?.dateDebut ?? new Date()), "PPP", { locale: fr })} —{" "}
            {format(new Date(evaluation.activiteId?.dateFin ?? new Date()), "PPP", { locale: fr })}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2 items-center justify-end">
            {!evaluation.terminee ? (
              <Button type="button" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => requestTerminer()}>
                <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminée
              </Button>
            ) : !evaluation.publiee ? (
              <Button type="button" className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white" onClick={() => setPublierModalOpen(true)}>
                Publier
              </Button>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold text-sm">
                Publiée
              </span>
            )}
          </div>
        ) : null}
      </div>

      {canManage ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Label htmlFor="filter-vic">Filtrer par vicariat</Label>
              <select
                id="filter-vic"
                value={vicariatId}
                onChange={(e) => setVicariatId(e.target.value)}
                className="w-full h-12 px-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900"
              >
                <option value="">Tous</option>
                {vicariats.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.abbreviation} · {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="filter-par">Filtrer par paroisse</Label>
              <select
                id="filter-par"
                value={paroisseId}
                onChange={(e) => setParoisseId(e.target.value)}
                className="w-full h-12 px-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:border-amber-900"
              >
                <option value="">Toutes</option>
                {paroisses.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden">
        {readers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            Aucune entrée pour cette évaluation (avec ces filtres).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                  <th className="p-5 font-semibold">Lecteur</th>
                  <th className="p-5 font-semibold hidden md:table-cell">Vicariat</th>
                  <th className="p-5 font-semibold hidden lg:table-cell">Paroisse</th>
                  <th className="p-5 font-semibold">Notes</th>
                  {!evaluation.terminee ? <th className="p-5 font-semibold text-right">Actions</th> : null}
                  {evaluation.terminee ? <th className="p-5 font-semibold">Moyenne & décision</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {readers.map((row) => (
                  <tr key={row._id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-5">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate">
                          {row.lecteur.nom} {row.lecteur.prenoms}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {row.lecteur.uniqueId} · {row.lecteur.gradeIdAtEvaluation?.abbreviation ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <span className="text-sm font-semibold text-slate-800">{row.vicariat?.name ?? "—"}</span>
                      <div className="text-xs text-slate-500">{row.vicariat?.abbreviation ?? ""}</div>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-slate-800">{row.paroisse?.name ?? "—"}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center">
                        {Array.from({ length: evaluation.nombreNotes }, (_, i) => {
                          const noteIndex = i + 1;
                          const slot = row.notes.find((n) => n.noteIndex === noteIndex);
                          const validated = Boolean(slot?.validated);
                          const value = slot?.valeur;

                          return (
                            <Fragment key={noteKey(row.lecteur._id, noteIndex)}>
                              <div className="flex flex-col items-center min-w-[110px]">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Note {noteIndex}
                                </div>
                                {validated ? (
                                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                                    {value !== undefined ? value.toFixed(1) : "—"}
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600" aria-label="Note manquante" />
                                  </div>
                                )}
                              </div>
                              {i < evaluation.nombreNotes - 1 ? (
                                <div className="w-px h-10 bg-slate-200 mx-3" aria-hidden="true" />
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </div>
                    </td>

                    {!evaluation.terminee ? (
                      <td className="p-5 text-right">
                        {canManage && !evaluation.terminee ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {(() => {
                              const validatedCount = row.notes.filter((n) => n.validated).length;
                              const maxNotes = evaluation.nombreNotes;

                              return (
                                <>
                                  {validatedCount < maxNotes ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="rounded-xl"
                                      onClick={() => openAddModal(row)}
                                    >
                                      Ajouter une note
                                    </Button>
                                  ) : null}
                                  {validatedCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="rounded-xl"
                                      onClick={() => openModifyModal(row)}
                                    >
                                      {savingModify ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                      Modifier
                                    </Button>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        ) : null}
                      </td>
                    ) : null}
                    {evaluation.terminee ? (
                      <td className="p-5">
                        {(() => {
                          const moyenneText = row.moyenne !== undefined ? `${row.moyenne.toFixed(2)}/20` : "—/20";
                          const decision = row.decision;
                          const badge =
                            decision === "PROMU"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : decision === "MAINTENU"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-700 border-slate-200";

                          return (
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-amber-900 whitespace-nowrap">
                                Moyenne : {moyenneText}
                              </p>
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl border text-sm font-bold whitespace-nowrap ${badge}`}>
                                {formatDecision(decision)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal terminée ───────────────────────── */}
      <Dialog open={termineeModalOpen} onOpenChange={(o) => !o && setTermineeModalOpen(false)}>
      <DialogContent showCloseButton={false} className="rounded-3xl w-full sm:max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <DialogTitle className="text-center text-base">Calculer les moyennes et promouvoir ?</DialogTitle>
            <DialogDescription className="text-center">
              Le système calculera la moyenne des notes pour chaque lecteur, puis promouvra ceux dont la moyenne est strictement supérieure à 10.
            </DialogDescription>
          </DialogHeader>

          {terminationPreview && terminationPreview.missingByReader.length > 0 ? (
            <div className="mt-4 text-left">
              <p className="font-bold text-slate-900 mb-2">Notes manquantes détectées</p>
              <div className="space-y-2">
                {terminationPreview.missingByReader.map((m) => (
                  <div key={m.lecteurId} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {m.nomPrenoms} : {m.missingCount} note(s) manquante(s)
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Notes manquantes : {m.missingNoteIndexes.map((idx) => `N${idx}`).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">
                Souhaitez-vous terminer quand même sans ajouter les notes manquantes ?
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermineeModalOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
              disabled={terminating}
              onClick={() => void confirmTerminer()}
            >
              {terminating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : terminationPreview && terminationPreview.missingByReader.length > 0 ? (
                "Terminer quand même"
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal lecteurs sans note ─────────────── */}
      <Dialog
        open={zeroNotesModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setZeroNotesModalOpen(false);
            setZeroNotesPreview(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="rounded-3xl w-full sm:max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Impossible de terminer</DialogTitle>
            <DialogDescription className="text-center">
              Certains lecteurs n’ont aucune note validée. Pour terminer l’évaluation, il faut saisir au moins une note pour chacun.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {zeroNotesPreview?.map((m) => (
              <div
                key={m.lecteurId}
                className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {m.nomPrenoms} : {m.missingCount} note(s) manquante(s)
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Notes manquantes : {m.missingNoteIndexes.map((idx) => `N${idx}`).join(", ")}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setZeroNotesModalOpen(false);
                setZeroNotesPreview(null);
              }}
              className="rounded-xl"
            >
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal publier ────────────────────────── */}
      <Dialog open={publierModalOpen} onOpenChange={(o) => !o && setPublierModalOpen(false)}>
        <DialogContent showCloseButton={false} className="rounded-3xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mx-auto mb-2">
              <Upload className="w-5 h-5 text-amber-700" />
            </div>
            <DialogTitle className="text-center text-base">Publier l’évaluation ?</DialogTitle>
            <DialogDescription className="text-center">
              Après publication, les résultats seront visibles chez les lecteurs évalués.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublierModalOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl"
              disabled={publishing}
              onClick={() => void confirmPublier()}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal modifier notes lecteur ────────── */}
      <Dialog open={modifyModalOpen} onOpenChange={(o) => !o && setModifyModalOpen(false)}>
        <DialogContent showCloseButton={false} className="rounded-3xl max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mx-auto mb-2">
              <Pencil className="w-5 h-5 text-slate-700" />
            </div>
            <DialogTitle className="text-center text-base">Modifier les notes</DialogTitle>
            <DialogDescription className="text-center">
              Ajustez les notes déjà validées pour ce lecteur, puis enregistrez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {modifyTarget ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">
                  {modifyTarget.lecteur.nom} {modifyTarget.lecteur.prenoms}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {modifyTarget.lecteur.uniqueId}
                </p>
              </div>
            ) : null}

            {modifyTarget
              ? modifyTarget.notes
                  .filter((n) => n.validated)
                  .map((slot) => {
                    const k = noteKey(modifyTarget.lecteur._id, slot.noteIndex);
                    return (
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-28">
                          <Label className="text-sm font-bold text-slate-700">Note {slot.noteIndex}</Label>
                        </div>
                        <Input
                          type="number"
                          step={0.5}
                          min={0}
                          max={20}
                          value={modifyValues[k] ?? ""}
                          onChange={(e) => setModifyValues((prev) => ({ ...prev, [k]: e.target.value }))}
                          className="w-32 rounded-xl"
                        />
                      </div>
                    );
                  })
              : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setModifyModalOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl"
              disabled={savingModify}
              onClick={() => void confirmModifyNotes()}
            >
              {savingModify ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal ajout d’une note lecteur ─────── */}
      <Dialog open={addModalOpen} onOpenChange={(o) => !o && setAddModalOpen(false)}>
        <DialogContent showCloseButton={false} className="rounded-3xl max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mx-auto mb-2">
              <span className="text-amber-900 font-extrabold">N</span>
            </div>
            <DialogTitle className="text-center text-base">
              Ajouter la note {addNoteIndex}
            </DialogTitle>
            <DialogDescription className="text-center">
              Renseignez la valeur, puis validez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {addTarget ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">
                  {addTarget.lecteur.nom} {addTarget.lecteur.prenoms}
                </p>
                <p className="text-xs text-slate-500 mt-1">{addTarget.lecteur.uniqueId}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="add-note-value" className="text-sm font-bold text-slate-700">
                Valeur de la note
              </Label>
              <Input
                id="add-note-value"
                type="number"
                step={0.5}
                min={0}
                max={20}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                className="w-full rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setAddModalOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl"
              disabled={savingAdd}
              onClick={() => void confirmAddNote()}
            >
              {savingAdd ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

