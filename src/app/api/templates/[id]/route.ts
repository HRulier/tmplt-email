import { headers } from "next/headers";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";
import type { SerializedVFS, FieldDef } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const template = await TemplateModel.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!template) return Response.json({ error: "Not found" }, { status: 404 });

  const doc = template.toObject();

  return Response.json({
    id: doc._id.toString(),
    name: doc.name,
    files: doc.files,
    fields: doc.fields,
    fieldValues: (doc.fieldValues as Record<string, string>) ?? {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    fieldValues?: Record<string, string>;
    files?: SerializedVFS;
    fields?: FieldDef[];
  };

  await connectDB();

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.fieldValues !== undefined) patch.fieldValues = body.fieldValues;
  if (body.files !== undefined) patch.files = body.files;
  if (body.fields !== undefined) patch.fields = body.fields;

  const result = await TemplateModel.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(id), userId: session.user.id },
    { $set: patch },
  );

  if (result.matchedCount === 0) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const result = await TemplateModel.deleteOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: session.user.id,
  });

  if (result.deletedCount === 0) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ok: true });
}
