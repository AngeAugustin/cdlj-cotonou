import connectToDatabase from "@/lib/mongoose";
import { Actualite } from "./model";
import { CreateActualiteInput, UpdateActualiteInput } from "./schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let count = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Actualite.findOne(query).lean();
    if (!exists) return slug;
    count++;
    slug = `${base}-${count}`;
  }
}

export class ActualiteRepository {
  async findAll(publishedOnly = false) {
    await connectToDatabase();
    const query = publishedOnly ? { published: true } : {};
    return Actualite.find(query).sort({ createdAt: -1 }).lean();
  }

  async findBySlug(slug: string) {
    await connectToDatabase();
    return Actualite.findOne({ slug, published: true }).lean();
  }

  async findById(id: string) {
    await connectToDatabase();
    return Actualite.findById(id).lean();
  }

  async create(data: CreateActualiteInput) {
    await connectToDatabase();
    const baseSlug = generateSlug(data.title);
    const slug = await uniqueSlug(baseSlug);
    return Actualite.create({ ...data, slug });
  }

  async update(id: string, data: UpdateActualiteInput) {
    await connectToDatabase();
    return Actualite.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string) {
    await connectToDatabase();
    return Actualite.findByIdAndDelete(id).lean();
  }
}
