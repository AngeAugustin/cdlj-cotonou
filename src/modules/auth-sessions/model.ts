import mongoose, { Document, Schema } from "mongoose";

export interface IAuthSession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  deviceLabel: string;
  ip?: string;
  lastSeenAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userAgent: { type: String },
    deviceLabel: { type: String, required: true },
    ip: { type: String },
    lastSeenAt: { type: Date, required: true, default: () => new Date() },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

authSessionSchema.index({ userId: 1, revokedAt: 1, lastSeenAt: -1 });

export const AuthSession =
  mongoose.models.AuthSession ??
  mongoose.model<IAuthSession>("AuthSession", authSessionSchema);
