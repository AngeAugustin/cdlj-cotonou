"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Banknote,
  Scale,
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardPanel } from "@/components/dashboard/page-shell";
import { absolutePublicUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";
import { validateGrillePenalite } from "../penalites";
import {
  GrillePenaliteEditor,
  rowsFromGrille,
  rowsToPayload,
  type PalierFormRow,
} from "./GrillePenaliteEditor";

export type ActiviteFormInitial = {
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
  delaiPaiement: string;
  grillePenalite?: {
    dateDebut: string | Date;
    dateFin: string | Date;
    montantSupplementaire: number;
  }[];
  image?: string;
};

const STEPS_META = [
  { title: "Activité", subtitle: "Nom, période, lieu et visuel", icon: Activity },
  { title: "Tarification", subtitle: "Montant et délai de paiement", icon: Banknote },
  { title: "Pénalités", subtitle: "Grille après le délai", icon: Scale },
] as const;

function isoToDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

function isoToDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function emptyForm(): {
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: string;
  delaiPaiement: string;
  image: string;
} {
  return {
    nom: "",
    dateDebut: "",
    dateFin: "",
    lieu: "",
    montant: "",
    delaiPaiement: "",
    image: "",
  };
}

function initialToFormState(initial?: ActiviteFormInitial | null) {
  if (!initial) return emptyForm();
  return {
    nom: initial.nom,
    dateDebut: isoToDateInput(initial.dateDebut),
    dateFin: isoToDateInput(initial.dateFin),
    lieu: initial.lieu,
    montant: String(initial.montant),
    delaiPaiement: isoToDatetimeLocal(initial.delaiPaiement),
    image: initial.image ?? "",
  };
}

function validateStep0(form: ReturnType<typeof emptyForm>): string | null {
  if (!form.nom.trim()) return "Le nom de l'activité est requis.";
  if (!form.dateDebut) return "La date de début est requise.";
  if (!form.dateFin) return "La date de fin est requise.";
  if (form.dateFin < form.dateDebut) return "La date de fin doit être postérieure ou égale à la date de début.";
  if (!form.lieu.trim()) return "Le lieu est requis.";
  return null;
}

function validateStep1(form: ReturnType<typeof emptyForm>): string | null {
  if (form.montant === "" || Number.isNaN(Number(form.montant)) || Number(form.montant) < 0) {
    return "Le montant initial est requis (0 pour une activité gratuite).";
  }
  if (!form.delaiPaiement) return "Le délai de paiement est requis.";
  return null;
}

function validateStep2(
  form: ReturnType<typeof emptyForm>,
  paliers: PalierFormRow[]
): string | null {
  if (paliers.length === 0) return null;
  const incomplete = paliers.some(
    (p) => !p.dateDebut || !p.dateFin || p.montantSupplementaire === "" || Number.isNaN(Number(p.montantSupplementaire))
  );
  if (incomplete) {
    return "Complétez toutes les lignes de la grille de pénalités ou supprimez les paliers incomplets.";
  }
  return validateGrillePenalite(new Date(form.delaiPaiement).toISOString(), rowsToPayload(paliers));
}

export function ActiviteForm({
  mode = "create",
  variant = "page",
  activiteId,
  initialData,
  onSuccess,
  onCancel,
  onError,
}: {
  mode?: "create" | "edit";
  variant?: "page" | "modal";
  activiteId?: string;
  initialData?: ActiviteFormInitial | null;
  onSuccess?: (message: string) => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
}) {
  const isPage = variant === "page";
  const lastStepIndex = STEPS_META.length - 1;
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(mode === "edit" ? lastStepIndex : 0);
  const [form, setForm] = useState(() => initialToFormState(initialData));
  const [paliers, setPaliers] = useState<PalierFormRow[]>(() => rowsFromGrille(initialData?.grillePenalite));
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const activeStep = STEPS_META[step];
  const ActiveStepIcon = activeStep.icon;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStepError(null);
  };

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index > lastStepIndex) return;
      if (index <= furthestStep || index <= step || mode === "edit") setStep(index);
    },
    [furthestStep, step, lastStepIndex, mode]
  );

  const validateCurrentStep = (): boolean => {
    let err: string | null = null;
    if (step === 0) err = validateStep0(form);
    else if (step === 1) err = validateStep1(form);
    else if (step === 2) err = validateStep2(form, paliers);

    if (err) {
      setStepError(err);
      return false;
    }
    setStepError(null);
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (step < lastStepIndex) {
      const next = step + 1;
      setStep(next);
      setFurthestStep((f) => Math.max(f, next));
    }
  };

  const goPrev = () => {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        set("image", data.url);
        setStepError(null);
      } else {
        setStepError(data.error ?? "Échec du téléversement");
      }
    } catch {
      setStepError("Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    for (let i = 0; i <= 2; i++) {
      let err: string | null = null;
      if (i === 0) err = validateStep0(form);
      else if (i === 1) err = validateStep1(form);
      else err = validateStep2(form, paliers);
      if (err) {
        setStep(i);
        setStepError(err);
        return;
      }
    }
    setStepError(null);

    setSubmitting(true);
    const payload = {
      nom: form.nom.trim(),
      dateDebut: new Date(form.dateDebut).toISOString(),
      dateFin: new Date(form.dateFin).toISOString(),
      lieu: form.lieu.trim(),
      montant: Number(form.montant),
      delaiPaiement: new Date(form.delaiPaiement).toISOString(),
      grillePenalite: rowsToPayload(paliers),
      image: form.image.trim() || undefined,
    };
    try {
      const url = mode === "edit" && activiteId ? `/api/activites/${activiteId}` : "/api/activites";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSuccess?.(mode === "edit" ? "Activité mise à jour" : "Activité créée");
      } else {
        const err = await res.json().catch(() => ({}));
        const message = err.error ?? "Erreur lors de l'enregistrement";
        setStepError(message);
        onError?.(message);
      }
    } catch {
      const message = "Erreur inattendue";
      setStepError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const imageFields = (
    <div
      className={cn(
        "rounded-2xl border border-amber-100/80 bg-amber-50/20 p-4",
        isPage && "lg:p-5 lg:bg-gradient-to-br lg:from-amber-50/70 lg:to-white"
      )}
    >
      <Label className={cn(isPage && "font-semibold text-slate-800")}>Image de l&apos;activité</Label>
      <p className="mt-1 text-xs text-slate-500">Facultatif — affichée sur la liste et la fiche.</p>
      <div className="mt-3 flex flex-col gap-3">
        {form.image ? (
          <img
            src={absolutePublicUrl(form.image) ?? form.image}
            alt="Aperçu de l'activité"
            className={cn(
              "h-36 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-cover",
              isPage && "mx-auto sm:h-44 lg:h-52 lg:w-full"
            )}
          />
        ) : isPage ? (
          <div className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-amber-200/80 bg-white/80 px-4 text-center sm:h-44 lg:h-52">
            <p className="text-xs font-medium text-slate-400">Aucune image sélectionnée</p>
          </div>
        ) : null}
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-amber-50">
          <Upload className="h-4 w-4" />
          {uploading ? "Envoi…" : form.image ? "Changer l'image" : "Choisir une image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => void handleImage(e)}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );

  const step0Fields = (
    <div className={cn(isPage && "grid grid-cols-1 gap-5 lg:grid-cols-3")}>
      <div className={cn("space-y-5", isPage && "lg:col-span-2")}>
        <div>
          <Label htmlFor="fnom" className={cn(isPage && "font-semibold text-slate-800")}>
            Nom de l&apos;activité <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fnom"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
            placeholder="Ex. Retraite diocésaine des lecteurs juniors"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fdebut" className={cn(isPage && "font-semibold text-slate-800")}>
              Date de début <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fdebut"
              type="date"
              value={form.dateDebut}
              onChange={(e) => set("dateDebut", e.target.value)}
              className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
            />
          </div>
          <div>
            <Label htmlFor="ffin" className={cn(isPage && "font-semibold text-slate-800")}>
              Date de fin <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ffin"
              type="date"
              value={form.dateFin}
              min={form.dateDebut || undefined}
              onChange={(e) => set("dateFin", e.target.value)}
              className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="flieu" className={cn(isPage && "font-semibold text-slate-800")}>
            Lieu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="flieu"
            value={form.lieu}
            onChange={(e) => set("lieu", e.target.value)}
            className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
            placeholder="Ex. Centre pastoral Saint Jean, Cotonou"
          />
        </div>
      </div>
      {imageFields}
    </div>
  );

  const step1Fields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="fmontant" className={cn(isPage && "font-semibold text-slate-800")}>
          Montant initial (FCFA) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fmontant"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.montant}
          onChange={(e) => set("montant", e.target.value.replace(/\D/g, ""))}
          className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
          placeholder="0 pour une activité gratuite"
        />
      </div>
      <div>
        <Label htmlFor="fdelai" className={cn(isPage && "font-semibold text-slate-800")}>
          Délai de paiement <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fdelai"
          type="datetime-local"
          value={form.delaiPaiement}
          onChange={(e) => set("delaiPaiement", e.target.value)}
          className={cn("mt-1.5 rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")}
        />
      </div>
    </div>
  );

  const step2Fields = (
    <GrillePenaliteEditor
      rows={paliers}
      onChange={(rows) => {
        setPaliers(rows);
        setStepError(null);
      }}
      delaiPaiement={form.delaiPaiement}
      isPage={isPage}
      error={!isPage && step === 2 ? stepError : null}
    />
  );

  const formErrorBanner = stepError ? (
    <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{stepError}</span>
    </div>
  ) : null;

  const allFields = (
    <div className={cn("space-y-5", isPage && "px-6 py-6 sm:px-8")}>
      {formErrorBanner}
      {step0Fields}
      {step1Fields}
      <GrillePenaliteEditor
        rows={paliers}
        onChange={(rows) => {
          setPaliers(rows);
          setStepError(null);
        }}
        delaiPaiement={form.delaiPaiement}
        isPage={isPage}
        error={stepError}
      />
    </div>
  );

  const pageNavigation = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
      <div className="flex flex-wrap gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" className="gap-1 rounded-xl" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
        ) : null}
        {onCancel ? (
          <Button type="button" variant="ghost" className="rounded-xl text-slate-600" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {step < lastStepIndex ? (
          <Button
            type="button"
            className="gap-1 rounded-xl bg-amber-900 font-bold hover:bg-amber-800"
            onClick={goNext}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={submitting}
            className="min-w-[200px] rounded-xl bg-amber-900 px-8 font-bold text-white hover:bg-amber-800"
            onClick={() => void submit()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : mode === "edit" ? (
              "Enregistrer les modifications"
            ) : (
              "Créer l'activité"
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-white pt-4 sm:flex-row sm:items-center sm:justify-end">
      {onCancel ? (
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
      ) : null}
      <Button
        type="button"
        disabled={submitting}
        className="rounded-xl bg-amber-900 text-white hover:bg-amber-800"
        onClick={() => void submit()}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
      </Button>
    </div>
  );

  if (isPage) {
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="relative rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50/90 via-white to-amber-50/20 p-4 shadow-sm sm:p-6">
          <div className="-mx-1 flex items-start justify-between gap-1 overflow-x-auto px-1 pb-2 sm:gap-2">
            {STEPS_META.map((meta, index) => {
              const Icon = meta.icon;
              const isActive = step === index;
              const reachable = index <= furthestStep || index <= step;
              const canNavigate = reachable || mode === "edit";
              const showCheck = index < step;

              return (
                <div key={meta.title} className="flex min-w-0 flex-1 items-start">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    disabled={!canNavigate && mode === "create"}
                    className={cn(
                      "group flex w-full min-w-[4.5rem] flex-col items-center gap-2 transition-opacity sm:min-w-[5.5rem]",
                      canNavigate ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-200 sm:h-14 sm:w-14",
                        isActive
                          ? "scale-105 border-amber-900 bg-amber-900 text-white shadow-lg shadow-amber-900/25"
                          : showCheck
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-400 group-hover:border-amber-300 group-hover:text-amber-800"
                      )}
                    >
                      {showCheck && !isActive ? (
                        <Check className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                      )}
                    </span>
                    <span className="px-0.5 text-center">
                      <span
                        className={cn(
                          "block text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-xs",
                          isActive ? "text-amber-950" : "text-slate-500"
                        )}
                      >
                        {meta.title}
                      </span>
                      <span className="mt-0.5 hidden text-[10px] leading-snug text-slate-400 sm:block">{meta.subtitle}</span>
                    </span>
                  </button>
                  {index < lastStepIndex ? (
                    <div
                      className={cn(
                        "mx-1 mt-6 hidden h-0.5 min-w-[8px] flex-1 rounded-full transition-colors sm:mt-7 sm:block",
                        index < step ? "bg-emerald-400" : "bg-slate-200"
                      )}
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-sm text-slate-500 sm:hidden">
            Étape {step + 1}/{STEPS_META.length} · {STEPS_META[step].title}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 px-4 py-3 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-white shadow-sm">
            <ActiveStepIcon className="h-5 w-5 text-amber-900" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800/60">
              Étape {step + 1} sur {STEPS_META.length}
            </p>
            <h3 className="text-base font-extrabold text-slate-900">{activeStep.title}</h3>
            <p className="text-sm text-slate-500">{activeStep.subtitle}</p>
          </div>
        </div>

        <DashboardPanel className="overflow-hidden p-0">
          <div className="space-y-5 px-6 py-6 sm:px-8">
            {formErrorBanner}
            {step === 0 ? step0Fields : null}
            {step === 1 ? step1Fields : null}
            {step === 2 ? step2Fields : null}
          </div>
        </DashboardPanel>

        {pageNavigation}
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {allFields}
      {modalFooter}
    </form>
  );
}
