import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ActiviteService } from "@/modules/activites/service";
import { payerParticipationSchema } from "@/modules/activites/schema";
import { getAppBaseUrl } from "@/lib/appBaseUrl";
import { buildActivitePaymentFingerprint } from "@/lib/activitePayments";
import { fedapayFindOrCreateCustomer, fedapayCreateTransactionAndPaymentUrl } from "@/lib/fedapay";
import { sendActivitePaymentConfirmationEmail } from "@/lib/resendMail";
import { syncPaymentFromFedapayTransactionId } from "@/lib/activitePaymentFinalize";
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
  let createdPaymentId: string | null = null;
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

    const selectedLecteurIds = [...new Set(lecteurIds)];
    const existingLecteurIds = new Set(await service.listParticipationLecteurIds(activiteId, paroisseId));
    const alreadyRegistered = selectedLecteurIds.filter((id) => existingLecteurIds.has(id));
    if (alreadyRegistered.length > 0) {
      return NextResponse.json(
        { error: "Un ou plusieurs lecteurs sélectionnés sont déjà inscrits à cette activité." },
        { status: 409 }
      );
    }

    const n = selectedLecteurIds.length;
    const montantUnitaire = activite.montant;
    const montantTotal = montantUnitaire * n;

    const baseUrl = getAppBaseUrl();
    const callbackUrlBase = `${baseUrl}/activites/${encodeURIComponent(activiteId)}/participer?payment=return`;

    const userId = session.user.id ?? userEmail;
    const { first, last } = splitName(session.user.name);
    const phone =
      process.env.FEDAPAY_CUSTOMER_PHONE_PLACEHOLDER?.trim() || "+22997000000";

    const requestFingerprint = buildActivitePaymentFingerprint({
      activiteId,
      paroisseId,
      userId,
      lecteurIds: selectedLecteurIds,
      montantTotal,
    });

    const reusable = await service.findReusableOpenPaiement({
      activiteId,
      paroisseId,
      userId,
      requestFingerprint,
    });
    if (reusable) {
      const reusableId = String((reusable as { _id: mongoose.Types.ObjectId | string })._id);

      if (reusable.fedapayTransactionId != null) {
        const sync = await syncPaymentFromFedapayTransactionId(reusable.fedapayTransactionId, "pay_init_reuse");
        if (!sync.ok) {
          return NextResponse.json(
            { error: sync.error ?? "Synchronisation FedaPay impossible" },
            { status: 502 }
          );
        }
      }

      const freshReusable = await service.findPaiementById(reusableId);
      if (freshReusable) {
        if (freshReusable.status === "approved") {
          return NextResponse.json({ ok: true, alreadyApproved: true, paymentId: reusableId });
        }

        if (freshReusable.status === "approved_pending_registration") {
          return NextResponse.json(
            {
              error:
                "Un paiement précédent a été confirmé, mais l’inscription des lecteurs est encore en cours de finalisation.",
            },
            { status: 409 }
          );
        }

        if (freshReusable.status === "pending" && freshReusable.paymentUrl) {
          return NextResponse.json({
            ok: true,
            reused: true,
            paymentUrl: freshReusable.paymentUrl,
            paymentId: reusableId,
            fedapayTransactionId: freshReusable.fedapayTransactionId ?? null,
          });
        }
      }
    }

    const lecteurOids = selectedLecteurIds.map((x) => new mongoose.Types.ObjectId(x));

    const paymentBase = {
      activiteId: new mongoose.Types.ObjectId(activiteId),
      paroisseId: new mongoose.Types.ObjectId(paroisseId),
      userId,
      userEmail,
      lecteurIds: lecteurOids,
      montantUnitaire,
      nombreLecteurs: n,
      montantTotal,
      requestFingerprint,
      paymentUrl: null,
      callbackUrl: callbackUrlBase,
      gatewayStatus: null,
      statusReason: null,
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
      await service.enregistrerPaiement(activiteId, selectedLecteurIds, paroisseId, pid);
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
    createdPaymentId = paymentId;

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
    if (!Number.isFinite(txId)) {
      await service.updatePaiementById(paymentId, {
        status: "failed",
        statusReason: "fedapay_transaction_id_invalid",
        lastWebhookEvent: "pay_init_invalid_transaction_id",
      });
      return NextResponse.json({ error: "FedaPay : transaction invalide" }, { status: 502 });
    }

    await service.updatePaiementById(paymentId, {
      paymentUrl,
      fedapayTransactionId: txId,
      fedapayReference: reference || null,
      gatewayStatus: "pending",
      statusReason: null,
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
    if (createdPaymentId) {
      try {
        const service = new ActiviteService();
        const current = await service.findPaiementById(createdPaymentId);
        if (current && current.status === "pending") {
          await service.updatePaiementById(createdPaymentId, {
            status: "failed",
            statusReason: error instanceof Error ? error.message.slice(0, 500) : "pay_init_error",
            lastWebhookEvent: "pay_init_error",
          });
        }
      } catch {
        /* ignore rollback failure */
      }
    }

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
