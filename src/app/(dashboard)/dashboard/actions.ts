"use server";

import mongoose from "mongoose";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";

export async function deleteTemplate(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  await TemplateModel.deleteOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: session.user.id,
  });

  revalidatePath("/dashboard");
}
