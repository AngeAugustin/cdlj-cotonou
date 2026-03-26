import mongoose from "mongoose";
import { Lecteur, ILecteur } from "./model";
import connectToDatabase from "@/lib/mongoose";
import { CreateLecteurInput, UpdateLecteurInput } from "./schema";
import { ActiviteParticipation } from "@/modules/activites/model";
import { Activite } from "@/modules/activites/model";
import "@/modules/vicariats/model";
import "@/modules/paroisses/model";
import "@/modules/grades/model";

export class LecteurRepository {
  async findAll(): Promise<ILecteur[]> {
    await connectToDatabase();
    const rows = await Lecteur.find()
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeId", "name abbreviation level")
      .sort({ nom: 1, prenoms: 1 })
      .lean();
    return rows as ILecteur[];
  }

  async findById(id: string): Promise<ILecteur | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const row = await Lecteur.findById(id)
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeId", "name abbreviation level")
      .lean();
    return row as ILecteur | null;
  }

  async findByParishId(parishId: string): Promise<ILecteur[]> {
    await connectToDatabase();
    const rows = await Lecteur.find({ paroisseId: parishId })
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeId", "name abbreviation level")
      .sort({ nom: 1, prenoms: 1 })
      .lean();
    return rows as ILecteur[];
  }

  async findByVicariatId(vicariatId: string): Promise<ILecteur[]> {
    await connectToDatabase();
    const rows = await Lecteur.find({ vicariatId })
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeId", "name abbreviation level")
      .sort({ nom: 1, prenoms: 1 })
      .lean();
    return rows as ILecteur[];
  }

  async countByVicariatAbbr(abbrPattern: string): Promise<number> {
    await connectToDatabase();
    return Lecteur.countDocuments({ uniqueId: { $regex: `^${abbrPattern}` } });
  }

  async findParticipationHistory(lecteurId: string) {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(lecteurId)) return [];
    const lid = new mongoose.Types.ObjectId(lecteurId);
    const rows = await ActiviteParticipation.find({ lecteurId: lid }).sort({ paidAt: -1 }).lean();
    if (!rows.length) return [];
    const ids = [...new Set(rows.map((r) => String(r.activiteId)))];
    const oids = ids.map((i) => new mongoose.Types.ObjectId(i));
    const acts = await Activite.find({ _id: { $in: oids } })
      .select("nom dateDebut dateFin lieu terminee montant")
      .lean();
    const map = new Map(acts.map((a) => [a._id.toString(), a]));
    return rows.map((r) => ({
      paidAt: r.paidAt,
      activite: map.get(String(r.activiteId)) ?? null,
    }));
  }

  async create(data: CreateLecteurInput & { uniqueId: string }): Promise<ILecteur> {
    await connectToDatabase();
    await Lecteur.create({
      nom: data.nom.trim(),
      prenoms: data.prenoms.trim(),
      dateNaissance: data.dateNaissance,
      sexe: data.sexe,
      gradeId: data.gradeId ? new mongoose.Types.ObjectId(data.gradeId) : undefined,
      anneeAdhesion: data.anneeAdhesion,
      niveau: data.niveau.trim(),
      details: data.details?.trim() || undefined,
      contact: data.contact.trim(),
      contactUrgence: data.contactUrgence.trim(),
      adresse: data.adresse.trim(),
      maux: data.maux?.trim() || undefined,
      photo: data.photo,
      photoIdentite: data.photoIdentite,
      vicariatId: new mongoose.Types.ObjectId(data.vicariatId),
      paroisseId: new mongoose.Types.ObjectId(data.paroisseId),
      uniqueId: data.uniqueId,
    });
    const created = await Lecteur.findOne({ uniqueId: data.uniqueId })
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeId", "name abbreviation level")
      .lean();
    return created as ILecteur;
  }

  async update(id: string, data: UpdateLecteurInput): Promise<ILecteur | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const patch: Record<string, unknown> = {};
    if (data.nom !== undefined) patch.nom = data.nom.trim();
    if (data.prenoms !== undefined) patch.prenoms = data.prenoms.trim();
    if (data.dateNaissance !== undefined) patch.dateNaissance = data.dateNaissance;
    if (data.sexe !== undefined) patch.sexe = data.sexe;
    if (data.gradeId !== undefined) {
      patch.gradeId = data.gradeId ? new mongoose.Types.ObjectId(data.gradeId) : null;
    }
    if (data.anneeAdhesion !== undefined) patch.anneeAdhesion = data.anneeAdhesion;
    if (data.niveau !== undefined) patch.niveau = data.niveau.trim();
    if (data.details !== undefined) patch.details = data.details?.trim() || undefined;
    if (data.contact !== undefined) patch.contact = data.contact.trim();
    if (data.contactUrgence !== undefined) patch.contactUrgence = data.contactUrgence.trim();
    if (data.adresse !== undefined) patch.adresse = data.adresse.trim();
    if (data.maux !== undefined) patch.maux = data.maux?.trim() || undefined;
    if (data.photo !== undefined) patch.photo = data.photo;
    if (data.photoIdentite !== undefined) patch.photoIdentite = data.photoIdentite;
    if (data.vicariatId !== undefined) patch.vicariatId = new mongoose.Types.ObjectId(data.vicariatId);
    if (data.paroisseId !== undefined) patch.paroisseId = new mongoose.Types.ObjectId(data.paroisseId);

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    await Lecteur.findByIdAndUpdate(id, { $set: patch }, { new: true });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ActiviteParticipation.deleteMany({ lecteurId: id });
    const result = await Lecteur.findByIdAndDelete(id);
    return !!result;
  }
}
