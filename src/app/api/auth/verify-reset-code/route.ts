import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPasswordResetCode } from "@/modules/password-reset/service";

const bodySchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  code: z.string().min(1, "Saisissez le code reçu par e-mail"),
});

export async function POST(request: Request) {
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
    const resetToken = await verifyPasswordResetCode(parsed.data.email, parsed.data.code);
    return NextResponse.json({ ok: true, resetToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
