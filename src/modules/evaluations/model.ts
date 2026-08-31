import mongoose, { Document, Model, Schema } from "mongoose";

export type EvaluationDecision = "PROMU" | "MAINTENU";

export interface IEvaluation extends Document {
  nom: string;
  annee: number;
  gradeId: mongoose.Types.ObjectId;
  activiteId: mongoose.Types.ObjectId;
  nombreNotes: number;
  terminee: boolean;
  publiee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new Schema<IEvaluation>(
  {
    nom: { type: String, required: true, trim: true },
    annee: { type: Number, required: true, min: 1900 },
    gradeId: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
    activiteId: { type: Schema.Types.ObjectId, ref: "Activite", required: true },
    nombreNotes: { type: Number, required: true, min: 1, max: 20 },
    terminee: { type: Boolean, default: false },
    publiee: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Evaluation: Model<IEvaluation> =
  mongoose.models.Evaluation || mongoose.model<IEvaluation>("Evaluation", evaluationSchema);

export interface IEvaluationLecteur extends Document {
  evaluationId: mongoose.Types.ObjectId;
  lecteurId: mongoose.Types.ObjectId;
  vicariatId: mongoose.Types.ObjectId;
  paroisseId: mongoose.Types.ObjectId;
  gradeIdAtEvaluation: mongoose.Types.ObjectId;
  moyenne?: number;
  decision?: EvaluationDecision;
  computedAt?: Date;
}

const evaluationLecteurSchema = new Schema<IEvaluationLecteur>(
  {
    evaluationId: { type: Schema.Types.ObjectId, ref: "Evaluation", required: true },
    lecteurId: { type: Schema.Types.ObjectId, ref: "Lecteur", required: true },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    gradeIdAtEvaluation: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
    moyenne: { type: Number },
    decision: { type: String, enum: ["PROMU", "MAINTENU"] },
    computedAt: { type: Date },
  },
  { timestamps: true }
);

evaluationLecteurSchema.index({ evaluationId: 1, lecteurId: 1 }, { unique: true });

export const EvaluationLecteur: Model<IEvaluationLecteur> =
  mongoose.models.EvaluationLecteur ||
  mongoose.model<IEvaluationLecteur>("EvaluationLecteur", evaluationLecteurSchema);

export interface IEvaluationNote extends Document {
  evaluationId: mongoose.Types.ObjectId;
  lecteurId: mongoose.Types.ObjectId;
  noteIndex: number; // 1..nombreNotes
  valeur: number;
  validatedAt: Date;
}

const evaluationNoteSchema = new Schema<IEvaluationNote>(
  {
    evaluationId: { type: Schema.Types.ObjectId, ref: "Evaluation", required: true },
    lecteurId: { type: Schema.Types.ObjectId, ref: "Lecteur", required: true },
    noteIndex: { type: Number, required: true, min: 1 },
    valeur: { type: Number, required: true, min: 0, max: 20 },
    validatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

evaluationNoteSchema.index({ evaluationId: 1, lecteurId: 1, noteIndex: 1 }, { unique: true });

export const EvaluationNote: Model<IEvaluationNote> =
  mongoose.models.EvaluationNote || mongoose.model<IEvaluationNote>("EvaluationNote", evaluationNoteSchema);

/** Montant fixe pour consulter un résultat publié (FCFA). */
export const RESULTAT_CONSULTATION_MONTANT = 100;

export type ResultatConsultationPaiementStatus =
  | "pending"
  | "approved"
  | "refunded"
  | "declined"
  | "canceled"
  | "failed"
  | "non_finalized"
  | "approved_pending_registration";

export interface IResultatConsultationPaiement extends Document {
  evaluationId: mongoose.Types.ObjectId;
  lecteurId: mongoose.Types.ObjectId;
  uniqueId: string;
  annee: number;
  vicariatId: mongoose.Types.ObjectId;
  paroisseId: mongoose.Types.ObjectId;
  montantTotal: number;
  status: ResultatConsultationPaiementStatus;
  requestFingerprint: string;
  paymentUrl: string | null;
  fedapayTransactionId: number | null;
  fedapayReference: string | null;
  fedapayCustomerId: number | null;
  gatewayStatus: string | null;
  statusReason: string | null;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  processedAt: Date | null;
  refundedAt: Date | null;
  timedOutAt: Date | null;
  lastWebhookEvent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const resultatConsultationPaiementSchema = new Schema<IResultatConsultationPaiement>(
  {
    evaluationId: { type: Schema.Types.ObjectId, ref: "Evaluation", required: true },
    lecteurId: { type: Schema.Types.ObjectId, ref: "Lecteur", required: true },
    uniqueId: { type: String, required: true, trim: true },
    annee: { type: Number, required: true, min: 1900 },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat", required: true },
    paroisseId: { type: Schema.Types.ObjectId, ref: "Paroisse", required: true },
    montantTotal: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "refunded",
        "declined",
        "canceled",
        "failed",
        "non_finalized",
        "approved_pending_registration",
      ],
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
    processedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    timedOutAt: { type: Date, default: null },
    lastWebhookEvent: { type: String, default: null },
  },
  { timestamps: true }
);

resultatConsultationPaiementSchema.index({ evaluationId: 1, createdAt: -1 });
resultatConsultationPaiementSchema.index({ lecteurId: 1, annee: 1, status: 1 });
resultatConsultationPaiementSchema.index({ fedapayTransactionId: 1 }, { sparse: true });
resultatConsultationPaiementSchema.index({ requestFingerprint: 1, createdAt: -1 });

export const ResultatConsultationPaiement: Model<IResultatConsultationPaiement> =
  mongoose.models.ResultatConsultationPaiement ||
  mongoose.model<IResultatConsultationPaiement>("ResultatConsultationPaiement", resultatConsultationPaiementSchema);

