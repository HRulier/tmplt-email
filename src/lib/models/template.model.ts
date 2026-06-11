import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { FieldDef, SerializedVFS } from "@/types";

export interface TemplateDocument extends Document {
  userId: string;
  name: string;
  files: SerializedVFS;
  fields: FieldDef[];
  fieldValues: Record<string, string>;
  messages: unknown[];
  isExample: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FieldDefSchema = new Schema<FieldDef>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "richtext"], required: true },
    label: { type: String, required: true },
    defaultValue: { type: String, required: true },
  },
  { _id: false }
);

const TemplateSchema = new Schema<TemplateDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    files: { type: Schema.Types.Mixed, required: true },
    fields: { type: [FieldDefSchema], default: [] },
    fieldValues: { type: Schema.Types.Mixed, default: {} },
    messages: { type: Schema.Types.Mixed, default: [] },
    isExample: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const TemplateModel: Model<TemplateDocument> =
  mongoose.models.Template ??
  mongoose.model<TemplateDocument>("Template", TemplateSchema);
