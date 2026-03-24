import { Lecteur, ILecteur } from "./model";
import connectToDatabase from "@/lib/mongoose";
import { CreateLecteurInput, UpdateLecteurInput } from "./schema";

export class LecteurRepository {
  async findAll(): Promise<ILecteur[]> {
    await connectToDatabase();
    return Lecteur.find()
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .lean();
  }

  async findById(id: string): Promise<ILecteur | null> {
    await connectToDatabase();
    return Lecteur.findById(id)
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .lean();
  }

  async findByParishId(parishId: string): Promise<ILecteur[]> {
    await connectToDatabase();
    return Lecteur.find({ paroisseId: parishId })
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .lean();
  }

  async findByVicariatId(vicariatId: string): Promise<ILecteur[]> {
    await connectToDatabase();
    return Lecteur.find({ vicariatId })
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .lean();
  }

  async countByVicariatAbbr(abbrPattern: string): Promise<number> {
    await connectToDatabase();
    return Lecteur.countDocuments({ uniqueId: { $regex: `^${abbrPattern}` } });
  }

  async create(data: CreateLecteurInput & { uniqueId: string }): Promise<ILecteur> {
    await connectToDatabase();
    const newLecteur = new Lecteur(data);
    return newLecteur.save();
  }

  async update(id: string, data: UpdateLecteurInput): Promise<ILecteur | null> {
    await connectToDatabase();
    return Lecteur.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Lecteur.findByIdAndDelete(id);
    return !!result;
  }
}
