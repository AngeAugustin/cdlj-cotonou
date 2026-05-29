import connectToDatabase from "@/lib/mongoose";
import { Mediatheque } from "./model";
import { CreateMediathequeInput, UpdateMediathequeInput } from "./schema";

export class MediathequeRepository {
  async findAll(publishedOnly = false) {
    await connectToDatabase();
    const query = publishedOnly ? { published: true } : {};
    return Mediatheque.find(query)
      .sort({ annee: -1, mois: -1, createdAt: -1 })
      .lean();
  }

  async findById(id: string) {
    await connectToDatabase();
    return Mediatheque.findById(id).lean();
  }

  async create(data: CreateMediathequeInput) {
    await connectToDatabase();
    return Mediatheque.create(data);
  }

  async update(id: string, data: UpdateMediathequeInput) {
    await connectToDatabase();
    return Mediatheque.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string) {
    await connectToDatabase();
    return Mediatheque.findByIdAndDelete(id).lean();
  }
}
