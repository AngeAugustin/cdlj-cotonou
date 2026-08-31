import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { Lecteur } from "@/modules/lecteurs/model";
import {
  ResultatConsultationPaiement,
  ResultatConsultationPaiementStatus,
} from "./model";

export class ResultatPaiementsRepository {
  async createPaiementDoc(data: {
    evaluationId: mongoose.Types.ObjectId;
    lecteurId: mongoose.Types.ObjectId;
    uniqueId: string;
    annee: number;
    vicariatId: mongoose.Types.ObjectId;
    paroisseId: mongoose.Types.ObjectId;
    montantTotal: number;
    status: ResultatConsultationPaiementStatus;
    requestFingerprint: string;
    paymentUrl: string | null;
    callbackUrl: string;
    gatewayStatus: string | null;
    statusReason: string | null;
    metadata: Record<string, unknown>;
  }) {
    await connectToDatabase();
    const doc = await ResultatConsultationPaiement.create(data);
    return doc.toObject();
  }

  async updatePaiementById(
    id: string,
    patch: Partial<{
      status: ResultatConsultationPaiementStatus;
      paymentUrl: string | null;
      fedapayTransactionId: number | null;
      fedapayReference: string | null;
      fedapayCustomerId: number | null;
      gatewayStatus: string | null;
      statusReason: string | null;
      callbackUrl: string;
      metadata: Record<string, unknown>;
      processedAt: Date | null;
      refundedAt: Date | null;
      timedOutAt: Date | null;
      lastWebhookEvent: string | null;
    }>
  ) {
    await connectToDatabase();
    return ResultatConsultationPaiement.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  }

  async findPaiementById(id: string) {
    await connectToDatabase();
    return ResultatConsultationPaiement.findById(id).lean();
  }

  async findPaiementByFedapayTransactionId(txId: number) {
    await connectToDatabase();
    return ResultatConsultationPaiement.findOne({ fedapayTransactionId: txId }).lean();
  }

  async findReusableOpenPaiement(opts: { requestFingerprint: string }) {
    await connectToDatabase();
    return ResultatConsultationPaiement.findOne({
      requestFingerprint: opts.requestFingerprint,
      status: { $in: ["pending", "non_finalized", "approved_pending_registration", "approved"] },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  async hasApprovedPayment(lecteurId: string, annee: number) {
    await connectToDatabase();
    const exists = await ResultatConsultationPaiement.exists({
      lecteurId: new mongoose.Types.ObjectId(lecteurId),
      annee,
      status: "approved",
    });
    return !!exists;
  }

  async listPaiementsForEvaluation(
    evaluationId: string,
    opts?: { paroisseId?: string | null; paroisseIds?: string[] | null; vicariatId?: string | null }
  ) {
    await connectToDatabase();
    const match: Record<string, unknown> = { evaluationId: new mongoose.Types.ObjectId(evaluationId) };
    if (opts?.paroisseId) {
      match.paroisseId = new mongoose.Types.ObjectId(opts.paroisseId);
    } else if (opts?.vicariatId) {
      const vicariatOid = new mongoose.Types.ObjectId(opts.vicariatId);
      const parishOids = (opts.paroisseIds ?? []).map((id) => new mongoose.Types.ObjectId(id));
      match.$or = [{ vicariatId: vicariatOid }, ...(parishOids.length ? [{ paroisseId: { $in: parishOids } }] : [])];
    } else if (opts?.paroisseIds?.length) {
      match.paroisseId = { $in: opts.paroisseIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const rows = await ResultatConsultationPaiement.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "paroisses",
          localField: "paroisseId",
          foreignField: "_id",
          as: "paroisse",
        },
      },
      { $unwind: { path: "$paroisse", preserveNullAndEmptyArrays: true } },
    ]);

    const withLecteur = await Promise.all(
      rows.map(async (r) => {
        const lecteur = await Lecteur.findById(r.lecteurId).select("nom prenoms uniqueId").lean();
        return {
          ...r,
          _id: r._id,
          paroisseName: r.paroisse?.name ?? "—",
          lecteur: lecteur
            ? { _id: lecteur._id, nom: lecteur.nom, prenoms: lecteur.prenoms, uniqueId: lecteur.uniqueId }
            : null,
        };
      })
    );

    return withLecteur;
  }
}
