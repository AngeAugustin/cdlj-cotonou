import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";
import mongoose from "mongoose";

export type EnrollmentSessionUser = {
  roles?: string[];
  parishId?: string | null;
  vicariatId?: string | null;
  email?: string | null;
  id?: string;
};

export type EnrollmentScopeResult =
  | { ok: true; paroisseId: string; role: "VICARIAL" }
  | { ok: false; status: number; error: string };

export function canEnrollLecteurs(roles: string[]): boolean {
  return roles.includes("VICARIAL");
}

/**
 * Détermine la paroisse cible pour une inscription aux activités (rôle VICARIAL uniquement).
 * paroisseId explicite obligatoire, validé contre le vicariat du compte.
 */
export async function resolveEnrollmentParoisseId(
  user: EnrollmentSessionUser,
  requestedParoisseId?: string | null
): Promise<EnrollmentScopeResult> {
  const roles = user.roles ?? [];
  if (!roles.includes("VICARIAL")) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const vicariatId = user.vicariatId;
  if (!vicariatId) {
    return { ok: false, status: 400, error: "Vicariat non défini pour ce compte" };
  }
  if (!requestedParoisseId?.trim()) {
    return { ok: false, status: 400, error: "Sélectionnez une paroisse pour inscrire des lecteurs" };
  }

  const inScope = await assertParoisseInVicariat(requestedParoisseId.trim(), vicariatId);
  if (!inScope) {
    return { ok: false, status: 403, error: "Cette paroisse n'appartient pas à votre vicariat" };
  }
  return { ok: true, paroisseId: requestedParoisseId.trim(), role: "VICARIAL" };
}

export async function assertParoisseInVicariat(paroisseId: string, vicariatId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(paroisseId) || !mongoose.Types.ObjectId.isValid(vicariatId)) {
    return false;
  }
  await connectToDatabase();
  const paroisse = await Paroisse.findById(paroisseId).select("vicariatId").lean();
  return paroisse != null && String(paroisse.vicariatId) === vicariatId;
}

export async function listParoisseIdsForVicariat(vicariatId: string): Promise<string[]> {
  if (!mongoose.Types.ObjectId.isValid(vicariatId)) return [];
  await connectToDatabase();
  const rows = await Paroisse.find({ vicariatId }).select("_id").lean();
  return rows.map((r) => r._id.toString());
}

export async function assertPaymentParoisseAccessible(
  user: EnrollmentSessionUser,
  paymentParoisseId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const roles = user.roles ?? [];

  if (roles.includes("VICARIAL") && user.vicariatId) {
    const inScope = await assertParoisseInVicariat(String(paymentParoisseId), user.vicariatId);
    if (!inScope) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}
