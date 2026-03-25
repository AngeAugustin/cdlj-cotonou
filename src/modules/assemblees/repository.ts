import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { AssembleeGenerale, AssembleeRapport, IAssembleeGenerale, IAssembleeRapport } from "./model";
import { CreateAssembleeGeneraleInput, UpdateAssembleeGeneraleInput, UpsertAssembleeRapportInput } from "./schema";

function parseDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide");
  return d;
}

export class AssembleeGeneraleRepository {
  async findAll(): Promise<IAssembleeGenerale[]> {
    await connectToDatabase();
    return AssembleeGenerale.find().sort({ date: -1 }).lean();
  }

  async findById(id: string): Promise<IAssembleeGenerale | null> {
    await connectToDatabase();
    return AssembleeGenerale.findById(id).lean();
  }

  async create(data: CreateAssembleeGeneraleInput): Promise<IAssembleeGenerale> {
    await connectToDatabase();
    const doc = await AssembleeGenerale.create({
      nom: data.nom.trim(),
      date: parseDate(data.date),
      lieu: data.lieu.trim(),
      image: data.image?.trim() || undefined,
      terminee: false,
    });
    return AssembleeGenerale.findById(doc._id).lean() as Promise<IAssembleeGenerale>;
  }

  async update(id: string, data: UpdateAssembleeGeneraleInput): Promise<IAssembleeGenerale | null> {
    await connectToDatabase();
    const patch: Record<string, unknown> = {};

    if (data.nom !== undefined) patch.nom = data.nom.trim();
    if (data.lieu !== undefined) patch.lieu = data.lieu.trim();
    if (data.image !== undefined) patch.image = data.image?.trim() || undefined;
    if (data.date !== undefined) patch.date = parseDate(data.date);

    return AssembleeGenerale.findByIdAndUpdate(id, patch, { new: true }).lean();
  }

  async setTerminee(id: string, terminee: boolean): Promise<IAssembleeGenerale | null> {
    await connectToDatabase();
    return AssembleeGenerale.findByIdAndUpdate(id, { terminee }, { new: true }).lean();
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    await AssembleeRapport.deleteMany({ assembleeId: id });
    const result = await AssembleeGenerale.findByIdAndDelete(id);
    return !!result;
  }

  async upsertRapport(assembleeId: string, vicariatId: string | null, payload: UpsertAssembleeRapportInput) {
    await connectToDatabase();

    const update: Record<string, unknown> = {
      fileUrl: payload.fileUrl,
      originalName: payload.originalName,
      mimeType: payload.mimeType,
    };
    if (!vicariatId) {
      update.vicariatMention = payload.vicariatMention ?? "DIOCESAIN";
    }

    await AssembleeRapport.updateOne(
      {
        assembleeId: new mongoose.Types.ObjectId(assembleeId),
        vicariatId: vicariatId ? new mongoose.Types.ObjectId(vicariatId) : null,
      },
      { $set: update },
      { upsert: true }
    );

    return this.getRapportForVicariat(assembleeId, vicariatId);
  }

  async getRapportForVicariat(assembleeId: string, vicariatId: string | null): Promise<IAssembleeRapport | null> {
    await connectToDatabase();
    return AssembleeRapport.findOne({
      assembleeId: new mongoose.Types.ObjectId(assembleeId),
      vicariatId: vicariatId ? new mongoose.Types.ObjectId(vicariatId) : null,
    }).lean();
  }

  async listRapportsForAssemblee(
    assembleeId: string,
    opts?: { viewerVicariatId?: string | null }
  ) {
    await connectToDatabase();

    const viewerVicariatId = opts?.viewerVicariatId ?? undefined;

    const match: Record<string, unknown> = {
      assembleeId: new mongoose.Types.ObjectId(assembleeId),
    };

    const globalOrViewerMatch =
      viewerVicariatId === undefined
        ? undefined
        : {
            $or: [
              { vicariatId: viewerVicariatId ? new mongoose.Types.ObjectId(viewerVicariatId) : null },
              { vicariatId: null },
            ],
          };

    const rows = await AssembleeRapport.aggregate([
      {
        $match: globalOrViewerMatch
          ? { ...match, ...globalOrViewerMatch }
          : match,
      },
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
        // Un rapport "global" (vicariatId=null) n'a pas de lookup vicariat, on trie alors sur la mention.
        $addFields: {
          sortKey: { $ifNull: ["$vicariat.abbreviation", "$vicariatMention"] },
        },
      },
      {
        $project: {
          _id: 1,
          assembleeId: 1,
          vicariatId: 1,
          fileUrl: 1,
          originalName: 1,
          mimeType: 1,
          createdAt: 1,
          vicariatMention: 1,
          "vicariat.name": 1,
          "vicariat.abbreviation": 1,
        },
      },
      { $sort: { sortKey: 1 } },
    ]);

    // Convert ObjectIds to string for safe JSON usage
    return rows.map((r) => ({
      ...r,
      _id: r._id?.toString?.() ?? r._id,
      assembleeId: r.assembleeId?.toString?.() ?? r.assembleeId,
      vicariatId: r.vicariatId?.toString?.() ?? r.vicariatId,
    }));
  }
}

