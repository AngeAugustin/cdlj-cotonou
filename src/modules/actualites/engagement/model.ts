import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IActualiteView extends Document {
  actualiteId: Types.ObjectId;
  visitorId: string;
  ipHash: string;
  country?: string;
  city?: string;
  region?: string;
  createdAt: Date;
}

export interface IActualiteLike extends Document {
  actualiteId: Types.ObjectId;
  visitorId: string;
  ipHash: string;
  country?: string;
  city?: string;
  region?: string;
  createdAt: Date;
}

export interface IActualiteComment extends Document {
  actualiteId: Types.ObjectId;
  authorName: string;
  content: string;
  visitorId: string;
  ipHash: string;
  country?: string;
  city?: string;
  region?: string;
  createdAt: Date;
}

const geoFields = {
  country: { type: String },
  city:    { type: String },
  region:  { type: String },
};

const ActualiteViewSchema = new Schema<IActualiteView>(
  {
    actualiteId: { type: Schema.Types.ObjectId, ref: "Actualite", required: true, index: true },
    visitorId:   { type: String, required: true },
    ipHash:      { type: String, required: true },
    ...geoFields,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ActualiteLikeSchema = new Schema<IActualiteLike>(
  {
    actualiteId: { type: Schema.Types.ObjectId, ref: "Actualite", required: true, index: true },
    visitorId:   { type: String, required: true },
    ipHash:      { type: String, required: true },
    ...geoFields,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActualiteLikeSchema.index({ actualiteId: 1, visitorId: 1 }, { unique: true });
ActualiteLikeSchema.index({ actualiteId: 1, ipHash: 1 });

const ActualiteCommentSchema = new Schema<IActualiteComment>(
  {
    actualiteId: { type: Schema.Types.ObjectId, ref: "Actualite", required: true, index: true },
    authorName:  { type: String, required: true, trim: true, maxlength: 60 },
    content:     { type: String, required: true, trim: true, maxlength: 2000 },
    visitorId:   { type: String, required: true },
    ipHash:      { type: String, required: true },
    ...geoFields,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActualiteCommentSchema.index({ actualiteId: 1, createdAt: -1 });
ActualiteCommentSchema.index({ ipHash: 1, createdAt: -1 });

export const ActualiteView: Model<IActualiteView> =
  mongoose.models.ActualiteView ||
  mongoose.model<IActualiteView>("ActualiteView", ActualiteViewSchema);

export const ActualiteLike: Model<IActualiteLike> =
  mongoose.models.ActualiteLike ||
  mongoose.model<IActualiteLike>("ActualiteLike", ActualiteLikeSchema);

export const ActualiteComment: Model<IActualiteComment> =
  mongoose.models.ActualiteComment ||
  mongoose.model<IActualiteComment>("ActualiteComment", ActualiteCommentSchema);
