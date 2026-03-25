import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";
import { upsertAssembleeRapportSchema } from "@/modules/assemblees/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

function isAssembleeManager(roles: string[]) {
  return roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
}

function isVicarial(roles: string[]) {
  return roles.includes("VICARIAL");
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: {
        roles?: string[];
      };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!isAssembleeManager(roles) && !isVicarial(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const service = new AssembleeGeneraleService();
    const viewerVicariatId = isVicarial(roles) ? session.user.vicariatId ?? null : undefined;
    const rapports = await service.listRapportsForAssemblee(id, { viewerVicariatId });
    return NextResponse.json({ rapports });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: {
        roles?: string[];
        vicariatId?: string | null;
      };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    const isV = isVicarial(roles);
    const isManager = isAssembleeManager(roles);
    if (!isV && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: assembleeId } = await params;
    const service = new AssembleeGeneraleService();
    const assemblee = await service.getAssemblee(assembleeId);
    if (!assemblee) return NextResponse.json({ error: "Assemblée générale introuvable" }, { status: 404 });
    if (assemblee.terminee) return NextResponse.json({ error: "Cette assemblée est terminée : upload interdit" }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });

    // Vicariat ciblé :
    // - VICARIAL : on impose le vicariat du compte
    // - DIOCESAIN / SUPERADMIN : optionnel via le champ `vicariatId` (sinon "global" mention DIOCESAIN)
    let vicariatId: string | null = null;
    let vicariatMention: string | undefined = undefined;
    if (isV) {
      vicariatId = session.user.vicariatId ?? null;
      if (!vicariatId) return NextResponse.json({ error: "Vicariat non défini pour ce compte" }, { status: 400 });
    } else {
      const raw = formData.get("vicariatId");
      const maybeId = raw ? String(raw).trim() : "";
      vicariatId = maybeId.length > 0 ? maybeId : null;
      vicariatMention = vicariatId ? undefined : "DIOCESAIN";
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez un PDF ou un document Word." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filenameVicariatPart = vicariatId ? vicariatId : "DIOCESAIN";
    const filename = `rapport-${assembleeId}-${filenameVicariatPart}-${Date.now()}-${randomToken()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const payload = upsertAssembleeRapportSchema.parse({
      fileUrl: `/uploads/${filename}`,
      originalName: file.name,
      mimeType: file.type,
      vicariatMention,
    });

    const report = await service.upsertRapport(assembleeId, vicariatId, payload);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de requête" },
      { status: 400 }
    );
  }
}

