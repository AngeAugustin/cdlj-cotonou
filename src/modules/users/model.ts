import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  roles: string[];
  parishId?: mongoose.Types.ObjectId;
  vicariatId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String },
    roles: { 
      type: [String], 
      enum: ["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"], 
      default: ["PAROISSIAL"] 
    },
    parishId: { type: Schema.Types.ObjectId, ref: "Paroisse" },
    vicariatId: { type: Schema.Types.ObjectId, ref: "Vicariat" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
