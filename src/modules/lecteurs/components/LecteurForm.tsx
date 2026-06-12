"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  User,
  GraduationCap,
  Phone,
  Church,
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { createLecteurSchema, NIVEAU_SCOLAIRE_OPTIONS } from "../schema";
import {
  dateFromDateInputString,
  toDateInputValue,
  toPersistedBirthDateUtcNoon,
} from "../lecteurViewUtils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { absolutePublicUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

/** Valeur interne pour « aucune sélection » (jamais affichée telle quelle à l’écran). */
const SELECT_EMPTY = "__cdlj_empty__";

const lecteurFormInputSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Les prénoms doivent contenir au moins 2 caractères"),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  sexe: z.enum(["M", "F"]),
  gradeId: z.string().optional(),
  anneeAdhesion: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  niveau: z
    .string()
    .refine((v) => (NIVEAU_SCOLAIRE_OPTIONS as readonly string[]).includes(v), {
      message: "Le niveau est requis",
    }),
  details: z.string().optional(),
  contact: z
    .string()
    .refine((v) => v.trim() === "" || v.trim().length >= 8, { message: "Numéro de contact invalide" }),
  contactUrgence: z
    .string()
    .refine((v) => v.trim() === "" || v.trim().length >= 8, {
      message: "Numéro de contact d'urgence invalide",
    }),
  adresse: z.string().min(5, "L'adresse est requise"),
  maux: z.string().optional(),
  photoIdentite: z.string().optional(),
  vicariatId: z.string().min(24, "ID du vicariat invalide"),
  paroisseId: z.string().min(24, "ID de la paroisse invalide"),
});

type FormInput = z.infer<typeof lecteurFormInputSchema>;

export type LecteurFormInitial = {
  _id?: string;
  nom?: string;
  prenoms?: string;
  dateNaissance?: string | Date;
  sexe?: "M" | "F";
  gradeId?: unknown;
  anneeAdhesion?: number;
  niveau?: string;
  details?: string;
  contact?: string;
  contactUrgence?: string;
  adresse?: string;
  maux?: string;
  photoIdentite?: string;
  vicariatId?: unknown;
  paroisseId?: unknown;
};

const STEP_FIELD_GROUPS = [
  ["nom", "prenoms", "dateNaissance", "sexe"] as const,
  ["gradeId", "anneeAdhesion", "niveau", "details"] as const,
  ["vicariatId", "paroisseId"] as const,
  ["contact", "contactUrgence", "adresse", "maux"] as const,
];

const STEPS_META = [
  { title: "Identité", subtitle: "Nom, naissance, pièce d’identité", icon: User },
  { title: "Parcours", subtitle: "Grade et scolarité", icon: GraduationCap },
  { title: "Rattachement", subtitle: "Vicariat et paroisse", icon: Church },
  { title: "Contacts", subtitle: "Coordonnées et santé", icon: Phone },
] as const;

function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as { _id: unknown })._id);
  return "";
}

async function uploadImage(file: File, maxBytes: number, label: string): Promise<string> {
  if (file.size > maxBytes) {
    throw new Error(`${label} : fichier trop volumineux (max ${Math.round(maxBytes / (1024 * 1024))} Mo)`);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Échec de l’envoi du fichier");
  return data.url as string;
}

type GradeOpt = { _id: string; name: string; abbreviation?: string };

function gradeDisplayLabel(value: string, grades: GradeOpt[]): string {
  if (!value || value === SELECT_EMPTY || value.length < 24) return "Non renseigné";
  const g = grades.find((x) => x._id === value);
  if (!g) return value;
  return g.abbreviation ? `${g.name} (${g.abbreviation})` : g.name;
}

function entityDisplayLabel(
  value: string,
  list: { _id: string; name: string }[],
  emptyLabel = "Non renseigné"
): string {
  if (!value || value === SELECT_EMPTY || value.length < 24) return emptyLabel;
  return list.find((x) => x._id === value)?.name ?? emptyLabel;
}

/** Date de naissance API (camelCase ou legacy snake_case). */
function birthDateSource(initial: LecteurFormInitial | null | undefined): string | Date | undefined {
  if (!initial) return undefined;
  const d = initial.dateNaissance;
  if (typeof d === "string") {
    if (d.trim()) return d;
  } else if (d instanceof Date) {
    return d;
  }
  const legacy = (initial as { date_naissance?: string | Date }).date_naissance;
  if (typeof legacy === "string") {
    if (legacy.trim()) return legacy;
  } else if (legacy instanceof Date) {
    return legacy;
  }
  return undefined;
}

export function LecteurForm({
  mode = "create",
  variant = "default",
  lecteurId,
  initialData,
  lockParishVicariat,
  lockGradeId,
  vicariats = [],
  paroisses = [],
  onSuccess,
  onCancel,
}: {
  mode?: "create" | "edit";
  variant?: "default" | "page";
  lecteurId?: string;
  initialData?: LecteurFormInitial | null;
  lockParishVicariat?: {
    vicariatId: string;
    vicariatName?: string;
    paroisseId?: string;
    paroisseName?: string;
  };
  lockGradeId?: boolean;
  vicariats?: { _id: string; name: string }[];
  paroisses?: { _id: string; name: string; vicariatId?: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  /** Dernière étape atteinte après validation (permet de revenir aux étapes déjà validées). */
  const [furthestStep, setFurthestStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<GradeOpt[]>([]);
  const [uploadingId, setUploadingId] = useState(false);

  const lastStepIndex = STEPS_META.length - 1;
  const isPage = variant === "page";
  const activeStep = STEPS_META[step];
  const ActiveStepIcon = activeStep.icon;
  const prevEditLecteurIdRef = useRef<string | undefined>(undefined);
  const lockParoisseId = lockParishVicariat?.paroisseId;
  const lockVicariatId = lockParishVicariat?.vicariatId;

  const form = useForm<FormInput>({
    shouldUnregister: false,
    resolver: zodResolver(lecteurFormInputSchema),
    defaultValues: {
      nom: "",
      prenoms: "",
      dateNaissance: "",
      sexe: "M",
      gradeId: "",
      anneeAdhesion: undefined,
      niveau: "",
      details: "",
      contact: "",
      contactUrgence: "",
      adresse: "",
      maux: "",
      photoIdentite: "",
      vicariatId: lockParishVicariat?.vicariatId ?? "",
      paroisseId: lockParishVicariat?.paroisseId ?? "",
    },
  });

  const watchedVicariatId = form.watch("vicariatId");

  // Filtre dynamique : quand le vicariat change, on n’affiche que ses paroisses.
  const filteredParoisses = useMemo(() => {
    const vid = watchedVicariatId && watchedVicariatId.length >= 24 ? watchedVicariatId : "";
    if (!vid) return [];
    return paroisses.filter((p) => String(p.vicariatId ?? "") === String(vid));
  }, [paroisses, watchedVicariatId]);

  useEffect(() => {
    fetch("/api/grades")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGrades(data.map((g: { _id: string; name: string; abbreviation?: string }) => ({ ...g, _id: String(g._id) })));
        }
      })
      .catch(() => setGrades([]));
  }, []);

  useEffect(() => {
    if (!initialData || mode !== "edit") return;
    const id = String(lecteurId ?? initialData._id ?? "");
    const gid = refId(initialData.gradeId);
    const dateYmd = toDateInputValue(birthDateSource(initialData));
    form.reset({
      nom: initialData.nom ?? "",
      prenoms: initialData.prenoms ?? "",
      dateNaissance: dateYmd,
      sexe: initialData.sexe ?? "M",
      gradeId: gid,
      anneeAdhesion: initialData.anneeAdhesion ?? undefined,
      niveau: initialData.niveau ?? "",
      details: initialData.details ?? "",
      contact: initialData.contact ?? "",
      contactUrgence: initialData.contactUrgence ?? "",
      adresse: initialData.adresse ?? "",
      maux: initialData.maux ?? "",
      photoIdentite: (() => {
        const a = initialData.photoIdentite;
        if (typeof a === "string" && a.trim()) return a.trim();
        const b = (initialData as { photo_identite?: string }).photo_identite;
        if (typeof b === "string" && b.trim()) return b.trim();
        return "";
      })(),
      vicariatId: lockVicariatId ?? refId(initialData.vicariatId),
      paroisseId: lockParoisseId ?? refId(initialData.paroisseId),
    });
    const switchedLecteur = id !== prevEditLecteurIdRef.current;
    prevEditLecteurIdRef.current = id;
    if (switchedLecteur) {
      setStep(0);
      setFurthestStep(lastStepIndex);
    }
    // form.reset est stable ; éviter `form` et l’objet lock entier (réf. instable côté parent avant memo).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lockParoisseId / lockVicariatId + initialData suffisent
  }, [mode, lecteurId, initialData, lockParoisseId, lockVicariatId, lastStepIndex]);

  useEffect(() => {
    if (lockVicariatId) form.setValue("vicariatId", lockVicariatId);
    if (lockParoisseId) form.setValue("paroisseId", lockParoisseId);
  }, [lockParoisseId, lockVicariatId, form]);

  // Si l’utilisateur change de vicariat, on évite de garder une paroisse invalide.
  useEffect(() => {
    if (lockParoisseId) return;

    const vid = form.getValues("vicariatId");
    const pid = form.getValues("paroisseId");
    if (!vid || vid.length < 24) return;
    if (!pid || pid.length < 24) return;

    const allowed = paroisses.some((p) => String(p._id) === String(pid) && String(p.vicariatId ?? "") === String(vid));
    if (!allowed) form.setValue("paroisseId", "");
  }, [lockParoisseId, paroisses, form, watchedVicariatId]);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index > lastStepIndex) return;
      if (index <= furthestStep || index <= step) setStep(index);
    },
    [furthestStep, step, lastStepIndex]
  );

  const goNext = async () => {
    const fields = [...STEP_FIELD_GROUPS[step]];
    const ok = await form.trigger(fields as unknown as (keyof FormInput)[]);
    if (!ok) return;
    if (step < lastStepIndex) {
      const next = step + 1;
      setStep(next);
      setFurthestStep((f) => Math.max(f, next));
    }
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (_values: FormInput) => {
    const values = form.getValues();
    const apiBody = createLecteurSchema.parse({
      ...values,
      dateNaissance: toPersistedBirthDateUtcNoon(dateFromDateInputString(values.dateNaissance)),
      photo: undefined,
      photoIdentite: values.photoIdentite?.trim() || undefined,
      gradeId:
        values.gradeId && values.gradeId !== SELECT_EMPTY && values.gradeId.length >= 24
          ? values.gradeId
          : undefined,
    });

    try {
      setLoading(true);
      const url = mode === "edit" && lecteurId ? `/api/lecteurs/${lecteurId}` : "/api/lecteurs";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(err.error ?? "Erreur serveur");

      onSuccess?.();
      if (mode === "create") {
        router.push("/lecteurs");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    const ok = await form.trigger();
    if (!ok) {
      const firstErrorStep = STEP_FIELD_GROUPS.findIndex((group) =>
        group.some((name) => form.getFieldState(name as keyof FormInput).invalid)
      );
      if (firstErrorStep >= 0) setStep(firstErrorStep);
      return;
    }
    await form.handleSubmit(onSubmit)();
  };

  const onIdFile = async (e: React.ChangeEvent<HTMLInputElement>, onChange: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingId(true);
      const url = await uploadImage(file, 3 * 1024 * 1024, "Photo d’identité");
      onChange(url);
      await form.trigger("photoIdentite");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploadingId(false);
      e.target.value = "";
    }
  };

  return (
    <Form {...form}>
      <form
        className={cn("space-y-6", isPage && "space-y-5")}
        onSubmit={(e) => {
          e.preventDefault();
          /* Ne pas enregistrer ici : Entrée dans un <input> déclenche submit et lancerait l’API sans clic sur le bouton. */
        }}
      >
        {/* Stepper */}
        <div
          className={cn(
            "relative",
            isPage && "rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50/90 via-white to-amber-50/20 p-4 shadow-sm sm:p-6"
          )}
        >
          <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1 sm:gap-2">
            {STEPS_META.map((meta, index) => {
              const Icon = meta.icon;
              const isActive = step === index;
              const reachable = index <= furthestStep || index <= step;
              const showCheck = index < step;

              return (
                <div key={meta.title} className="flex min-w-0 flex-1 items-start">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    disabled={!reachable && mode === "create"}
                    className={cn(
                      "group flex w-full min-w-[4.5rem] flex-col items-center gap-2 transition-opacity sm:min-w-[5.5rem]",
                      reachable || mode === "edit" ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
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

        {isPage ? (
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
        ) : null}

        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            isPage
              ? cn(
                  "rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/20 sm:p-7 md:grid-cols-2",
                  step === 0 && "lg:grid-cols-3"
                )
              : "md:grid-cols-2"
          )}
        >
          {/* Photo d’identité : visible uniquement à l’étape Identité ; valeur conservée via input hidden */}
          <FormField
            control={form.control}
            name="photoIdentite"
            render={({ field }) => (
              <>
                <input type="hidden" {...field} value={field.value ?? ""} />
                {step === 0 ? (
                  <FormItem
                    className={cn(
                      "md:col-span-2 rounded-2xl border border-amber-100/80 bg-amber-50/20 p-4",
                      isPage && "lg:col-span-1 lg:row-span-2 lg:self-start lg:p-5 lg:bg-gradient-to-br lg:from-amber-50/70 lg:to-white"
                    )}
                  >
                    <FormLabel className={cn(isPage && "font-semibold text-slate-800")}>
                      Photo d&apos;identité (max 3 Mo)
                    </FormLabel>
                    <div className="mt-1 flex flex-col gap-3">
                      {field.value ? (
                        <img
                          src={absolutePublicUrl(field.value) ?? field.value}
                          alt="Aperçu photo d’identité"
                          className={cn(
                            "h-36 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain",
                            isPage && "mx-auto lg:h-44 lg:w-full"
                          )}
                        />
                      ) : isPage ? (
                        <div className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-amber-200/80 bg-white/80 px-4 text-center lg:h-44">
                          <p className="text-xs font-medium text-slate-400">Aucune photo sélectionnée</p>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-amber-50">
                          <Upload className="w-4 h-4" />
                          {uploadingId ? "Envoi…" : field.value ? "Changer l’image" : "Choisir une image"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => void onIdFile(e, field.onChange)}
                            disabled={uploadingId}
                          />
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                ) : null}
              </>
            )}
          />

          {/* Étape 0 — Identité */}
          {step === 0 && (
            <div className={cn(isPage && "lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-5 lg:self-start")}>
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem className={cn(isPage && "lg:col-span-1")}>
                    <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de famille" className={cn("rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prenoms"
                render={({ field }) => (
                  <FormItem className={cn(isPage && "lg:col-span-1")}>
                    <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>Prénoms</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénoms" className={cn("rounded-xl", isPage && "h-11 bg-slate-50/80 focus:bg-white")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className={cn("flex flex-col gap-6 md:col-span-2 md:flex-row md:items-end", isPage && "lg:col-span-2 lg:flex-col lg:items-stretch")}>
                <FormField
                  control={form.control}
                  name="dateNaissance"
                  render={({ field }) => (
                    <FormItem className={cn("w-full md:w-auto md:shrink-0 md:max-w-[14rem]", isPage && "md:max-w-none lg:max-w-none")}>
                      <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" className={cn("rounded-xl w-full md:w-[min(100%,14rem)]", isPage && "h-11 bg-slate-50/80 focus:bg-white lg:w-full")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sexe"
                  render={({ field }) => (
                    <FormItem className="w-full min-w-0 flex-1">
                      <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>Sexe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn("rounded-xl w-full", isPage && "h-11 bg-slate-50/80")}>
                            <SelectValue placeholder="Sexe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Étape 1 — Parcours */}
          {step === 1 && (
            <>
              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem className="w-full md:col-span-2">
                    <FormLabel>Grade</FormLabel>
                    <Select
                      value={field.value && field.value.length >= 24 ? field.value : SELECT_EMPTY}
                      onValueChange={(v) => {
                        // Si le lecteur est déjà concerné par une évaluation, le grade ne doit plus être modifiable.
                        if (lockGradeId) return;
                        field.onChange(v === SELECT_EMPTY ? "" : v);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="w-full min-w-0 h-11 rounded-xl border-slate-200 justify-between"
                          disabled={lockGradeId}
                          aria-disabled={lockGradeId}
                        >
                          <SelectValue>{gradeDisplayLabel(field.value ?? "", grades)}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_EMPTY}>Non renseigné</SelectItem>
                        {grades.map((g) => (
                          <SelectItem key={g._id} value={g._id}>
                            {g.name}
                            {g.abbreviation ? ` (${g.abbreviation})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anneeAdhesion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année d&apos;adhésion au groupe (facultatif)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-xl"
                        placeholder={`Ex. ${new Date().getFullYear()}`}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => {
                  const options =
                    field.value && !(NIVEAU_SCOLAIRE_OPTIONS as readonly string[]).includes(field.value)
                      ? [field.value, ...NIVEAU_SCOLAIRE_OPTIONS]
                      : [...NIVEAU_SCOLAIRE_OPTIONS];

                  return (
                    <FormItem>
                      <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>
                        Niveau scolaire ou professionnel
                      </FormLabel>
                      <Select
                        value={field.value || SELECT_EMPTY}
                        onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? "" : v)}
                      >
                        <FormControl>
                          <SelectTrigger className={cn("rounded-xl w-full", isPage && "h-11 bg-slate-50/80")}>
                            <SelectValue>{field.value || "Sélectionner un niveau"}</SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SELECT_EMPTY}>Sélectionner un niveau</SelectItem>
                          {options.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className={cn(isPage && "font-semibold text-slate-700")}>
                      Situation professionnelle (facultatif)
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/20 focus-visible:border-amber-900"
                        placeholder="Précisions sur la situation professionnelle…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Étape 2 — Rattachement */}
          {step === 2 && (
            <>
              {lockVicariatId ? (
                <>
                  <FormItem className="w-full md:col-span-2">
                    <FormLabel>Vicariat</FormLabel>
                    <div className="min-h-11 px-3 py-2.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium w-full">
                      {lockParishVicariat?.vicariatName ?? "Non renseigné"}
                    </div>
                  </FormItem>
                  <input type="hidden" {...form.register("vicariatId")} />
                  {lockParoisseId ? (
                    <>
                      <FormItem className="w-full md:col-span-2">
                        <FormLabel>Paroisse</FormLabel>
                        <div className="min-h-11 px-3 py-2.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium w-full">
                          {lockParishVicariat?.paroisseName ?? "Non renseigné"}
                        </div>
                      </FormItem>
                      <input type="hidden" {...form.register("paroisseId")} />
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="paroisseId"
                      render={({ field }) => (
                        <FormItem className="w-full md:col-span-2">
                          <FormLabel>Paroisse</FormLabel>
                          <Select
                            value={field.value && field.value.length >= 24 ? field.value : SELECT_EMPTY}
                            onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? "" : v)}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full min-w-0 h-11 rounded-xl border-slate-200 justify-between">
                                <SelectValue>{entityDisplayLabel(field.value ?? "", filteredParoisses)}</SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={SELECT_EMPTY}>Non renseigné</SelectItem>
                              {filteredParoisses.map((p) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="vicariatId"
                    render={({ field }) => (
                      <FormItem className="w-full md:col-span-2">
                        <FormLabel>Vicariat</FormLabel>
                        <Select
                          value={field.value && field.value.length >= 24 ? field.value : SELECT_EMPTY}
                          onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full min-w-0 h-11 rounded-xl border-slate-200 justify-between">
                              <SelectValue>{entityDisplayLabel(field.value ?? "", vicariats)}</SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SELECT_EMPTY}>Non renseigné</SelectItem>
                            {vicariats.map((v) => (
                              <SelectItem key={v._id} value={v._id}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paroisseId"
                    render={({ field }) => (
                      <FormItem className="w-full md:col-span-2">
                        <FormLabel>Paroisse</FormLabel>
                        <Select
                          value={field.value && field.value.length >= 24 ? field.value : SELECT_EMPTY}
                          onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full min-w-0 h-11 rounded-xl border-slate-200 justify-between">
                              <SelectValue>{entityDisplayLabel(field.value ?? "", filteredParoisses)}</SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SELECT_EMPTY}>Non renseigné</SelectItem>
                            {filteredParoisses.map((p) => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </>
          )}

          {/* Étape 3 — Contacts */}
          {step === 3 && (
            <>
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact (facultatif)</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone principal" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactUrgence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact d&apos;urgence (facultatif)</FormLabel>
                    <FormControl>
                      <Input placeholder="Personne à prévenir" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Quartier, repères…" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maux"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Maux particuliers (facultatif)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[72px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/20 focus-visible:border-amber-900"
                        placeholder="Allergies, conditions médicales à connaître…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2",
            isPage && "rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6"
          )}
        >
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" className="rounded-xl gap-1" onClick={goPrev}>
                <ChevronLeft className="w-4 h-4" />
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
              <Button type="button" className="rounded-xl bg-amber-900 hover:bg-amber-800 gap-1 font-bold" onClick={() => void goNext()}>
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading}
                className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold px-8 min-w-[200px]"
                onClick={() => void handleFinalSubmit()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Enregistrement…
                  </>
                ) : mode === "edit" ? (
                  "Enregistrer les modifications"
                ) : (
                  "Enregistrer le lecteur"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
