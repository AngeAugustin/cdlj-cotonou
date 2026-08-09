import { randomUUID } from "crypto";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { AuthSession } from "./model";

/** Inactivité max avant expiration (alignée sur maxAge JWT). */
export const SESSION_IDLE_MS = 30 * 24 * 60 * 60 * 1000;
/** Évite d’écrire lastSeenAt à chaque requête. */
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export type AuthSessionView = {
  id: string;
  sessionId: string;
  deviceLabel: string;
  ip?: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

function headerValue(
  headers: Record<string, unknown> | Headers | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const raw = (headers as Record<string, unknown>)[name] ?? (headers as Record<string, unknown>)[name.toLowerCase()];
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : undefined;
  return typeof raw === "string" ? raw : undefined;
}

export function extractClientMeta(headers: Record<string, unknown> | Headers | undefined): {
  userAgent?: string;
  ip?: string;
} {
  const userAgent = headerValue(headers, "user-agent");
  const forwarded = headerValue(headers, "x-forwarded-for");
  const realIp = headerValue(headers, "x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || undefined;
  return { userAgent, ip };
}

export function parseDeviceLabel(userAgent?: string): string {
  if (!userAgent?.trim()) return "Appareil inconnu";

  let browser = "Navigateur";
  if (/Edg\//i.test(userAgent)) browser = "Edge";
  else if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) browser = "Chrome";
  else if (/Firefox\//i.test(userAgent)) browser = "Firefox";
  else if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";
  else if (/Opera|OPR\//i.test(userAgent)) browser = "Opera";

  let os = "Inconnu";
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";
  else if (/Mac OS X|Macintosh/i.test(userAgent)) os = "macOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  return `${browser} · ${os}`;
}

function idleCutoff(): Date {
  return new Date(Date.now() - SESSION_IDLE_MS);
}

export class AuthSessionService {
  async create(params: {
    userId: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ sessionId: string }> {
    await connectToDatabase();
    const sessionId = randomUUID();
    await AuthSession.create({
      sessionId,
      userId: new mongoose.Types.ObjectId(params.userId),
      userAgent: params.userAgent,
      deviceLabel: parseDeviceLabel(params.userAgent),
      ip: params.ip,
      lastSeenAt: new Date(),
      revokedAt: null,
    });
    return { sessionId };
  }

  /** Retourne true si la session est encore utilisable. */
  async assertActive(sessionId: string, userId: string): Promise<boolean> {
    if (!sessionId || !userId) return false;
    await connectToDatabase();
    const doc = await AuthSession.findOne({
      sessionId,
      userId: new mongoose.Types.ObjectId(userId),
      revokedAt: null,
      lastSeenAt: { $gte: idleCutoff() },
    })
      .select({ _id: 1, lastSeenAt: 1 })
      .lean<{ _id: mongoose.Types.ObjectId; lastSeenAt: Date } | null>();

    if (!doc) return false;

    const age = Date.now() - new Date(doc.lastSeenAt).getTime();
    if (age >= LAST_SEEN_THROTTLE_MS) {
      await AuthSession.updateOne({ _id: doc._id }, { $set: { lastSeenAt: new Date() } });
    }
    return true;
  }

  async listForUser(userId: string, currentSessionId?: string | null): Promise<AuthSessionView[]> {
    await connectToDatabase();
    const rows = await AuthSession.find({
      userId: new mongoose.Types.ObjectId(userId),
      revokedAt: null,
      lastSeenAt: { $gte: idleCutoff() },
    })
      .sort({ lastSeenAt: -1 })
      .lean();

    return rows.map((row) => ({
      id: String(row._id),
      sessionId: row.sessionId,
      deviceLabel: row.deviceLabel || parseDeviceLabel(row.userAgent),
      ip: row.ip || undefined,
      createdAt: new Date(row.createdAt).toISOString(),
      lastSeenAt: new Date(row.lastSeenAt).toISOString(),
      current: Boolean(currentSessionId && row.sessionId === currentSessionId),
    }));
  }

  async revokeBySessionId(userId: string, sessionId: string): Promise<boolean> {
    await connectToDatabase();
    const res = await AuthSession.updateOne(
      {
        sessionId,
        userId: new mongoose.Types.ObjectId(userId),
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } }
    );
    return res.modifiedCount > 0;
  }

  async revokeOthers(userId: string, keepSessionId: string): Promise<number> {
    await connectToDatabase();
    const res = await AuthSession.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        sessionId: { $ne: keepSessionId },
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } }
    );
    return res.modifiedCount;
  }

  async revokeAll(userId: string): Promise<number> {
    await connectToDatabase();
    const res = await AuthSession.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } }
    );
    return res.modifiedCount;
  }
}
