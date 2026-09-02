import bcryptjs from "bcryptjs";
import connectToDatabase from "@/lib/mongoose";
import { User } from "@/modules/users/model";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type LoginVerificationResult =
  | { status: "ok"; userId: string }
  | { status: "invalid" }
  | { status: "disabled" };

/** Vérifie e-mail + mot de passe et indique si le compte est bloqué. */
export async function verifyUserLoginCredentials(
  rawEmail: string,
  password: string
): Promise<LoginVerificationResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) return { status: "invalid" };

  await connectToDatabase();
  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") },
  }).lean();

  if (!user?.password) return { status: "invalid" };

  const valid = await bcryptjs.compare(password, user.password);
  if (!valid) return { status: "invalid" };

  if (user.actif === false) return { status: "disabled" };

  return { status: "ok", userId: user._id.toString() };
}

export async function findUserByEmailForLogin(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return null;

  await connectToDatabase();
  return User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") },
  }).lean();
}
