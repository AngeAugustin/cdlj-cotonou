import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { resetPasswordWithToken } from "@/modules/password-reset/service";

const bodySchema = z
  .object({
    resetToken: z.string().min(1, "Jeton manquant"),
    newPassword: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
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
    await resetPasswordWithToken(parsed.data.resetToken, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: "La session a expiré. Saisissez à nouveau le code reçu par e-mail." },
        { status: 401 }
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Lien de réinitialisation invalide." }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
