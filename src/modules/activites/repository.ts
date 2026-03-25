import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { Activite, ActiviteParticipation } from "./model";
import { Lecteur } from "@/modules/lecteurs/model";
import { CreateActiviteInput, UpdateActiviteInput } from "./schema";

function parseDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide");
  return d;
}

export class ActiviteRepository {
  async findAll() {
    await connectToDatabase();
    return Activite.find().sort({ dateDebut: -1 }).lean();
  }

  async findById(id: string) {
    await connectToDatabase();
    return Activite.findById(id).lean();
  }

  async create(data: CreateActiviteInput) {
    await connectToDatabase();
    const doc = await Activite.create({
      nom: data.nom,
      dateDebut: parseDate(data.dateDebut),
      dateFin: parseDate(data.dateFin),
      lieu: data.lieu,
      montant: data.montant,
      delaiPaiement: parseDate(data.delaiPaiement),
      numeroPaiement: data.numeroPaiement.trim(),
      image: data.image,
      terminee: false,
    });
    return Activite.findById(doc._id).lean();
  }

  async update(id: string, data: UpdateActiviteInput) {
    await connectToDatabase();
    const patch: Record<string, unknown> = {};
    if (data.nom !== undefined) patch.nom = data.nom;
    if (data.lieu !== undefined) patch.lieu = data.lieu;
    if (data.montant !== undefined) patch.montant = data.montant;
    if (data.image !== undefined) patch.image = data.image;
    if (data.dateDebut !== undefined) patch.dateDebut = parseDate(data.dateDebut);
    if (data.dateFin !== undefined) patch.dateFin = parseDate(data.dateFin);
    if (data.delaiPaiement !== undefined) patch.delaiPaiement = parseDate(data.delaiPaiement);
    if (data.numeroPaiement !== undefined) patch.numeroPaiement = data.numeroPaiement.trim();
    return Activite.findByIdAndUpdate(id, patch, { new: true }).lean();
  }

  async setTerminee(id: string, terminee: boolean) {
    await connectToDatabase();
    return Activite.findByIdAndUpdate(id, { terminee }, { new: true }).lean();
  }

  async delete(id: string) {
    await connectToDatabase();
    await ActiviteParticipation.deleteMany({ activiteId: id });
    return Activite.findByIdAndDelete(id).lean();
  }

  async listParticipationLecteurIds(activiteId: string, paroisseId?: string) {
    await connectToDatabase();
    const q: Record<string, unknown> = { activiteId };
    if (paroisseId) q.paroisseId = paroisseId;
    const rows = await ActiviteParticipation.find(q).select("lecteurId").lean();
    return rows.map((r) => r.lecteurId.toString());
  }

  async addParticipations(
    activiteId: string,
    lecteurIds: string[],
    allowedParoisseId: string
  ) {
    await connectToDatabase();
    const uniqueIds = [...new Set(lecteurIds)];
    const aid = new mongoose.Types.ObjectId(activiteId);
    const lecteurs = await Lecteur.find({
      _id: { $in: uniqueIds },
      paroisseId: allowedParoisseId,
    })
      .select("_id paroisseId vicariatId")
      .lean();

    if (lecteurs.length !== uniqueIds.length) {
      throw new Error("Certains lecteurs ne sont pas rattachés à votre paroisse");
    }

    const ops = lecteurs.map((l) => ({
      updateOne: {
        filter: { activiteId: aid, lecteurId: l._id },
        update: {
          $setOnInsert: {
            activiteId: aid,
            lecteurId: l._id,
            paroisseId: l.paroisseId,
            vicariatId: l.vicariatId,
            paidAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (ops.length) await ActiviteParticipation.bulkWrite(ops);
    return lecteurs.length;
  }

  async listParticipantsWithLecteur(activiteId: string, paroisseId?: string) {
    await connectToDatabase();
    const match: Record<string, unknown> = { activiteId: new mongoose.Types.ObjectId(activiteId) };
    if (paroisseId) match.paroisseId = new mongoose.Types.ObjectId(paroisseId);

    const rows = await ActiviteParticipation.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "lecteurs",
          localField: "lecteurId",
          foreignField: "_id",
          as: "lecteur",
        },
      },
      { $unwind: "$lecteur" },
      {
        $lookup: {
          from: "grades",
          localField: "lecteur.gradeId",
          foreignField: "_id",
          as: "grade",
        },
      },
      { $unwind: { path: "$grade", preserveNullAndEmptyArrays: true } },
      { $sort: { "lecteur.nom": 1, "lecteur.prenoms": 1 } },
      {
        $project: {
          paidAt: 1,
          "lecteur._id": 1,
          "lecteur.nom": 1,
          "lecteur.prenoms": 1,
          "lecteur.uniqueId": 1,
          "lecteur.dateNaissance": 1,
          "grade.name": 1,
          "grade.abbreviation": 1,
        },
      },
    ]);

    return rows;
  }

  async countLecteurs(vicariatId?: string | null) {
    await connectToDatabase();
    const q = vicariatId ? { vicariatId } : {};
    return Lecteur.countDocuments(q);
  }

  async countParticipantsForActivite(activiteId: string, vicariatId?: string | null) {
    await connectToDatabase();
    const match: Record<string, unknown> = { activiteId: new mongoose.Types.ObjectId(activiteId) };
    if (vicariatId) match.vicariatId = new mongoose.Types.ObjectId(vicariatId);
    return ActiviteParticipation.countDocuments(match);
  }

  async countParticipantsForActiviteParoisse(activiteId: string, paroisseId: string) {
    if (!mongoose.Types.ObjectId.isValid(activiteId) || !mongoose.Types.ObjectId.isValid(paroisseId)) return 0;
    await connectToDatabase();
    return ActiviteParticipation.countDocuments({
      activiteId: new mongoose.Types.ObjectId(activiteId),
      paroisseId: new mongoose.Types.ObjectId(paroisseId),
    });
  }

  async statsByParoisse(activiteId: string, vicariatId?: string | null) {
    await connectToDatabase();
    const match: Record<string, unknown> = { activiteId: new mongoose.Types.ObjectId(activiteId) };
    if (vicariatId) match.vicariatId = new mongoose.Types.ObjectId(vicariatId);

    return ActiviteParticipation.aggregate([
      { $match: match },
      { $group: { _id: "$paroisseId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "paroisses",
          localField: "_id",
          foreignField: "_id",
          as: "paroisse",
        },
      },
      { $unwind: "$paroisse" },
      {
        $lookup: {
          from: "vicariats",
          localField: "paroisse.vicariatId",
          foreignField: "_id",
          as: "vicariat",
        },
      },
      { $unwind: { path: "$vicariat", preserveNullAndEmptyArrays: true } },
      { $sort: { count: -1, "paroisse.name": 1 } },
      {
        $project: {
          paroisseId: "$_id",
          paroisseName: "$paroisse.name",
          vicariatName: "$vicariat.name",
          count: 1,
        },
      },
    ]);
  }
}
