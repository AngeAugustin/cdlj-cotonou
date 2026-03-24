import mongoose, { Document, Schema } from "mongoose";

export interface IVicariat extends Document {
  name: string;
  abbreviation: string;
  aumonier?: string;
  logo?: string;
}

const vicariatSchema = new Schema<IVicariat>(
  {
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    aumonier: { type: String },
    logo: { type: String },
  },
  { timestamps: true }
);

export const Vicariat = mongoose.models.Vicariat || mongoose.model<IVicariat>("Vicariat", vicariatSchema);
