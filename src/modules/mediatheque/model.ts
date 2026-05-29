import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMediatheque extends Document {
  nom: string;
  categorie: string;
  mois: number;
  annee: number;
  coverImage?: string;
  hostingLink: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediathequeSchema = new Schema<IMediatheque>(
  {
    nom: { type: String, required: true },
    categorie: { type: String, required: true },
    mois: { type: Number, required: true, min: 1, max: 12 },
    annee: { type: Number, required: true, min: 2000, max: 2100 },
    coverImage: { type: String },
    hostingLink: { type: String, required: true },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MediathequeSchema.index({ annee: -1, mois: -1, createdAt: -1 });

export const Mediatheque: Model<IMediatheque> =
  mongoose.models.Mediatheque ||
  mongoose.model<IMediatheque>("Mediatheque", MediathequeSchema);
