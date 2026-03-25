import mongoose, { Document, Schema, Model } from "mongoose";

export interface IActivite extends Document {
  nom: string;
  dateDebut: Date;
  dateFin: Date;
  lieu: string;
  montant: number;
  delaiPaiement: Date;
  /** Référence / numéro à utiliser pour les paiements (ex. compte marchand, code USSD) */
  numeroPaiement?: string;
  image?: string;
  terminee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activiteSchema = new Schema<IActivite>(
  {
    nom: { type: String, required: true },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    lieu: { type: String, required: true },
    montant: { type: Number, required: true, min: 0 },
    delaiPaiement: { type: Date, required: true },
    numeroPaiement: { type: String, default: "" },
    image: { type: String },
    terminee: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Next.js recharge les modules sans redémarrer Node : sans cela, un ancien schéma
// reste en cache et Mongoose ignore/stripe les nouveaux champs (ex. numeroPaiement).
if (mongoose.models.Activite) {
  delete mongoose.models.Activite;
}

export const Activite: Model<IActivite> = mongoose.model<IActivite>("Activite", activiteSchema);

export interface IActiviteParticipation extends Document {
  activiteId: mongoose.Types.ObjectId;
  lecteurId: mongoose.Types.ObjectId;
  paroisseId: mongoose.Types.ObjectId;
  vicariatId: mongoose.Types.ObjectId;
  paidAt: Date;
}

const participationSchema = new Schema<IActiviteParticipation>(
  {
    activiteId: { type: Schema.Types.ObjectId, ref: "Activite", required: true },
    lecteurId: { type: Schema.Types.ObjectId, ref: "Lecteur", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

participationSchema.index({ activiteId: 1, lecteurId: 1 }, { unique: true });

export const ActiviteParticipation: Model<IActiviteParticipation> =
  mongoose.models.ActiviteParticipation ||
  mongoose.model<IActiviteParticipation>("ActiviteParticipation", participationSchema);
