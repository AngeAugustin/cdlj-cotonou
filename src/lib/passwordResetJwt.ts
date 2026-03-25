import jwt from "jsonwebtoken";

const PURPOSE = "password-reset";

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign({ sub: userId, pr: PURPOSE }, getSecret(), {
    expiresIn: "15m",
    algorithm: "HS256",
  });
}

export function verifyPasswordResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] }) as jwt.JwtPayload;
  if (decoded.pr !== PURPOSE || !decoded.sub) {
    throw new Error("Invalid token");
  }
  return { userId: decoded.sub };
}
