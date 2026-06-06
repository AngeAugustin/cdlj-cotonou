"use client";

import { useState } from "react";
import { AlertCircle, Award, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LecteurInfo = {
  nom: string;
  prenoms: string;
  uniqueId: string;
  vicariat: string;
  paroisse: string;
};

type ResultInfo = {
  annee: number;
  decision: "PROMU" | "MAINTENU";
  nouveauGrade: { name: string; abbreviation: string };
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_found"; message: string }
  | { status: "no_result"; lecteur: LecteurInfo; message: string }
  | { status: "success"; lecteur: LecteurInfo; result: ResultInfo };

const CURRENT_YEAR = new Date().getFullYear();

function ResultField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function decisionCardClass(decision: "PROMU" | "MAINTENU") {
  return decision === "PROMU"
    ? "border-green-200 bg-green-50"
    : "border-amber-200 bg-amber-50";
}

function decisionTextClass(decision: "PROMU" | "MAINTENU") {
  return decision === "PROMU" ? "text-green-700" : "text-amber-800";
}

function DecisionField({ decision }: { decision: "PROMU" | "MAINTENU" }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", decisionCardClass(decision))}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Décision</p>
      <p className={cn("mt-1 text-base font-bold", decisionTextClass(decision))}>{decision}</p>
    </div>
  );
}

export function ResultatsClient() {
  const [uniqueId, setUniqueId] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = uniqueId.trim();
    if (!trimmed) return;

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/public/evaluations/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setState({
          status: "not_found",
          message: typeof data?.message === "string" ? data.message : "Aucun lecteur trouvé avec ce numéro.",
        });
        return;
      }

      const lecteur = data.lecteur as LecteurInfo | undefined;
      const result = data.result as ResultInfo | null | undefined;

      if (!lecteur) {
        setState({
          status: "not_found",
          message: "Aucun lecteur trouvé avec ce numéro.",
        });
        return;
      }

      if (!result) {
        setState({
          status: "no_result",
          lecteur,
          message:
            typeof data?.message === "string"
              ? data.message
              : "Aucun résultat publié pour l'année en cours.",
        });
        return;
      }

      setState({ status: "success", lecteur, result });
    } catch {
      setState({
        status: "not_found",
        message: "Impossible de consulter les résultats pour le moment. Réessayez plus tard.",
      });
    }
  }

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <div className="absolute left-0 right-0 top-0 h-[28rem] bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950" />
      <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
      <div className="absolute -right-10 top-20 h-72 w-72 rounded-full bg-white/10 blur-[110px]" />

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
            <Award className="h-4 w-4" />
            Évaluations {CURRENT_YEAR}
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Résultats</h1>
          <p className="mt-4 text-sm leading-7 text-amber-50/90 sm:text-base">
            Saisissez votre numéro lecteur pour consulter votre résultat d&apos;évaluation de l&apos;année en cours,
            dès sa publication officielle.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl shadow-amber-950/10 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="lecteur-unique-id" className="text-slate-700">
                Numéro lecteur
              </Label>
              <Input
                id="lecteur-unique-id"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                placeholder="Ex. NOTSAC123456"
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50 font-mono uppercase tracking-wide"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-slate-500">
                Le numéro figure sur votre carte de membre CDLJ.
              </p>
            </div>

            <Button
              type="submit"
              disabled={state.status === "loading" || !uniqueId.trim()}
              className="h-12 w-full rounded-2xl bg-amber-900 text-white hover:bg-amber-800"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche en cours…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Consulter mon résultat
                </>
              )}
            </Button>
          </form>

          {state.status === "not_found" ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-bold text-slate-900">Consultation impossible</p>
                  <p className="mt-1 text-sm text-slate-700">{state.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          {state.status === "no_result" ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-bold text-slate-900">Résultat non disponible</p>
                  <p className="mt-1 text-sm text-slate-700">{state.message}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    {state.lecteur.nom} {state.lecteur.prenoms} · {state.lecteur.uniqueId}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-900" />
                  <div>
                    <p className="font-bold text-slate-900">Résultat publié — {state.result.annee}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Voici votre résultat officiel pour l&apos;année en cours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultField label="Nom" value={state.lecteur.nom} />
                <ResultField label="Prénom(s)" value={state.lecteur.prenoms} />
                <ResultField label="Numéro lecteur" value={state.lecteur.uniqueId} className="font-mono" />
                <ResultField label="Vicariat" value={state.lecteur.vicariat} />
                <ResultField label="Paroisse" value={state.lecteur.paroisse} />
                <DecisionField decision={state.result.decision} />
                <ResultField
                  label="Nouveau grade"
                  value={`${state.result.nouveauGrade.name} (${state.result.nouveauGrade.abbreviation})`}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
