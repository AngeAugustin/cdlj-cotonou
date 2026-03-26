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
  /** Lot FedaPay ayant validé l’inscription (si applicable) */
  paiementId?: mongoose.Types.ObjectId;
}

const participationSchema = new Schema<IActiviteParticipation>(
  {
    activiteId: { type: Schema.Types.ObjectId, ref: "Activite", required: true },
    lecteurId: { type: Schema.Types.ObjectId, ref: "Lecteur", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    paidAt: { type: Date, default: Date.now },
    paiementId: { type: Schema.Types.ObjectId, ref: "ActivitePaiement" },
  },
  { timestamps: false }
);

participationSchema.index({ activiteId: 1, lecteurId: 1 }, { unique: true });

export const ActiviteParticipation: Model<IActiviteParticipation> =
  mongoose.models.ActiviteParticipation ||
  mongoose.model<IActiviteParticipation>("ActiviteParticipation", participationSchema);

export type ActivitePaiementStatus =
  | "pending"
  | "approved"
  | "declined"
  | "canceled"
  | "failed"
  | "non_finalized"
  | "approved_pending_registration";

export interface IActivitePaiement extends Document {
  activiteId: mongoose.Types.ObjectId;
  paroisseId: mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  lecteurIds: mongoose.Types.ObjectId[];
  montantUnitaire: number;
  nombreLecteurs: number;
  montantTotal: number;
  status: ActivitePaiementStatus;
  requestFingerprint: string;
  paymentUrl: string | null;
  fedapayTransactionId: number | null;
  fedapayReference: string | null;
  fedapayCustomerId: number | null;
  gatewayStatus: string | null;
  statusReason: string | null;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  emailSentAt: Date | null;
  processedAt: Date | null;
  timedOutAt: Date | null;
  lastWebhookEvent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const activitePaiementSchema = new Schema<IActivitePaiement>(
  {
    activiteId: { type: Schema.Types.ObjectId, ref: "Activite", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    lecteurIds: [{ type: Schema.Types.ObjectId, ref: "Lecteur" }],
    montantUnitaire: { type: Number, required: true, min: 0 },
    nombreLecteurs: { type: Number, required: true, min: 1 },
    montantTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "canceled", "failed", "non_finalized", "approved_pending_registration"],
      default: "pending",
    },
    requestFingerprint: { type: String, required: true },
    paymentUrl: { type: String, default: null },
    fedapayTransactionId: { type: Number, default: null },
    fedapayReference: { type: String, default: null },
    fedapayCustomerId: { type: Number, default: null },
    gatewayStatus: { type: String, default: null },
    statusReason: { type: String, default: null },
    callbackUrl: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    emailSentAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    timedOutAt: { type: Date, default: null },
    lastWebhookEvent: { type: String, default: null },
  },
  { timestamps: true }
);

activitePaiementSchema.index({ activiteId: 1, createdAt: -1 });
activitePaiementSchema.index({ fedapayTransactionId: 1 }, { sparse: true });
activitePaiementSchema.index({ requestFingerprint: 1, createdAt: -1 });

if (mongoose.models.ActivitePaiement) {
  delete mongoose.models.ActivitePaiement;
}

export const ActivitePaiement: Model<IActivitePaiement> = mongoose.model<IActivitePaiement>(
  "ActivitePaiement",
  activitePaiementSchema
);
