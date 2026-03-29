import mongoose from "mongoose";
import { randomInt } from "crypto";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";
import { Vicariat } from "@/modules/vicariats/model";
import { getAppBaseUrl } from "@/lib/appBaseUrl";
import { sendUserWelcomeEmail } from "@/lib/resendMail";
import { User } from "./model";
import { UserRepository } from "./repository";

const ROLE_ENUM = z.enum(["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"]);

/** Tout utilisateur doit être rattaché à une paroisse ; le vicariat est déduit de la paroisse. */
export const createUserSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  roles: z.array(ROLE_ENUM).min(1, "Au moins un rôle").max(3, "Maximum 3 rôles"),
  paroisseId: z.string().min(1, "La paroisse est obligatoire pour tout utilisateur"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  roles: z.array(ROLE_ENUM).min(1).max(3).optional(),
  /** Obligatoire à chaque mise à jour complète envoyée par le client */
  paroisseId: z.string().min(1, "La paroisse est obligatoire pour tout utilisateur"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

async function ensureParishBelongsAndGetVicariat(paroisseId: string) {
  await connectToDatabase();
  const p = await Paroisse.findById(paroisseId).select("name vicariatId").lean();
  if (!p) throw new Error("Paroisse introuvable");
  const v = await Vicariat.findById(p.vicariatId).select("name abbreviation").lean();
  if (!v) throw new Error("Vicariat introuvable");
  return {
    parishId: new mongoose.Types.ObjectId(paroisseId),
    vicariatId: p.vicariatId as mongoose.Types.ObjectId,
    parishName: p.name,
    vicariatName: v.name,
    vicariatAbbreviation: v.abbreviation,
  };
}

function generateTemporaryPassword(length = 8): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "échec inattendu lors de l'envoi de l'e-mail";
}

async function generateUniqueNumero(): Promise<string> {
  await connectToDatabase();
  for (let i = 0; i < 15; i++) {
    const part = Math.random().toString(36).substring(2, 5).toUpperCase();
    const digits = Math.floor(100000 + Math.random() * 900000);
    const candidate = `USR-${part}-${digits}`;
    const exists = await User.findOne({ numero: candidate }).select("_id").lean();
    if (!exists) return candidate;
  }
  throw new Error("Impossible de générer un numéro unique");
}

export class UserService {
  private repo = new UserRepository();

  getUsers() {
    return this.repo.findAllWithRefs();
  }

  getUser(id: string) {
    return this.repo.findById(id);
  }

  async createUser(data: CreateUserInput) {
    const [existing, pv] = await Promise.all([
      this.repo.findByEmail(data.email),
      ensureParishBelongsAndGetVicariat(data.paroisseId),
    ]);
    if (existing) throw new Error("Cet email est déjà utilisé");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcryptjs.hash(temporaryPassword, 10);

    const created = await this.repo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      roles: data.roles,
      parishId: pv.parishId,
      vicariatId: pv.vicariatId,
    });

    try {
      await sendUserWelcomeEmail(data.email, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone?.trim() || undefined,
        numero: created?.numero ?? undefined,
        roles: data.roles,
        parishName: pv.parishName,
        vicariatName: pv.vicariatName,
        vicariatAbbreviation: pv.vicariatAbbreviation,
        temporaryPassword,
        loginUrl: `${getAppBaseUrl()}/auth/login`,
      });
    } catch (error) {
      const createdId = created?._id ? String(created._id) : "";
      if (createdId) {
        try {
          await this.repo.delete(createdId);
        } catch (rollbackError) {
          throw new Error(
            `Compte non créé : ${errorMessage(error)}. L'annulation automatique du compte a échoué (${errorMessage(rollbackError)}).`
          );
        }
      }
      throw new Error(`Compte non créé : ${errorMessage(error)}.`);
    }

    return created;
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const current = await this.repo.findByIdWithPassword(id);
    if (!current) throw new Error("Utilisateur introuvable");

    const emailNorm = data.email?.toLowerCase().trim();
    const emailChanged =
      data.email !== undefined && emailNorm !== (current.email as string)?.toLowerCase().trim();
    const [pv, other] = await Promise.all([
      ensureParishBelongsAndGetVicariat(data.paroisseId),
      emailChanged ? this.repo.findByEmail(data.email!) : Promise.resolve(null),
    ]);
    if (other && other._id.toString() !== id) throw new Error("Cet email est déjà utilisé");

    let passwordHash: string | undefined;
    if (data.password && data.password.length > 0) {
      passwordHash = await bcryptjs.hash(data.password, 10);
    }

    const patch: Parameters<UserRepository["update"]>[1] = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.email !== undefined) {
      patch.email = data.email;
    }
    if (data.phone !== undefined) patch.phone = data.phone;
    if (passwordHash) patch.passwordHash = passwordHash;
    if (data.roles !== undefined) patch.roles = data.roles;

    patch.parishId = pv.parishId;
    patch.vicariatId = pv.vicariatId;

    if (!current.numero) {
      patch.numero = await generateUniqueNumero();
    }

    return this.repo.update(id, patch);
  }

  async deleteUser(id: string) {
    return this.repo.delete(id);
  }

  async countSuperAdmins() {
    return this.repo.countByRole("SUPERADMIN");
  }

  /** Changement de mot de passe par l’utilisateur lui-même (vérifie l’ancien mot de passe). */
  async changeOwnPassword(userId: string, data: ChangePasswordInput) {
    const current = await this.repo.findByIdWithPassword(userId);
    if (!current) throw new Error("Utilisateur introuvable");
    if (!current.password) {
      throw new Error("Ce compte ne permet pas le changement de mot de passe par ce moyen");
    }
    const valid = await bcryptjs.compare(data.currentPassword, current.password);
    if (!valid) throw new Error("Mot de passe actuel incorrect");

    const passwordHash = await bcryptjs.hash(data.newPassword, 10);
    const updated = await this.repo.update(userId, { passwordHash });
    if (!updated) throw new Error("Utilisateur introuvable");
    return updated;
  }
}
