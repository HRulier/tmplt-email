import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";
import type { SerializedVFS, FieldDef } from "@/types";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const templates = await TemplateModel.find({ userId: session.user.id })
    .select("_id name createdAt updatedAt isExample")
    .sort({ updatedAt: -1 })
    .lean();

  return Response.json(
    templates.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      isExample: t.isExample ?? false,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, files, fields, fieldValues: incomingFieldValues, messages, isExample } = (await request.json()) as {
    name: string;
    files: SerializedVFS;
    fields: FieldDef[];
    fieldValues?: Record<string, string>;
    messages?: unknown[];
    isExample?: boolean;
  };

  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  await connectDB();

  const defaults = Object.fromEntries(
    (fields ?? []).map((f) => [f.id, f.defaultValue])
  );
  const fieldValues = incomingFieldValues
    ? { ...defaults, ...incomingFieldValues }
    : defaults;

  const template = await TemplateModel.create({
    userId: session.user.id,
    name: name.trim(),
    files,
    fields,
    fieldValues,
    messages: messages ?? [],
    isExample: isExample ?? false,
  });

  return Response.json({ id: template._id.toString() }, { status: 201 });
}
