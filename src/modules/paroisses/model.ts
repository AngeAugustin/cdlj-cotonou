import mongoose, { Document, Schema } from "mongoose";

export interface IParoisse extends Document {
  name: string;
  vicariatId: mongoose.Types.ObjectId;
  logo?: string;
}

const paroisseSchema = new Schema<IParoisse>(
  {
    name: { type: String, required: true },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    logo: { type: String },
  },
  { timestamps: true }
);

export const Paroisse = mongoose.models.Paroisse || mongoose.model<IParoisse>("Paroisse", paroisseSchema);
