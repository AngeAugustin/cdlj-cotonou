import { NextResponse } from "next/server";
import { ActiviteService } from "@/modules/activites/service";
import { syncPaymentFromFedapayTransactionId } from "@/lib/activitePaymentFinalize";
import { isPaymentPastPendingTimeout } from "@/lib/activitePayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const altSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const querySecret = new URL(request.url).searchParams.get("secret")?.trim() ?? "";

  if (configuredSecret) {
    return bearer === configuredSecret || altSecret === configuredSecret || querySecret === configuredSecret;
  }

  const host = request.headers.get("host") ?? "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

async function runReconciliation(limit: number) {
  const service = new ActiviteService();
  const payments = await service.listPaiementsForReconciliation(limit);

  let scanned = 0;
  let changed = 0;
  let failed = 0;

  const details = [] as Array<{
    paymentId: string;
    before: string;
    after: string;
    action: string;
  }>;

  for (const payment of payments) {
    scanned++;
    const paymentId = payment._id.toString();
    const before = payment.status;

    try {
      if (payment.fedapayTransactionId != null) {
        await syncPaymentFromFedapayTransactionId(payment.fedapayTransactionId, "cron_reconcile");
      } else if (payment.status === "pending" && isPaymentPastPendingTimeout(payment.createdAt)) {
        await service.updatePaiementById(paymentId, {
          status: "failed",
          statusReason: "missing_fedapay_transaction_id",
          lastWebhookEvent: "cron_reconcile_missing_txid",
        });
      }

      const fresh = await service.findPaiementById(paymentId);
      const after = fresh?.status ?? "missing";
      if (after !== before) changed++;

      details.push({
        paymentId,
        before,
        after,
        action:
          payment.fedapayTransactionId != null
            ? "sync_transaction"
            : payment.status === "pending" && isPaymentPastPendingTimeout(payment.createdAt)
              ? "mark_failed_missing_txid"
              : "noop",
      });
    } catch {
      failed++;
      details.push({
        paymentId,
        before,
        after: before,
        action: "error",
      });
    }
  }

  return { scanned, changed, failed, details };
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, Math.trunc(rawLimit))) : 200;
    const result = await runReconciliation(limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
