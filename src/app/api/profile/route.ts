import { headers } from "next/headers";
import { z } from "zod";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserSettingsModel } from "@/lib/models/user-settings.model";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";

const apiKeySchema = z.object({
  apiKey: z
    .string()
    .min(20, "Clé trop courte")
    .startsWith("sk-ant-", "Format invalide — la clé doit commencer par sk-ant-"),
});

function buildMaskedKey(encryptedApiKey: string): string {
  try {
    const plain = decryptApiKey(encryptedApiKey);
    const last4 = plain.slice(-4);
    return `sk-ant-...••••••••••••••••••••${last4}`;
  } catch {
    return "sk-ant-...••••••••••••••••••••????";
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const settings = await UserSettingsModel
    .findOne({ userId: session.user.id })
    .select("+encryptedApiKey")
    .lean();

  const hasApiKey = !!(settings?.encryptedApiKey);
  const maskedKey = hasApiKey ? buildMaskedKey(settings!.encryptedApiKey!) : null;

  return Response.json({ hasApiKey, maskedKey });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = apiKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Clé invalide" },
      { status: 400 }
    );
  }

  const { apiKey } = parsed.data;

  // Validate the key with a minimal API call (1 token, 5s timeout)
  try {
    const testProvider = createAnthropic({ apiKey });
    await generateText({
      model: testProvider("claude-haiku-4-5-20251001"),
      prompt: "ok",
      maxOutputTokens: 1,
      abortSignal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("authentication") ||
      msg.includes("api key") ||
      msg.includes("invalid x-api-key") ||
      msg.includes("permission")
    ) {
      return Response.json({ error: "Clé API invalide ou non autorisée" }, { status: 400 });
    }
    return Response.json(
      { error: "Impossible de valider la clé — vérifiez votre connexion et réessayez" },
      { status: 400 }
    );
  }

  const encrypted = encryptApiKey(apiKey);

  await connectDB();
  await UserSettingsModel.findOneAndUpdate(
    { userId: session.user.id },
    { encryptedApiKey: encrypted },
    { upsert: true, new: true }
  );

  return Response.json({ ok: true });
}
