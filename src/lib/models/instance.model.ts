import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface InstanceDocument extends Document {
  templateId: mongoose.Types.ObjectId;
  userId: string;
  fieldValues: Record<string, string>;
  updatedAt: Date;
}

const InstanceSchema = new Schema<InstanceDocument>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true, index: true },
    userId: { type: String, required: true, index: true },
    fieldValues: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export const InstanceModel: Model<InstanceDocument> =
  mongoose.models.TemplateInstance ??
  mongoose.model<InstanceDocument>("TemplateInstance", InstanceSchema);
