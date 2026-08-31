"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Award, Banknote, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PAYMENT_PENDING_TIMEOUT_MS } from "@/lib/resultatConsultationPayments";

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
  | { status: "payment_required"; lecteur: LecteurInfo; montant: number; annee: number }
  | { status: "paying" }
  | { status: "payment_polling" }
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
  return decision === "PROMU" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50";
}

function decisionTextClass(decision: "PROMU" | "MAINTENU") {
  return decision === "PROMU" ? "text-green-700" : "text-red-700";
}

function formatDecisionLabel(decision: "PROMU" | "MAINTENU") {
  return decision === "PROMU" ? "Admissible" : "Refusé";
}

function DecisionField({ decision }: { decision: "PROMU" | "MAINTENU" }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", decisionCardClass(decision))}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Décision</p>
      <p className={cn("mt-1 text-base font-bold", decisionTextClass(decision))}>{formatDecisionLabel(decision)}</p>
    </div>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

export function ResultatsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uniqueId, setUniqueId] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const [paymentContext, setPaymentContext] = useState<{
    lecteur: LecteurInfo;
    montant: number;
    annee: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fedapayReturnHandled = useRef(false);
  const paymentPollTimeoutRef = useRef<number | null>(null);
  const paymentPollDeadlineTimeoutRef = useRef<number | null>(null);

  const fetchResult = useCallback(async (id: string) => {
    const response = await fetch("/api/public/evaluations/resultats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId: id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.message === "string" ? data.message : "Consultation impossible.");
    }

    const lecteur = data.lecteur as LecteurInfo | undefined;
    const result = data.result as ResultInfo | null | undefined;

    if (!lecteur || !result) {
      throw new Error(typeof data?.message === "string" ? data.message : "Résultat indisponible.");
    }

    setState({ status: "success", lecteur, result });
  }, []);

  const runCheck = useCallback(
    async (id: string) => {
      const trimmed = id.trim().toUpperCase();
      if (!trimmed) return;

      setState({ status: "loading" });
      setErrorMessage(null);

      try {
        const response = await fetch("/api/public/evaluations/resultats/check", {
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
        if (!lecteur) {
          setState({ status: "not_found", message: "Aucun lecteur trouvé avec ce numéro." });
          return;
        }

        if (!data.hasResult) {
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

        if (data.paid) {
          await fetchResult(trimmed);
          return;
        }

        setState({
          status: "payment_required",
          lecteur,
          montant: typeof data.montant === "number" ? data.montant : 100,
          annee: typeof data.annee === "number" ? data.annee : CURRENT_YEAR,
        });
        setPaymentContext({
          lecteur,
          montant: typeof data.montant === "number" ? data.montant : 100,
          annee: typeof data.annee === "number" ? data.annee : CURRENT_YEAR,
        });
      } catch {
        setState({
          status: "not_found",
          message: "Impossible de consulter les résultats pour le moment. Réessayez plus tard.",
        });
      }
    },
    [fetchResult]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runCheck(uniqueId);
  }

  async function handlePay() {
    if (!paymentContext) return;
    const { lecteur, montant, annee } = paymentContext;
    const trimmed = uniqueId.trim().toUpperCase();
    if (!trimmed) return;

    setState({ status: "paying" });
    setErrorMessage(null);

    try {
      const response = await fetch("/api/public/evaluations/resultats/pay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(typeof data?.error === "string" ? data.error : "Impossible d'initialiser le paiement.");
        setState({ status: "payment_required", lecteur, montant, annee });
        return;
      }

      if (data.alreadyPaid) {
        await fetchResult(trimmed);
        return;
      }

      const paymentUrl = typeof data.paymentUrl === "string" ? data.paymentUrl : null;
      const paymentId = typeof data.paymentId === "string" ? data.paymentId : null;

      if (paymentUrl) {
        if (paymentId) {
          try {
            sessionStorage.setItem(`fedapay_pid_resultat_${trimmed}`, paymentId);
          } catch {
            /* ignore */
          }
        }
        window.location.href = paymentUrl;
        return;
      }

      setErrorMessage("URL de paiement indisponible.");
      setState({ status: "payment_required", lecteur, montant, annee });
    } catch {
      setErrorMessage("Impossible d'initialiser le paiement.");
      setState({ status: "payment_required", lecteur, montant, annee });
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || fedapayReturnHandled.current) return;
    if (searchParams.get("payment") !== "return") return;

    const returnUniqueId = (searchParams.get("uniqueId") ?? "").trim().toUpperCase();
    if (returnUniqueId) setUniqueId(returnUniqueId);

    let pid = searchParams.get("pid") ?? searchParams.get("paymentId");
    if (!pid && returnUniqueId) {
      try {
        pid = sessionStorage.getItem(`fedapay_pid_resultat_${returnUniqueId}`) ?? null;
      } catch {
        pid = null;
      }
    }

    fedapayReturnHandled.current = true;

    const cleanUrl = () => {
      router.replace("/resultats", { scroll: false });
    };

    if (!pid) {
      setErrorMessage("Retour depuis FedaPay. Réessayez dans un instant si le paiement a été effectué.");
      void runCheck(returnUniqueId);
      cleanUrl();
      return;
    }

    try {
      sessionStorage.removeItem(`fedapay_pid_resultat_${returnUniqueId}`);
    } catch {
      /* ignore */
    }

    setState({ status: "payment_polling" });

    let cancelled = false;
    const POLL_MS = 2000;

    const stopPolling = async (message: string, success: boolean) => {
      if (cancelled) return;
      cancelled = true;
      if (paymentPollTimeoutRef.current != null) {
        window.clearTimeout(paymentPollTimeoutRef.current);
        paymentPollTimeoutRef.current = null;
      }
      if (paymentPollDeadlineTimeoutRef.current != null) {
        window.clearTimeout(paymentPollDeadlineTimeoutRef.current);
        paymentPollDeadlineTimeoutRef.current = null;
      }
      cleanUrl();
      if (success) {
        try {
          await fetchResult(returnUniqueId);
        } catch {
          setErrorMessage(message);
          await runCheck(returnUniqueId);
        }
      } else {
        setErrorMessage(message);
        await runCheck(returnUniqueId);
      }
    };

    const scheduleNext = () => {
      if (cancelled) return;
      if (paymentPollTimeoutRef.current != null) window.clearTimeout(paymentPollTimeoutRef.current);
      paymentPollTimeoutRef.current = window.setTimeout(() => {
        void poll();
      }, POLL_MS);
    };

    paymentPollDeadlineTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/public/evaluations/resultats/pay/status?pid=${encodeURIComponent(pid!)}`,
            { method: "PATCH" }
          );
          const data = await res.json().catch(() => ({}));
          const st = typeof data?.status === "string" ? data.status : null;

          if (!res.ok) {
            await stopPolling(typeof data?.error === "string" ? data.error : "Paiement annulé ou non finalisé.", false);
            return;
          }

          if (st === "approved") {
            await stopPolling("Paiement confirmé.", true);
            return;
          }

          if (
            st === "declined" ||
            st === "canceled" ||
            st === "failed" ||
            st === "non_finalized" ||
            st === "approved_pending_registration"
          ) {
            const msg =
              st === "declined"
                ? "Paiement refusé."
                : st === "canceled"
                  ? "Paiement annulé."
                  : st === "failed"
                    ? "Paiement en échec."
                    : st === "approved_pending_registration"
                      ? "Paiement confirmé, finalisation en cours. Réessayez dans un instant."
                      : "Paiement annulé ou non finalisé.";
            await stopPolling(msg, false);
            return;
          }

          await stopPolling("Paiement annulé ou non finalisé.", false);
        } catch {
          await stopPolling("Paiement annulé ou non finalisé.", false);
        }
      })();
    }, PAYMENT_PENDING_TIMEOUT_MS);

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/public/evaluations/resultats/pay/status?pid=${encodeURIComponent(pid!)}`);
        const data = await res.json().catch(() => ({}));
        const st = typeof data?.status === "string" ? data.status : null;

        if (!res.ok) {
          await stopPolling(
            typeof data?.error === "string" ? data.error : "Impossible de vérifier le paiement.",
            false
          );
          return;
        }

        if (st === "approved") {
          await stopPolling("Paiement confirmé.", true);
          return;
        }

        if (
          st === "declined" ||
          st === "canceled" ||
          st === "failed" ||
          st === "non_finalized" ||
          st === "approved_pending_registration"
        ) {
          const msg =
            st === "declined"
              ? "Paiement refusé."
              : st === "canceled"
                ? "Paiement annulé."
                : st === "failed"
                  ? "Paiement en échec."
                  : st === "approved_pending_registration"
                    ? "Paiement confirmé, finalisation en cours. Réessayez dans un instant."
                    : "Paiement annulé ou non finalisé.";
          await stopPolling(msg, false);
          return;
        }

        scheduleNext();
      } catch {
        await stopPolling("Erreur réseau lors de la vérification du paiement.", false);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (paymentPollTimeoutRef.current != null) window.clearTimeout(paymentPollTimeoutRef.current);
      if (paymentPollDeadlineTimeoutRef.current != null) window.clearTimeout(paymentPollDeadlineTimeoutRef.current);
    };
    // uniqueId volontairement exclu : setUniqueId() dans cet effet relançait le cleanup et annulait le polling.
  }, [searchParams, router, runCheck, fetchResult]);

  const isBusy =
    state.status === "loading" ||
    state.status === "paying" ||
    state.status === "payment_polling";

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
            Saisissez votre numéro lecteur pour consulter votre résultat d&apos;évaluation de l&apos;année en cours.
            La consultation est facturée {formatMoney(100)} (accès illimité après paiement).
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
                disabled={isBusy}
              />
              <p className="mt-2 text-xs text-slate-500">
                Le numéro figure sur votre carte de membre CDLJ.
              </p>
            </div>

            {state.status !== "payment_required" ? (
              <Button
                type="submit"
                disabled={isBusy || !uniqueId.trim()}
                className="h-12 w-full rounded-2xl bg-amber-900 text-white hover:bg-amber-800"
              >
                {state.status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recherche en cours…
                  </>
                ) : state.status === "payment_polling" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification du paiement…
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consulter mon résultat
                  </>
                )}
              </Button>
            ) : null}
          </form>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm text-slate-700">{errorMessage}</p>
              </div>
            </div>
          ) : null}

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

          {paymentContext && (state.status === "payment_required" || state.status === "paying") ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                  <div>
                    <p className="font-bold text-slate-900">Résultat disponible — paiement requis</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Un résultat publié est disponible pour{" "}
                      <span className="font-semibold">
                        {paymentContext.lecteur.nom} {paymentContext.lecteur.prenoms}
                      </span>{" "}
                      ({paymentContext.annee}). Payez {formatMoney(paymentContext.montant)} pour y accéder. Une fois payé, vous pourrez
                      consulter ce résultat indéfiniment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultField label="Nom" value={paymentContext.lecteur.nom} />
                <ResultField label="Prénom(s)" value={paymentContext.lecteur.prenoms} />
                <ResultField label="Numéro lecteur" value={paymentContext.lecteur.uniqueId} className="font-mono sm:col-span-2" />
              </div>

              <Button
                type="button"
                disabled={state.status === "paying"}
                onClick={() => void handlePay()}
                className="h-12 w-full rounded-2xl bg-amber-900 text-white hover:bg-amber-800"
              >
                {state.status === "paying" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection vers le paiement…
                  </>
                ) : (
                  <>
                    <Banknote className="mr-2 h-4 w-4" />
                    Payer {formatMoney(paymentContext.montant)}
                  </>
                )}
              </Button>
            </div>
          ) : null}

          {state.status === "payment_polling" ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3 text-slate-700">
                <Loader2 className="h-5 w-5 animate-spin text-amber-900" />
                <p className="text-sm">Confirmation du paiement en cours…</p>
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
                  label={state.result.decision === "PROMU" ? "Nouveau grade" : "Grade maintenu"}
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
