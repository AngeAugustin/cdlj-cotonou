import { Vicariat, IVicariat } from "./model";
import connectToDatabase from "@/lib/mongoose";

export class VicariatRepository {
  async findAll(): Promise<IVicariat[]> {
    await connectToDatabase();
    return Vicariat.find().sort({ name: 1 }).lean();
  }

  async findById(id: string): Promise<IVicariat | null> {
    await connectToDatabase();
    return Vicariat.findById(id).lean();
  }

  async create(data: any): Promise<IVicariat> {
    await connectToDatabase();
    const newDoc = new Vicariat(data);
    return newDoc.save();
  }

  async update(id: string, data: any): Promise<IVicariat | null> {
    await connectToDatabase();
    return Vicariat.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Vicariat.findByIdAndDelete(id);
    return !!result;
  }
}
