import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";
import { Lecteur } from "@/modules/lecteurs/model";
import mongoose from "mongoose";

export type EnrollmentSessionUser = {
  roles?: string[];
  parishId?: string | null;
  vicariatId?: string | null;
  email?: string | null;
  id?: string;
};

export type EnrollmentLecteursResult =
  | { ok: true; vicariatId: string; lecteurIds: string[] }
  | { ok: false; status: number; error: string };

export function canEnrollLecteurs(roles: string[]): boolean {
  return roles.includes("VICARIAL");
}

/**
 * Valide les lecteurs sélectionnés pour une inscription vicariale.
 * La paroisse de chaque lecteur est déduite côté serveur à l'enregistrement.
 */
export async function resolveEnrollmentLecteurs(
  user: EnrollmentSessionUser,
  lecteurIds: string[]
): Promise<EnrollmentLecteursResult> {
  const roles = user.roles ?? [];
  if (!roles.includes("VICARIAL")) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const vicariatId = user.vicariatId?.trim();
  if (!vicariatId) {
    return { ok: false, status: 400, error: "Vicariat non défini pour ce compte" };
  }

  const uniqueIds = [...new Set(lecteurIds.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) {
    return { ok: false, status: 400, error: "Sélectionnez au moins un lecteur" };
  }

  if (!uniqueIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    return { ok: false, status: 400, error: "Identifiant lecteur invalide" };
  }

  await connectToDatabase();
  const lecteurs = await Lecteur.find({
    _id: { $in: uniqueIds },
    vicariatId,
  })
    .select("_id")
    .lean();

  if (lecteurs.length !== uniqueIds.length) {
    return {
      ok: false,
      status: 403,
      error: "Certains lecteurs ne sont pas rattachés à votre vicariat",
    };
  }

  return { ok: true, vicariatId, lecteurIds: uniqueIds };
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

export async function assertPaymentAccessible(
  user: EnrollmentSessionUser,
  payment: { paroisseId?: unknown; vicariatId?: unknown }
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const roles = user.roles ?? [];

  if (roles.includes("VICARIAL") && user.vicariatId) {
    const paymentVicariatId = payment.vicariatId != null ? String(payment.vicariatId) : null;
    if (paymentVicariatId && paymentVicariatId === user.vicariatId) {
      return { ok: true };
    }

    if (payment.paroisseId != null) {
      const inScope = await assertParoisseInVicariat(String(payment.paroisseId), user.vicariatId);
      if (!inScope) {
        return { ok: false, status: 403, error: "Forbidden" };
      }
      return { ok: true };
    }

    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}
