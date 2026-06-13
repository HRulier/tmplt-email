import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserSettingsModel } from "@/lib/models/user-settings.model";

const USAGE_LIMIT = 5;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();
  const settings = await UserSettingsModel
    .findOne({ userId: session.user.id })
    .select("+encryptedApiKey")
    .lean();

  const hasOwnKey = !!settings?.encryptedApiKey;
  const count = settings?.serverKeyUsageCount ?? 0;

  return Response.json({ count, limit: USAGE_LIMIT, hasOwnKey });
}
