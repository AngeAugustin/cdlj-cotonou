import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { Mediatheque } from "./model";
import { CreateMediathequeInput, UpdateMediathequeInput } from "./schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const safeBase = base || "album";
  let slug = safeBase;
  let count = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Mediatheque.findOne(query).lean();
    if (!exists) return slug;
    count++;
    slug = `${safeBase}-${count}`;
  }
}

export class MediathequeRepository {
  async ensureMissingSlugs() {
    await connectToDatabase();
    const missing = await Mediatheque.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    }).lean();

    for (const item of missing) {
      const id = String(item._id);
      const base = generateSlug(item.nom) || `album-${id.slice(-6)}`;
      const slug = await uniqueSlug(base, id);
      await Mediatheque.updateOne({ _id: item._id }, { $set: { slug } });
    }
  }

  async findAll(publishedOnly = false) {
    await connectToDatabase();
    await this.ensureMissingSlugs();
    const query = publishedOnly ? { published: true } : {};
    return Mediatheque.find(query)
      .sort({ annee: -1, mois: -1, createdAt: -1 })
      .lean();
  }

  async findBySlug(slug: string) {
    await connectToDatabase();
    await this.ensureMissingSlugs();
    return Mediatheque.findOne({ slug, published: true }).lean();
  }

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    return Mediatheque.findById(id).lean();
  }

  async create(data: CreateMediathequeInput) {
    await connectToDatabase();
    const baseSlug = generateSlug(data.nom);
    const slug = await uniqueSlug(baseSlug);
    return Mediatheque.create({ ...data, slug });
  }

  async update(id: string, data: UpdateMediathequeInput) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const existing = await Mediatheque.findById(id).lean();
    if (!existing) return null;

    const updateData: UpdateMediathequeInput & { slug?: string } = { ...data };
    if (!existing.slug) {
      const base = generateSlug(data.nom || existing.nom) || `album-${id.slice(-6)}`;
      updateData.slug = await uniqueSlug(base, id);
    }

    return Mediatheque.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    return Mediatheque.findByIdAndDelete(id).lean();
  }
}
