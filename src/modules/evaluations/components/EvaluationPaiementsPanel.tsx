"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EvaluationPaiementRow = {
  _id: string;
  status: string;
  montantTotal: number;
  uniqueId: string;
  annee: number;
  createdAt?: string;
  fedapayReference?: string | null;
  gatewayStatus?: string | null;
  statusReason?: string | null;
  lastWebhookEvent?: string | null;
  paroisseName?: string;
  lecteur?: { _id: string; nom: string; prenoms: string; uniqueId: string } | null;
};

type PaiementViewFilter = "all" | "approved" | "open";

function isPaymentAnomaly(p: Pick<EvaluationPaiementRow, "status" | "statusReason">) {
  return (
    p.status === "non_finalized" ||
    p.status === "approved_pending_registration" ||
    p.status === "failed" ||
    p.statusReason === "partial_refund_not_supported"
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function humanizePaymentAnomalyCause(p: Pick<EvaluationPaiementRow, "status" | "gatewayStatus" | "statusReason" | "lastWebhookEvent">) {
  const reason = (p.statusReason ?? "").trim();
  if (reason === "gateway_pending_timeout") {
    return "Le paiement est resté en attente trop longtemps sans statut final exploitable côté FedaPay.";
  }
  if (reason === "fedapay_transaction_id_invalid") {
    return "FedaPay a renvoyé une transaction invalide ou incomplète lors de l'initialisation.";
  }
  if (reason === "customer_create_invalid") {
    return "La création ou la récupération du client FedaPay a échoué.";
  }
  if (reason === "partial_refund_not_supported") {
    return "FedaPay a signalé un remboursement partiel, non pris en charge.";
  }
  if (reason) return reason;
  if (p.status === "approved_pending_registration") {
    return "Le paiement a été confirmé, mais la finalisation locale n'a pas abouti.";
  }
  if (p.status === "non_finalized") {
    return "Aucun statut final exploitable n'a été confirmé dans les délais.";
  }
  if (p.status === "failed") {
    return "Une erreur technique est survenue pendant l'initialisation du paiement.";
  }
  return "Cause non déterminée. Vérifier la passerelle et les traces techniques.";
}

type Props = {
  evaluationId: string;
  mode: "paiements" | "anomalies";
  isSuperAdmin: boolean;
};

export function EvaluationPaiementsPanel({ evaluationId, mode, isSuperAdmin }: Props) {
  const [paiements, setPaiements] = useState<EvaluationPaiementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [paiementViewFilter, setPaiementViewFilter] = useState<PaiementViewFilter>("all");
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  const refreshPaiements = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/evaluations/${encodeURIComponent(evaluationId)}/paiements`);
      const data = await r.json().catch(() => []);
      setPaiements(Array.isArray(data) ? (data as EvaluationPaiementRow[]) : []);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    void refreshPaiements();
  }, [refreshPaiements]);

  const paiementCounts = useMemo(
    () => ({
      all: paiements.length,
      anomalies: paiements.filter(isPaymentAnomaly).length,
      approved: paiements.filter((p) => p.status === "approved").length,
      open: paiements.filter((p) => p.status === "pending").length,
      toFinalize: paiements.filter((p) => p.status === "approved_pending_registration").length,
      nonFinalized: paiements.filter((p) => p.status === "non_finalized").length,
      failed: paiements.filter((p) => p.status === "failed").length,
    }),
    [paiements]
  );

  const anomalyPaiements = useMemo(() => paiements.filter(isPaymentAnomaly), [paiements]);

  const visiblePaiements = useMemo(() => {
    if (mode === "anomalies") return anomalyPaiements;
    if (paiementViewFilter === "open") return paiements.filter((p) => p.status === "pending");
    if (paiementViewFilter === "approved") return paiements.filter((p) => p.status === "approved");
    return paiements;
  }, [mode, anomalyPaiements, paiements, paiementViewFilter]);

  async function finalizePaiementManually(paymentId: string) {
    setFinalizingId(paymentId);
    try {
      const res = await fetch(
        `/api/evaluations/${encodeURIComponent(evaluationId)}/paiements/${encodeURIComponent(paymentId)}/finalize`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Finalisation impossible");
      await refreshPaiements();
    } finally {
      setFinalizingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {mode === "paiements" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPaiementViewFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              paiementViewFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tous ({paiementCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setPaiementViewFilter("open")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              paiementViewFilter === "open" ? "bg-amber-700 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            En attente ({paiementCounts.open})
          </button>
          <button
            type="button"
            onClick={() => setPaiementViewFilter("approved")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              paiementViewFilter === "approved" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Approuvés ({paiementCounts.approved})
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-700" />
              Anomalies détectées
            </h2>
            {anomalyPaiements.length > 0 ? (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {anomalyPaiements.length} transaction{anomalyPaiements.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
          {paiementCounts.anomalies > 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3">
              <p className="text-sm font-bold text-red-800">Anomalies de paiement détectées</p>
              <p className="text-xs text-red-700 mt-1">
                {paiementCounts.toFinalize} à finaliser, {paiementCounts.nonFinalized} non finalisé(s),{" "}
                {paiementCounts.failed} échec(s)
              </p>
            </div>
          ) : null}
        </>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 flex items-center justify-center gap-3 py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
          Chargement…
        </div>
      ) : paiements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-12 text-center">
          <p className="text-sm text-slate-500">Aucun paiement de consultation enregistré.</p>
        </div>
      ) : visiblePaiements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-12 text-center">
          <p className="text-sm text-slate-500">
            {mode === "anomalies" ? "Aucune anomalie détectée." : "Aucun paiement ne correspond au filtre."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visiblePaiements.map((p) => {
            const anomalyCause = isPaymentAnomaly(p) ? humanizePaymentAnomalyCause(p) : null;
            const s =
              p.status === "approved"
                ? { bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Approuvé" }
                : p.status === "pending"
                  ? { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-900 border-amber-200", label: "En attente" }
                  : p.status === "approved_pending_registration"
                    ? { bar: "bg-blue-300", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "À finaliser" }
                    : p.status === "non_finalized"
                      ? { bar: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200", label: "Non finalisé" }
                      : p.status === "failed"
                        ? { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", label: "Échec" }
                        : { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", label: p.status };

            const lecteurLabel = p.lecteur
              ? `${p.lecteur.nom} ${p.lecteur.prenoms} · ${p.lecteur.uniqueId}`
              : p.uniqueId;

            return (
              <li key={p._id}>
                <div className="relative flex rounded-2xl border border-slate-100 shadow-md overflow-hidden bg-white">
                  <div className={`w-1 shrink-0 ${s.bar}`} />
                  <div className="flex-1 px-4 py-4 sm:px-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        {p.createdAt ? format(new Date(p.createdAt), "d MMM yyyy · HH:mm", { locale: fr }) : "—"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lecteurLabel}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatMoney(p.montantTotal)} · {p.paroisseName ?? "—"}
                        {p.fedapayReference ? ` · Réf. ${p.fedapayReference}` : ""}
                      </p>
                    </div>
                    {anomalyCause ? (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{anomalyCause}</p>
                    ) : null}
                    {isSuperAdmin && p.status === "approved_pending_registration" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        disabled={finalizingId === p._id}
                        onClick={() => void finalizePaiementManually(p._id)}
                      >
                        {finalizingId === p._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Finaliser manuellement
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
