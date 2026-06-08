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
  tags: string[];
  featured: boolean;
  published: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
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
    tags:       { type: [String], default: [] },
    featured:   { type: Boolean, default: false },
    published:  { type: Boolean, default: false },
    viewCount:    { type: Number, default: 0 },
    likeCount:    { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Actualite: Model<IActualite> =
  mongoose.models.Actualite ||
  mongoose.model<IActualite>("Actualite", ActualiteSchema);
