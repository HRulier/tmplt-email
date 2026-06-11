import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserSettingsModel } from "@/lib/models/user-settings.model";

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  await UserSettingsModel.updateOne(
    { userId: session.user.id },
    { $unset: { encryptedApiKey: 1 } }
  );

  return Response.json({ ok: true });
}
