import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { EvaluationService } from "@/modules/evaluations/service";
import { RESULTAT_CONSULTATION_MONTANT } from "@/modules/evaluations/model";
import { getAppBaseUrl } from "@/lib/appBaseUrl";
import {
  buildResultatConsultationFingerprint,
  RESULTAT_SHARED_CUSTOMER,
  resultatSharedCustomerEmail,
  resultatSharedCustomerId,
} from "@/lib/resultatConsultationPayments";
import { fedapayFindOrCreateCustomer, fedapayCreateTransactionAndPaymentUrl } from "@/lib/fedapay";
import { syncResultatPaymentFromFedapayTransactionId } from "@/lib/resultatPaymentFinalize";
import connectToDatabase from "@/lib/mongoose";
import { Lecteur } from "@/modules/lecteurs/model";
import { getErrorMessage } from "@/lib/errorMessage";

const bodySchema = z.object({
  uniqueId: z.string().trim().min(1, "Le numéro lecteur est requis."),
});

export async function POST(request: Request) {
  let createdPaymentId: string | null = null;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
    }

    const uniqueId = parsed.data.uniqueId.trim().toUpperCase();
    const service = new EvaluationService();
    const check = await service.checkPublicResultConsultation(uniqueId);

    if (!check) {
      return NextResponse.json({ error: "Aucun lecteur trouvé avec ce numéro." }, { status: 404 });
    }
    if (!check.hasResult) {
      return NextResponse.json({ error: "Aucun résultat publié pour l'année en cours." }, { status: 400 });
    }
    if (check.paid) {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }
    if (!check.evaluationId) {
      return NextResponse.json({ error: "Évaluation introuvable pour ce résultat." }, { status: 400 });
    }

    await connectToDatabase();
    const lecteur = await Lecteur.findOne({ uniqueId }).lean();
    if (!lecteur) {
      return NextResponse.json({ error: "Aucun lecteur trouvé avec ce numéro." }, { status: 404 });
    }

    const montantTotal = RESULTAT_CONSULTATION_MONTANT;
    const requestFingerprint = buildResultatConsultationFingerprint({
      uniqueId,
      annee: check.annee,
      montantTotal,
    });

    const reusable = await service.findReusableOpenResultatPaiement({ requestFingerprint });
    if (reusable) {
      const reusableId = String(reusable._id);

      if (reusable.fedapayTransactionId != null) {
        const sync = await syncResultatPaymentFromFedapayTransactionId(reusable.fedapayTransactionId, "pay_init_reuse");
        if (!sync.ok) {
          return NextResponse.json({ error: sync.error ?? "Synchronisation FedaPay impossible" }, { status: 502 });
        }
      }

      const freshReusable = await service.findResultatPaiementById(reusableId);
      if (freshReusable) {
        if (freshReusable.status === "approved") {
          return NextResponse.json({ ok: true, alreadyPaid: true, paymentId: reusableId });
        }
        if (freshReusable.status === "pending" && freshReusable.paymentUrl) {
          return NextResponse.json({
            ok: true,
            reused: true,
            paymentUrl: freshReusable.paymentUrl,
            paymentId: reusableId,
          });
        }
      }
    }

    const baseUrl = getAppBaseUrl();
    const callbackUrlBase = `${baseUrl}/resultats?payment=return&uniqueId=${encodeURIComponent(uniqueId)}`;

    const paymentBase = {
      evaluationId: new mongoose.Types.ObjectId(check.evaluationId),
      lecteurId: lecteur._id as mongoose.Types.ObjectId,
      uniqueId,
      annee: check.annee,
      vicariatId: lecteur.vicariatId as mongoose.Types.ObjectId,
      paroisseId: lecteur.paroisseId as mongoose.Types.ObjectId,
      montantTotal,
      requestFingerprint,
      paymentUrl: null,
      callbackUrl: callbackUrlBase,
      gatewayStatus: null,
      statusReason: null,
      metadata: {
        source: "cdlj-resultat",
        uniqueId,
        annee: String(check.annee),
      } as Record<string, unknown>,
    };

    const pending = await service.createResultatPaiementDoc({
      ...paymentBase,
      status: "pending",
    });
    const paymentId = String((pending as { _id: mongoose.Types.ObjectId })._id);
    createdPaymentId = paymentId;

    const callbackUrl = `${callbackUrlBase}&pid=${encodeURIComponent(paymentId)}`;
    await service.updateResultatPaiementById(paymentId, { callbackUrl });

    const phone = process.env.FEDAPAY_CUSTOMER_PHONE_PLACEHOLDER?.trim() || "+22997000000";
    // Un seul client FedaPay pour toutes les consultations (évite conflit e-mail par lecteur).
    let customerId = resultatSharedCustomerId();
    if (customerId == null) {
      const customer = await fedapayFindOrCreateCustomer({
        email: resultatSharedCustomerEmail(),
        firstname: RESULTAT_SHARED_CUSTOMER.firstname,
        lastname: RESULTAT_SHARED_CUSTOMER.lastname,
        phone,
      });
      customerId = Number((customer as { id?: number }).id);
    }
    if (!Number.isFinite(customerId) || customerId == null) {
      await service.updateResultatPaiementById(paymentId, {
        status: "failed",
        lastWebhookEvent: "customer_create_invalid",
      });
      return NextResponse.json({ error: "FedaPay : client invalide" }, { status: 502 });
    }

    await service.updateResultatPaiementById(paymentId, {
      fedapayCustomerId: customerId,
      metadata: {
        ...paymentBase.metadata,
        internalPaymentId: paymentId,
      },
    });

    const { transaction, paymentUrl } = await fedapayCreateTransactionAndPaymentUrl({
      customerId,
      amount: montantTotal,
      description: `CDLJ — Consultation résultat ${check.annee} (${uniqueId})`,
      callbackUrl,
      metadata: {
        internalPaymentId: paymentId,
        source: "cdlj-resultat",
        uniqueId,
        annee: String(check.annee),
        evaluationId: check.evaluationId,
      },
    });

    const txId = Number((transaction as { id?: number }).id);
    if (!Number.isFinite(txId)) {
      await service.updateResultatPaiementById(paymentId, {
        status: "failed",
        statusReason: "fedapay_transaction_id_invalid",
      });
      return NextResponse.json({ error: "FedaPay : transaction invalide" }, { status: 502 });
    }

    const reference = String((transaction as { reference?: string }).reference ?? "");
    await service.updateResultatPaiementById(paymentId, {
      fedapayTransactionId: txId,
      fedapayReference: reference || null,
      paymentUrl,
    });

    return NextResponse.json({ ok: true, paymentUrl, paymentId, fedapayTransactionId: txId });
  } catch (error: unknown) {
    if (createdPaymentId) {
      try {
        const service = new EvaluationService();
        await service.updateResultatPaiementById(createdPaymentId, {
          status: "failed",
          statusReason: getErrorMessage(error).slice(0, 500),
        });
      } catch {
        /* ignore */
      }
    }
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
