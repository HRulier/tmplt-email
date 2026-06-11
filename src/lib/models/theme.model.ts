import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ThemeDocument extends Document {
  userId: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  unsubscribeUrl: string;
  fontFamily: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ThemeDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    primaryColor: { type: String, default: "" },
    secondaryColor: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    unsubscribeUrl: { type: String, default: "" },
    fontFamily: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ThemeModel: Model<ThemeDocument> =
  (mongoose.models.Theme as Model<ThemeDocument>) ??
  mongoose.model<ThemeDocument>("Theme", ThemeSchema);
