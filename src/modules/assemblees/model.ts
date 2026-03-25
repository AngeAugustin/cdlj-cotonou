import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAssembleeGenerale extends Document {
  nom: string;
  date: Date;
  lieu: string;
  image?: string;
  terminee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const assembleeGeneraleSchema = new Schema<IAssembleeGenerale>(
  {
    nom: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    lieu: { type: String, required: true, trim: true },
    image: { type: String },
    terminee: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Next.js peut recharger le module sans redémarrer le serveur : on force le schéma à jour.
if (mongoose.models.AssembleeGenerale) {
  delete mongoose.models.AssembleeGenerale;
}

export const AssembleeGenerale: Model<IAssembleeGenerale> =
  mongoose.models.AssembleeGenerale || mongoose.model<IAssembleeGenerale>("AssembleeGenerale", assembleeGeneraleSchema);

export interface IAssembleeRapport extends Document {
  assembleeId: mongoose.Types.ObjectId;
  // `null` signifie "rapport non associé à un vicariat" (mention DIOCESAIN).
  vicariatId?: mongoose.Types.ObjectId | null;
  vicariatMention?: string;
  fileUrl: string;
  originalName?: string;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assembleeRapportSchema = new Schema<IAssembleeRapport>(
  {
    assembleeId: { type: Schema.Types.ObjectId, ref: "AssembleeGenerale", required: true },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: false, default: null },
    vicariatMention: { type: String },
    fileUrl: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
  },
  { timestamps: true }
);

assembleeRapportSchema.index({ assembleeId: 1, vicariatId: 1 }, { unique: true });

// Next.js peut recharger le module sans redémarrer le serveur : on force le schéma à jour.
if (mongoose.models.AssembleeRapport) {
  delete mongoose.models.AssembleeRapport;
}

export const AssembleeRapport: Model<IAssembleeRapport> =
  mongoose.models.AssembleeRapport || mongoose.model<IAssembleeRapport>("AssembleeRapport", assembleeRapportSchema);

