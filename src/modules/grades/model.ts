import mongoose, { Document, Schema } from "mongoose";

export interface IGrade extends Document {
  name: string;
  level: number;
  abbreviation: string;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true, unique: true },
    abbreviation: { type: String, required: true },
  },
  { timestamps: true }
);

export const Grade = mongoose.models.Grade || mongoose.model<IGrade>("Grade", gradeSchema);
