import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";
import {
  canManageActualites,
  canManageActivites,
  canManageLecteurs,
} from "@/lib/rolePermissions";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

const MAGIC: Array<{ mime: AllowedType; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

function canUpload(roles: string[]): boolean {
  return canManageLecteurs(roles) || canManageActualites(roles) || canManageActivites(roles);
}

function detectImageMime(buf: Buffer): AllowedType | null {
  for (const candidate of MAGIC) {
    const offset = candidate.offset ?? 0;
    if (buf.length < offset + candidate.bytes.length) continue;
    if (candidate.bytes.every((b, i) => buf[offset + i] === b)) {
      if (candidate.mime === "image/webp") {
        if (buf.length < 12) return null;
        if (buf.toString("ascii", 8, 12) !== "WEBP") return null;
      }
      return candidate.mime;
    }
  }
  return null;
}

function extForMime(mime: AllowedType): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(session.user?.roles) ? session.user.roles : [];
    if (!canUpload(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = clientIpFromRequest(request);
    const limited = rateLimit(`upload:${session.user?.id ?? ip}`, { limit: 30, windowMs: 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageMime(buffer);
    if (!detected || !ALLOWED_TYPES.includes(detected)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    // Ignore client-declared MIME / extension — use sniffed type only.
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extForMime(detected)}`;
    const url = await uploadToBlob(`images/${filename}`, buffer, { contentType: detected });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
