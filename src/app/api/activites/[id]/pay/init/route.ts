import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { payerParticipationSchema } from "@/modules/activites/schema";
import { getAppBaseUrl } from "@/lib/appBaseUrl";
import { fedapayFindOrCreateCustomer, fedapayCreateTransactionAndPaymentUrl } from "@/lib/fedapay";
import { sendActivitePaymentConfirmationEmail } from "@/lib/resendMail";
import mongoose from "mongoose";
import { ZodError } from "zod";

function splitName(displayName: string | null | undefined): { first: string; last: string } {
  const n = (displayName ?? "Utilisateur").trim() || "Utilisateur";
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return { first: parts[0], last: parts.slice(1).join(" ") };
  }
  return { first: n, last: "CDLJ" };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user?: {
        roles?: string[];
        parishId?: string;
        email?: string | null;
        name?: string | null;
        id?: string;
      };
    } | null;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles: string[] = session.user.roles ?? [];
    if (!roles.includes("PAROISSIAL")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paroisseId = session.user.parishId;
    if (!paroisseId) {
      return NextResponse.json({ error: "Paroisse non définie pour ce compte" }, { status: 400 });
    }

    const userEmail = session.user.email?.trim();
    if (!userEmail) {
      return NextResponse.json({ error: "E-mail du compte requis pour le paiement" }, { status: 400 });
    }

    const { id: activiteId } = await params;
    const body = await request.json();
    const { lecteurIds } = payerParticipationSchema.parse(body);

    const service = new ActiviteService();
    const activite = await service.getActivite(activiteId);
    if (!activite) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    if (activite.terminee) {
      return NextResponse.json({ error: "Cette activité est terminée" }, { status: 400 });
    }

    const n = lecteurIds.length;
    const montantUnitaire = activite.montant;
    const montantTotal = montantUnitaire * n;

    const baseUrl = getAppBaseUrl();
    const callbackUrlBase = `${baseUrl}/activites/${encodeURIComponent(activiteId)}/participer?payment=return`;

    const userId = session.user.id ?? userEmail;
    const { first, last } = splitName(session.user.name);
    const phone =
      process.env.FEDAPAY_CUSTOMER_PHONE_PLACEHOLDER?.trim() || "+22997000000";

    const lecteurOids = lecteurIds.map((x) => new mongoose.Types.ObjectId(x));

    const paymentBase = {
      activiteId: new mongoose.Types.ObjectId(activiteId),
      paroisseId: new mongoose.Types.ObjectId(paroisseId),
      userId,
      userEmail,
      lecteurIds: lecteurOids,
      montantUnitaire,
      nombreLecteurs: n,
      montantTotal,
      callbackUrl: callbackUrlBase,
      metadata: {
        activiteNom: activite.nom,
        source: "cdlj-activite",
      } as Record<string, unknown>,
    };

    /** Activité gratuite : pas de passage par FedaPay */
    if (montantTotal < 1) {
      const created = await service.createPaiementDoc({
        ...paymentBase,
        status: "approved",
        metadata: { ...paymentBase.metadata, channel: "gratuit" },
      });
      const pid = (created as { _id: mongoose.Types.ObjectId })._id.toString();
      await service.enregistrerPaiement(activiteId, lecteurIds, paroisseId, pid);
      await service.updatePaiementById(pid, {
        processedAt: new Date(),
        lastWebhookEvent: "free_activity",
      });
      try {
        await sendActivitePaymentConfirmationEmail(userEmail, {
          activiteNom: activite.nom,
          montantTotal: 0,
          montantUnitaire,
          nombreLecteurs: n,
          reference: null,
        });
        await service.updatePaiementById(pid, { emailSentAt: new Date() });
      } catch {
        /* e-mail optionnel */
      }
      return NextResponse.json({ ok: true, free: true, paymentId: pid });
    }

    const pending = await service.createPaiementDoc({
      ...paymentBase,
      status: "pending",
    });
    const paymentId = (pending as { _id: mongoose.Types.ObjectId })._id.toString();

    const callbackUrl = `${callbackUrlBase}&pid=${encodeURIComponent(paymentId)}`;
    await service.updatePaiementById(paymentId, { callbackUrl });

    const customer = await fedapayFindOrCreateCustomer({
      email: userEmail,
      firstname: first,
      lastname: last,
      phone,
    });

    const customerId = Number((customer as { id?: number }).id);
    if (!Number.isFinite(customerId)) {
      await service.updatePaiementById(paymentId, { status: "failed", lastWebhookEvent: "customer_create_invalid" });
      return NextResponse.json({ error: "FedaPay : client invalide" }, { status: 502 });
    }

    await service.updatePaiementById(paymentId, {
      fedapayCustomerId: customerId,
      metadata: {
        ...paymentBase.metadata,
        internalPaymentId: paymentId,
      },
    });

    const { transaction, paymentUrl } = await fedapayCreateTransactionAndPaymentUrl({
      customerId,
      amount: montantTotal,
      description: `CDLJ — ${activite.nom} (${n} lecteur(s))`,
      callbackUrl,
      metadata: {
        internalPaymentId: paymentId,
        activiteId,
        paroisseId,
      },
    });

    const txId = Number((transaction as { id?: number }).id);
    const reference = String((transaction as { reference?: string }).reference ?? "");

    await service.updatePaiementById(paymentId, {
      fedapayTransactionId: txId,
      fedapayReference: reference || null,
      metadata: {
        ...paymentBase.metadata,
        internalPaymentId: paymentId,
        fedapayTransactionId: txId,
      },
    });

    return NextResponse.json({
      ok: true,
      paymentUrl,
      paymentId,
      fedapayTransactionId: txId,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const msg = error.issues.map((i) => i.message).join("; ") || "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const msg = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[pay/init]", activiteIdFromRequest(request.url), error);

    const lower = msg.toLowerCase();
    if (
      lower.includes("nextauth_url") ||
      lower.includes("fedapay_secret_key") ||
      lower.includes("n'est pas configuré")
    ) {
      return NextResponse.json(
        { error: "Configuration serveur incomplète (URL publique ou clés FedaPay). Vérifiez les variables sur Vercel." },
        { status: 500 }
      );
    }

    if (lower.includes("fedapay") || lower.includes("request failed") || lower.includes("network")) {
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function activiteIdFromRequest(url: string): string {
  try {
    const m = url.match(/\/api\/activites\/([^/]+)\/pay\/init/);
    return m?.[1] ?? "?";
  } catch {
    return "?";
  }
}
