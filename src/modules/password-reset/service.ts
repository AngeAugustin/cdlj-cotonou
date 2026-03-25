import bcryptjs from "bcryptjs";
import connectToDatabase from "@/lib/mongoose";
import { signPasswordResetToken, verifyPasswordResetToken } from "@/lib/passwordResetJwt";
import { sendPasswordResetCodeEmail } from "@/lib/resendMail";
import { User } from "@/modules/users/model";
import { PasswordReset } from "./model";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserIdByEmail(emailNormalized: string) {
  const doc = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(emailNormalized)}$`, "i") },
  })
    .select("_id")
    .lean();
  return doc;
}

function randomSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestPasswordResetCode(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  await connectToDatabase();

  const user = await findUserIdByEmail(email);
  if (!user) {
    return;
  }

  const code = randomSixDigitCode();
  const codeHash = await bcryptjs.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await PasswordReset.findOneAndUpdate(
    { email },
    { $set: { codeHash, expiresAt, attempts: 0 } },
    { upsert: true, new: true }
  );

  await sendPasswordResetCodeEmail(email, code);
}

export async function verifyPasswordResetCode(
  rawEmail: string,
  code: string
): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) {
    throw new Error("Le code doit contenir 6 chiffres");
  }

  await connectToDatabase();
  const doc = await PasswordReset.findOne({ email });
  if (!doc) {
    throw new Error("Code invalide ou expiré");
  }
  if (doc.expiresAt.getTime() < Date.now()) {
    await PasswordReset.deleteOne({ _id: doc._id });
    throw new Error("Code expiré. Demandez un nouveau code.");
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    throw new Error("Trop de tentatives. Demandez un nouveau code.");
  }

  const ok = await bcryptjs.compare(digits, doc.codeHash);
  if (!ok) {
    await PasswordReset.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
    throw new Error("Code incorrect");
  }

  const user = await findUserIdByEmail(email);
  if (!user) {
    await PasswordReset.deleteOne({ _id: doc._id });
    throw new Error("Utilisateur introuvable");
  }

  await PasswordReset.deleteOne({ _id: doc._id });
  return signPasswordResetToken(user._id.toString());
}

export async function resetPasswordWithToken(
  resetToken: string,
  newPassword: string
): Promise<void> {
  const { userId } = verifyPasswordResetToken(resetToken);
  await connectToDatabase();
  const passwordHash = await bcryptjs.hash(newPassword, 10);
  const updated = await User.findByIdAndUpdate(userId, { password: passwordHash });
  if (!updated) {
    throw new Error("Utilisateur introuvable");
  }
}
