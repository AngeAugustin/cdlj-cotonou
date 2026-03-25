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
import { createLecteurSchema } from "../schema";
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

/** Valeur interne pour « aucune sélection » (jamais affichée telle quelle à l’écran). */
const SELECT_EMPTY = "__cdlj_empty__";

const lecteurFormInputSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Les prénoms doivent contenir au moins 2 caractères"),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  sexe: z.enum(["M", "F"]),
  gradeId: z.string().optional(),
  anneeAdhesion: z.number().int().min(1900).max(new Date().getFullYear()),
  niveau: z.string().min(1, "Le niveau est requis"),
  details: z.string().optional(),
  contact: z.string().min(8, "Numéro de contact invalide"),
  contactUrgence: z.string().min(8, "Numéro de contact d'urgence invalide"),
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
  lecteurId?: string;
  initialData?: LecteurFormInitial | null;
  lockParishVicariat?: {
    paroisseId: string;
    vicariatId: string;
    paroisseName?: string;
    vicariatName?: string;
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
      anneeAdhesion: new Date().getFullYear(),
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
      anneeAdhesion: initialData.anneeAdhesion ?? new Date().getFullYear(),
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
    if (!lockParoisseId || !lockVicariatId) return;
    form.setValue("paroisseId", lockParoisseId);
    form.setValue("vicariatId", lockVicariatId);
  }, [lockParoisseId, lockVicariatId, form]);

  // Si l’utilisateur change de vicariat, on évite de garder une paroisse invalide.
  useEffect(() => {
    if (lockParishVicariat) return; // champ masqué + valeurs fixées par le parent

    const vid = form.getValues("vicariatId");
    const pid = form.getValues("paroisseId");
    if (!vid || vid.length < 24) return;
    if (!pid || pid.length < 24) return;

    const allowed = paroisses.some((p) => String(p._id) === String(pid) && String(p.vicariatId ?? "") === String(vid));
    if (!allowed) form.setValue("paroisseId", "");
  }, [lockParishVicariat, paroisses, form, watchedVicariatId]);

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
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          /* Ne pas enregistrer ici : Entrée dans un <input> déclenche submit et lancerait l’API sans clic sur le bouton. */
        }}
      >
        {/* Stepper — icônes en tête */}
        <div className="relative">
          <div className="flex items-start justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
            {STEPS_META.map((meta, index) => {
              const Icon = meta.icon;
              const isActive = step === index;
              const reachable = index <= furthestStep || index <= step;
              const showCheck = index < step;

              return (
                <div key={meta.title} className="flex items-start min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    disabled={!reachable && mode === "create"}
                    className={`
                      flex flex-col items-center gap-2 w-full min-w-[4.5rem] sm:min-w-[5.5rem] group transition-opacity
                      ${reachable || mode === "edit" ? "opacity-100 cursor-pointer" : "opacity-40 cursor-not-allowed"}
                    `}
                  >
                    <span
                      className={`
                        relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 transition-all duration-200
                        ${
                          isActive
                            ? "border-amber-900 bg-amber-900 text-white shadow-lg shadow-amber-900/25 scale-105"
                            : showCheck
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-400 group-hover:border-amber-300 group-hover:text-amber-800"
                        }
                      `}
                    >
                      {showCheck && !isActive ? (
                        <Check className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
                      ) : (
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                      )}
                    </span>
                    <span className="text-center px-0.5">
                      <span
                        className={`block text-[11px] sm:text-xs font-extrabold uppercase tracking-wide leading-tight ${
                          isActive ? "text-amber-950" : "text-slate-500"
                        }`}
                      >
                        {meta.title}
                      </span>
                      <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5 leading-snug">{meta.subtitle}</span>
                    </span>
                  </button>
                  {index < lastStepIndex ? (
                    <div
                      className={`hidden sm:block flex-1 min-w-[8px] h-0.5 mt-6 sm:mt-7 mx-1 rounded-full transition-colors ${
                        index < step ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-slate-500 mt-2 sm:hidden text-center">
            Étape {step + 1}/{STEPS_META.length} · {STEPS_META[step].title}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo d’identité : toujours montée (sinon la valeur peut ne pas partir à l’enregistrement) */}
          <FormField
            control={form.control}
            name="photoIdentite"
            render={({ field }) => (
              <FormItem className="md:col-span-2 rounded-2xl border border-amber-100/80 bg-amber-50/20 p-4">
                <FormLabel>Photo d&apos;identité (max 3 Mo)</FormLabel>
                <input type="hidden" {...field} value={field.value ?? ""} />
                {step === 0 ? (
                  <div className="flex flex-col gap-3 mt-1">
                    {field.value ? (
                      <img
                        src={absolutePublicUrl(field.value) ?? field.value}
                        alt="Aperçu photo d’identité"
                        className="h-36 w-auto max-w-full rounded-xl border border-slate-200 object-contain bg-white"
                      />
                    ) : null}
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 text-sm font-semibold text-slate-700">
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
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {field.value ? (
                      <img
                        src={absolutePublicUrl(field.value) ?? field.value}
                        alt=""
                        className="h-24 w-auto max-w-[min(100%,280px)] rounded-xl border border-slate-200 object-contain bg-white"
                      />
                    ) : (
                      <p className="text-sm text-slate-600">Aucune photo sélectionnée.</p>
                    )}
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => goToStep(0)}>
                      Photo à l’étape Identité
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Étape 0 — Identité */}
          {step === 0 && (
            <>
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de famille" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prenoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénoms</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénoms" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6 md:items-end">
                <FormField
                  control={form.control}
                  name="dateNaissance"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-auto md:shrink-0 md:max-w-[14rem]">
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" className="rounded-xl w-full md:w-[min(100%,14rem)]" {...field} />
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
                      <FormLabel>Sexe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl w-full">
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
            </>
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
                    <FormLabel>Année d&apos;adhésion au groupe</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-xl"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau scolaire ou professionnel</FormLabel>
                    <FormControl>
                      <Input placeholder="ex. 3ème, Terminale, Apprenti…" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Autres détails (facultatif)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/20 focus-visible:border-amber-900"
                        placeholder="Précisions sur le parcours scolaire ou professionnel…"
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
              {lockParishVicariat ? (
                <>
                  <FormItem className="w-full md:col-span-2">
                    <FormLabel>Vicariat</FormLabel>
                    <div className="min-h-11 px-3 py-2.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium w-full">
                      {lockParishVicariat.vicariatName ?? "Non renseigné"}
                    </div>
                  </FormItem>
                  <FormItem className="w-full md:col-span-2">
                    <FormLabel>Paroisse</FormLabel>
                    <div className="min-h-11 px-3 py-2.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium w-full">
                      {lockParishVicariat.paroisseName ?? "Non renseigné"}
                    </div>
                  </FormItem>
                  <input type="hidden" {...form.register("vicariatId")} />
                  <input type="hidden" {...form.register("paroisseId")} />
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
                    <FormLabel>Contact</FormLabel>
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
                    <FormLabel>Contact d&apos;urgence</FormLabel>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
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
