import mongoose from "mongoose";
import { Paroisse, IParoisse } from "./model";
import connectToDatabase from "@/lib/mongoose";
import { CreateParoisseInput, UpdateParoisseInput } from "./schema";

export class ParoisseRepository {
  async findAll(filters?: { vicariatId?: string }): Promise<any[]> {
    await connectToDatabase();
    const match: any = {};
    if (filters?.vicariatId) {
      match.vicariatId = new mongoose.Types.ObjectId(filters.vicariatId);
    }

    return Paroisse.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "vicariats",
          localField: "vicariatId",
          foreignField: "_id",
          as: "vicariat",
        },
      },
      { $unwind: { path: "$vicariat", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "lecteurs",
          localField: "_id",
          foreignField: "paroisseId",
          as: "lecteurs",
        },
      },
      {
        $project: {
          name:          1,
          cureName:      1,
          coordonnateur: 1,
          logo:          1,
          vicariatId:    1,
          createdAt:     1,
          vicariat: { _id: 1, name: 1, abbreviation: 1 },
          lecteurCount: { $size: "$lecteurs" },
        },
      },
      { $sort: { name: 1 } },
    ]);
  }

  async findById(id: string): Promise<IParoisse | null> {
    await connectToDatabase();
    return Paroisse.findById(id).lean() as Promise<IParoisse | null>;
  }

  async create(data: CreateParoisseInput): Promise<IParoisse> {
    await connectToDatabase();
    const paroisse = new Paroisse(data);
    return paroisse.save();
  }

  async update(id: string, data: UpdateParoisseInput): Promise<IParoisse | null> {
    await connectToDatabase();
    return Paroisse.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<IParoisse | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Paroisse.findByIdAndDelete(id);
    return !!result;
  }
}
