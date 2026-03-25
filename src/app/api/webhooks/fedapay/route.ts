import { NextResponse } from "next/server";
import { fedapayVerifyWebhook } from "@/lib/fedapay";
import { syncPaymentFromFedapayTransactionId } from "@/lib/activitePaymentFinalize";

export const runtime = "nodejs";

function extractFedapayTxId(event: Record<string, unknown>): number | null {
  const entity = event.entity as Record<string, unknown> | undefined;
  if (entity) {
    const id = entity.id;
    if (typeof id === "number" && Number.isFinite(id)) return id;
    if (typeof id === "string" && /^\d+$/.test(id)) return parseInt(id, 10);
  }
  const data = event.data as Record<string, unknown> | undefined;
  const inner = (data?.entity ?? data) as Record<string, unknown> | undefined;
  if (inner) {
    const id = inner.id;
    if (typeof id === "number" && Number.isFinite(id)) return id;
    if (typeof id === "string" && /^\d+$/.test(id)) return parseInt(id, 10);
  }
  return null;
}

function eventName(event: Record<string, unknown>): string {
  return String(event.name ?? event.type ?? "");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig =
    request.headers.get("x-fedapay-signature") ??
    request.headers.get("X-FEDAPAY-SIGNATURE") ??
    request.headers.get("X-FedaPay-Signature");

  let event: Record<string, unknown>;
  try {
    event = fedapayVerifyWebhook(rawBody, sig);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const name = eventName(event);
  const txId = extractFedapayTxId(event);

  if (txId != null) {
    const result = await syncPaymentFromFedapayTransactionId(txId, name);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Traitement refusé" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
