import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const template = await TemplateModel.findOne({
    _id: id,
    userId: session.user.id,
  }).lean();

  if (!template) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    id: template._id.toString(),
    name: template.name,
    files: template.files,
    fields: template.fields,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  });
}
