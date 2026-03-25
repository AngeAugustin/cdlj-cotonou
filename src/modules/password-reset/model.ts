import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PasswordReset =
  mongoose.models.PasswordReset ??
  mongoose.model<IPasswordReset>("PasswordReset", passwordResetSchema);
