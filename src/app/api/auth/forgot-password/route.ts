import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordResetCode } from "@/modules/password-reset/service";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const bodySchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`auth:forgot:${ip}`, { limit: 8, windowMs: 15 * 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  try {
    await requestPasswordResetCode(parsed.data.email);
    return NextResponse.json({
      ok: true,
      message:
        "Si un compte existe pour cette adresse, un code de réinitialisation vient d'être envoyé.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
