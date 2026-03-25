import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { User, IUser } from "./model";
import { Paroisse } from "@/modules/paroisses/model";
import { Vicariat } from "@/modules/vicariats/model";

function isVicariatExpanded(v: unknown): v is { name: string } {
  return (
    v != null &&
    typeof v === "object" &&
    "name" in v &&
    typeof (v as { name?: string }).name === "string" &&
    Boolean((v as { name: string }).name)
  );
}

function rawVicariatIdString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string" && mongoose.Types.ObjectId.isValid(v)) return v;
  if (typeof v === "object" && v != null && "_id" in v) {
    const id = (v as { _id: unknown })._id;
    if (id && mongoose.Types.ObjectId.isValid(String(id))) return String(id);
  }
  return null;
}

/** Complète vicariatId si l’agrégat n’a pas joint (types BSON / nom de collection). */
async function expandVicariatsOnUserRows<T extends { vicariatId?: unknown }>(rows: T[]): Promise<T[]> {
  if (!rows.length) return rows;
  await connectToDatabase();
  const ids = new Set<string>();
  for (const r of rows) {
    if (!isVicariatExpanded(r.vicariatId)) {
      const id = rawVicariatIdString(r.vicariatId);
      if (id) ids.add(id);
    }
  }
  if (ids.size === 0) return rows;
  const oids = [...ids].map((i) => new mongoose.Types.ObjectId(i));
  const list = await Vicariat.find({ _id: { $in: oids } })
    .select("name abbreviation")
    .lean();
  const map = new Map(list.map((doc) => [doc._id.toString(), doc]));
  for (const r of rows) {
    if (isVicariatExpanded(r.vicariatId)) continue;
    const id = rawVicariatIdString(r.vicariatId);
    if (!id) continue;
    const doc = map.get(id);
    if (doc) {
      (r as { vicariatId: unknown }).vicariatId = {
        _id: doc._id,
        name: doc.name,
        abbreviation: doc.abbreviation,
      };
    }
  }
  return rows;
}

/** $lookup avec $expr : joint plus fiable que localField/foreignField (ex. compte vicarial, parishId null). */
function userEnrichmentStages(): mongoose.PipelineStage[] {
  const collParoisses = Paroisse.collection.name;
  const collVicariats = Vicariat.collection.name;

  return [
    {
      $lookup: {
        from: collParoisses,
        let: { pid: "$parishId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $ne: ["$$pid", null] }, { $eq: ["$_id", "$$pid"] }],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "_p",
      },
    },
    { $unwind: { path: "$_p", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: collVicariats,
        let: { pvid: "$_p.vicariatId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $ne: ["$$pvid", null] }, { $eq: ["$_id", "$$pvid"] }],
              },
            },
          },
          { $limit: 1 },
          { $project: { name: 1, abbreviation: 1 } },
        ],
        as: "_pv",
      },
    },
    { $unwind: { path: "$_pv", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: collVicariats,
        let: { uid: "$vicariatId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $ne: ["$$uid", null] }, { $eq: ["$_id", "$$uid"] }],
              },
            },
          },
          { $limit: 1 },
          { $project: { name: 1, abbreviation: 1 } },
        ],
        as: "_uv",
      },
    },
    { $unwind: { path: "$_uv", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        numero: 1,
        roles: 1,
        createdAt: 1,
        updatedAt: 1,
        parishId: {
          $cond: [
            { $ne: [{ $ifNull: ["$_p._id", null] }, null] },
            {
              _id: "$_p._id",
              name: "$_p.name",
              vicariatId: {
                $cond: [
                  { $ne: [{ $ifNull: ["$_pv._id", null] }, null] },
                  {
                    _id: "$_pv._id",
                    name: "$_pv.name",
                    abbreviation: "$_pv.abbreviation",
                  },
                  "$$REMOVE",
                ],
              },
            },
            "$parishId",
          ],
        },
        vicariatId: {
          $cond: [
            { $ne: [{ $ifNull: ["$_uv._id", null] }, null] },
            {
              _id: "$_uv._id",
              name: "$_uv.name",
              abbreviation: "$_uv.abbreviation",
            },
            {
              $cond: [
                { $ne: [{ $ifNull: ["$_pv._id", null] }, null] },
                {
                  _id: "$_pv._id",
                  name: "$_pv.name",
                  abbreviation: "$_pv.abbreviation",
                },
                "$vicariatId",
              ],
            },
          ],
        },
      },
    },
  ];
}

export type UserPublicLean = Omit<IUser, "password"> & {
  _id: mongoose.Types.ObjectId;
  parishId?:
    | mongoose.Types.ObjectId
    | { _id: string; name: string; vicariatId?: { _id: string; name: string; abbreviation?: string } };
  vicariatId?: mongoose.Types.ObjectId | { _id: string; name: string; abbreviation?: string };
};

async function generateUniqueNumero(): Promise<string> {
  for (let i = 0; i < 15; i++) {
    const part = Math.random().toString(36).substring(2, 5).toUpperCase();
    const digits = Math.floor(100000 + Math.random() * 900000);
    const candidate = `USR-${part}-${digits}`;
    const exists = await User.findOne({ numero: candidate }).select("_id").lean();
    if (!exists) return candidate;
  }
  throw new Error("Impossible de générer un numéro unique");
}

async function enrichUserById(id: mongoose.Types.ObjectId) {
  const pipeline: mongoose.PipelineStage[] = [{ $match: { _id: id } }, ...userEnrichmentStages()];
  const rows = await User.aggregate(pipeline);
  const expanded = await expandVicariatsOnUserRows(rows);
  return expanded[0] ?? null;
}

/** Après POST/PUT : pas d’agrégation lourde — le client recharge la liste enrichie. */
async function findByIdLeanNoPassword(id: mongoose.Types.ObjectId) {
  await connectToDatabase();
  return User.findById(id).select("-password").lean();
}

export class UserRepository {
  async findAllWithRefs() {
    await connectToDatabase();
    const pipeline: mongoose.PipelineStage[] = [{ $sort: { createdAt: -1 } }, ...userEnrichmentStages()];
    const rows = await User.aggregate(pipeline);
    return expandVicariatsOnUserRows(rows);
  }

  async findById(id: string) {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return enrichUserById(new mongoose.Types.ObjectId(id));
  }

  async findByIdWithPassword(id: string) {
    await connectToDatabase();
    return User.findById(id).lean();
  }

  async findByEmail(email: string) {
    await connectToDatabase();
    return User.findOne({ email: email.toLowerCase().trim() }).lean();
  }

  async countByRole(role: string) {
    await connectToDatabase();
    return User.countDocuments({ roles: role });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
    roles: string[];
    parishId?: mongoose.Types.ObjectId;
    vicariatId?: mongoose.Types.ObjectId;
    numero?: string;
  }) {
    await connectToDatabase();
    const numero = data.numero ?? (await generateUniqueNumero());
    const doc = await User.create({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || undefined,
      password: data.passwordHash,
      roles: data.roles,
      parishId: data.parishId,
      vicariatId: data.vicariatId,
      numero,
    });
    return findByIdLeanNoPassword(doc._id as mongoose.Types.ObjectId);
  }

  async update(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      passwordHash?: string;
      roles?: string[];
      parishId?: mongoose.Types.ObjectId | null;
      vicariatId?: mongoose.Types.ObjectId | null;
      numero?: string;
    }
  ) {
    await connectToDatabase();
    const clean: Record<string, unknown> = {};
    if (patch.firstName !== undefined) clean.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) clean.lastName = patch.lastName.trim();
    if (patch.email !== undefined) clean.email = patch.email.toLowerCase().trim();
    if (patch.phone !== undefined) clean.phone = patch.phone?.trim() || undefined;
    if (patch.passwordHash !== undefined) clean.password = patch.passwordHash;
    if (patch.roles !== undefined) clean.roles = patch.roles;
    if (patch.parishId !== undefined) clean.parishId = patch.parishId;
    if (patch.vicariatId !== undefined) clean.vicariatId = patch.vicariatId;
    if (patch.numero !== undefined) clean.numero = patch.numero;

    const updated = await User.findByIdAndUpdate(id, { $set: clean }, { new: true });
    if (!updated) return null;
    return findByIdLeanNoPassword(updated._id as mongoose.Types.ObjectId);
  }

  async delete(id: string) {
    await connectToDatabase();
    return User.findByIdAndDelete(id).lean();
  }
}
