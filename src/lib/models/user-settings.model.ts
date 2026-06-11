import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface UserSettingsDocument extends Document {
  userId: string;
  encryptedApiKey?: string;
  serverKeyUsageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<UserSettingsDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    encryptedApiKey: { type: String, select: false },
    serverKeyUsageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserSettingsModel: Model<UserSettingsDocument> =
  (mongoose.models.UserSettings as Model<UserSettingsDocument>) ??
  mongoose.model<UserSettingsDocument>("UserSettings", UserSettingsSchema);
