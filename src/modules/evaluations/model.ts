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

