export interface FieldDef {
  id: string;
  type: "text" | "image" | "richtext";
  label: string;
  defaultValue: string;
}

export interface VFSNode {
  type: "file" | "directory";
  name: string;
  path: string;
  content?: string;
}

export type SerializedVFS = Record<string, VFSNode>;

export interface Template {
  id: string;
  userId: string;
  name: string;
  files: SerializedVFS;
  fields: FieldDef[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  userId: string;
  fieldValues: Record<string, string>;
  updatedAt: string;
}
