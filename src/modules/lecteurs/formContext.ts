import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { Vicariat } from "@/modules/vicariats/model";
import { Paroisse } from "@/modules/paroisses/model";

export type LecteurFormContext = {
  vicariats: { _id: string; name: string }[];
  paroisses: { _id: string; name: string; vicariatId: string }[];
  lockParishVicariat?: {
    vicariatId: string;
    vicariatName?: string;
    /** Absent pour un VICARIAL en création : seul le vicariat est verrouillé. */
    paroisseId?: string;
    paroisseName?: string;
  };
};

function isValidObjectId(id: string | undefined | null): id is string {
  if (!id || typeof id !== "string") return false;
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  return String(new mongoose.Types.ObjectId(id)) === id;
}

export async function getLecteurFormContext(user: {
  roles?: string[];
  parishId?: string | null;
  vicariatId?: string | null;
}): Promise<LecteurFormContext> {
  await connectToDatabase();

  const roles: string[] = user.roles ?? [];
  const isParoissial = roles.includes("PAROISSIAL");
  const isVicarial = roles.includes("VICARIAL");

  let vicariats: { _id: string; name: string }[] = [];
  let paroisses: { _id: string; name: string; vicariatId: string }[] = [];
  let lockParishVicariat: LecteurFormContext["lockParishVicariat"];

  if (isParoissial && isValidObjectId(user.vicariatId) && isValidObjectId(user.parishId)) {
    const [vList, pList] = await Promise.all([
      Vicariat.find({ _id: user.vicariatId }).sort({ name: 1 }).lean(),
      Paroisse.find({ _id: user.parishId }).sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: String(v._id), name: v.name }));
    paroisses = pList.map((p) => ({
      _id: String(p._id),
      name: p.name,
      vicariatId: String(p.vicariatId),
    }));
    lockParishVicariat = {
      paroisseId: user.parishId,
      vicariatId: user.vicariatId,
      paroisseName: paroisses[0]?.name,
      vicariatName: vicariats[0]?.name,
    };
  } else if (isVicarial && isValidObjectId(user.vicariatId)) {
    const [vList, pList] = await Promise.all([
      Vicariat.find({ _id: user.vicariatId }).sort({ name: 1 }).lean(),
      Paroisse.find({ vicariatId: user.vicariatId }).sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: String(v._id), name: v.name }));
    paroisses = pList.map((p) => ({
      _id: String(p._id),
      name: p.name,
      vicariatId: String(p.vicariatId),
    }));
    lockParishVicariat = {
      vicariatId: user.vicariatId,
      vicariatName: vicariats[0]?.name,
    };
  } else {
    const [vList, pList] = await Promise.all([
      Vicariat.find().sort({ name: 1 }).lean(),
      Paroisse.find().sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: String(v._id), name: v.name }));
    paroisses = pList.map((p) => ({
      _id: String(p._id),
      name: p.name,
      vicariatId: String(p.vicariatId),
    }));
  }

  return { vicariats, paroisses, lockParishVicariat };
}
