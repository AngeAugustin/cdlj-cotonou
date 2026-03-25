import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActualite extends Document {
  title: string;
  slug: string;
  excerpt: string;
  body: string;        // HTML rich text
  image?: string;
  category: string;
  author: string;
  authorRole?: string;
  readTime?: string;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActualiteSchema = new Schema<IActualite>(
  {
    title:      { type: String, required: true },
    slug:       { type: String, required: true, unique: true },
    excerpt:    { type: String, required: true },
    body:       { type: String, default: "" },
    image:      { type: String },
    category:   { type: String, required: true },
    author:     { type: String, required: true },
    authorRole: { type: String },
    readTime:   { type: String },
    featured:   { type: Boolean, default: false },
    published:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Actualite: Model<IActualite> =
  mongoose.models.Actualite ||
  mongoose.model<IActualite>("Actualite", ActualiteSchema);
