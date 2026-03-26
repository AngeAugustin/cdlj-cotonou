import { createHash } from "crypto";

export const PAYMENT_PENDING_TIMEOUT_MS = 120_000;

export function buildActivitePaymentFingerprint(input: {
  activiteId: string;
  paroisseId: string;
  userId: string;
  lecteurIds: string[];
  montantTotal: number;
}) {
  const normalized = {
    activiteId: input.activiteId,
    paroisseId: input.paroisseId,
    userId: input.userId,
    lecteurIds: [...new Set(input.lecteurIds)].sort(),
    montantTotal: input.montantTotal,
  };

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function isPaymentPastPendingTimeout(createdAt?: Date | string | null) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t >= PAYMENT_PENDING_TIMEOUT_MS;
}
