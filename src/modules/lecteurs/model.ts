import mongoose, { Document, Schema } from "mongoose";

export interface ILecteur extends Document {
  nom: string;
  prenoms: string;
  dateNaissance: Date;
  sexe: "M" | "F";
  gradeId?: mongoose.Types.ObjectId;
  anneeAdhesion: number;
  niveau: string;
  details?: string;
  contact: string;
  contactUrgence: string;
  adresse: string;
  maux?: string;
  /** Photo de profil (avatar) */
  photo?: string;
  /** Photo d’identité (TDR, max 3 Mo côté client) */
  photoIdentite?: string;
  vicariatId: mongoose.Types.ObjectId;
  paroisseId: mongoose.Types.ObjectId;
  uniqueId: string;
  createdAt: Date;
  updatedAt: Date;
}

const lecteurSchema = new Schema<ILecteur>(
  {
    nom: { type: String, required: true },
    prenoms: { type: String, required: true },
    dateNaissance: { type: Date, required: true },
    sexe: { type: String, enum: ["M", "F"], required: true },
    gradeId: { type: Schema.Types.ObjectId, ref: "Grade" },
    anneeAdhesion: { type: Number, required: true },
    niveau: { type: String, required: true },
    details: { type: String },
    contact: { type: String, required: true },
    contactUrgence: { type: String, required: true },
    adresse: { type: String, required: true },
    maux: { type: String },
    photo: { type: String },
    photoIdentite: { type: String },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    uniqueId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Lecteur = mongoose.models.Lecteur || mongoose.model<ILecteur>("Lecteur", lecteurSchema);
