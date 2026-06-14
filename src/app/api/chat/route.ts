import { headers } from "next/headers";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VirtualFileSystem } from "@/lib/file-system";
import { UserSettingsModel } from "@/lib/models/user-settings.model";
import { ThemeModel } from "@/lib/models/theme.model";
import { decryptApiKey } from "@/lib/crypto";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildExtractFieldsTool } from "@/lib/tools/extract-fields";
import { buildSetTemplateNameTool } from "@/lib/tools/set-template-name";
import {
  buildSystemPromptMessage,
  type Theme,
} from "@/lib/prompts/email-generation";
import { selectModel } from "@/lib/model-router";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/limits";
import type { SerializedVFS } from "@/types";
import type { UIMessage } from "ai";

type VfsMeta = { vfsSnapshot?: SerializedVFS; templateName?: string };
type AppUIMessage = UIMessage<VfsMeta>;

// Keep original intent (first message) + recent context, capped at `limit` messages
function withFirstAndRecent<T>(msgs: T[], limit = 10): T[] {
  if (msgs.length <= limit) return msgs;
  const [first, ...rest] = msgs;
  const recent = rest.slice(-(limit - 1));
  return [first, ...recent];
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { messages, files = {} } = body as {
    messages: Parameters<typeof convertToModelMessages>[0];
    files: SerializedVFS;
  };

  const fs = new VirtualFileSystem();
  fs.deserializeFromNodes(files);

  const hasFiles = Object.values(files).some((n) => n.type === "file");

  const lastMsg = messages[messages.length - 1];
  const lastUserText =
    lastMsg?.role === "user"
      ? ((
          lastMsg as { parts?: Array<{ type: string; text?: string }> }
        ).parts?.find((p) => p.type === "text")?.text ?? "")
      : "";

  if (lastUserText.length > MAX_USER_MESSAGE_CHARS) {
    return Response.json(
      { error: "message_too_long", limit: MAX_USER_MESSAGE_CHARS },
      { status: 400 },
    );
  }

  // Resolve per-user API key and theme in parallel
  await connectDB();
  const [userSettings, themeDoc] = await Promise.all([
    UserSettingsModel.findOne({ userId: session.user.id })
      .select("+encryptedApiKey")
      .lean(),
    ThemeModel.findOne({ userId: session.user.id }).lean(),
  ]);

  const theme: Theme = {
    primaryColor: themeDoc?.primaryColor || undefined,
    secondaryColor: themeDoc?.secondaryColor || undefined,
    logoUrl: themeDoc?.logoUrl || undefined,
    unsubscribeUrl: themeDoc?.unsubscribeUrl || undefined,
    fontFamily: themeDoc?.fontFamily || undefined,
  };

  let provider: ReturnType<typeof createAnthropic> | undefined;
  if (userSettings?.encryptedApiKey) {
    try {
      provider = createAnthropic({
        apiKey: decryptApiKey(userSettings.encryptedApiKey),
      });
    } catch {
      // Decryption failed (e.g. secret rotation) — fall back to server env key
    }
  }

  const USAGE_LIMIT = 5;
  if (!provider) {
    const count = userSettings?.serverKeyUsageCount ?? 0;
    if (count >= USAGE_LIMIT) {
      return Response.json({ error: "quota_exceeded" }, { status: 429 });
    }
    await UserSettingsModel.findOneAndUpdate(
      { userId: session.user.id },
      { $inc: { serverKeyUsageCount: 1 } },
      { upsert: true, returnDocument: "after" },
    );
  }

  const { model, isEdit } = selectModel(lastUserText, hasFiles, provider);

  const result = streamText({
    model,
    system: buildSystemPromptMessage(fs, theme),
    messages: await convertToModelMessages(withFirstAndRecent(messages)),
    maxOutputTokens: isEdit ? 4_000 : 8_000,
    stopWhen: stepCountIs(isEdit ? 10 : 20),
    tools: {
      str_replace_editor: buildStrReplaceTool(fs),
      file_manager: buildFileManagerTool(fs),
      extract_fields: buildExtractFieldsTool(),
      set_template_name: buildSetTemplateNameTool(),
    },
  });

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      writer.merge(result.toUIMessageStream());
      await result.consumeStream();
      const steps = await result.steps;
      const nameCall = steps
        .flatMap((s) => s.toolCalls)
        .find((c) => c.toolName === "set_template_name");
      const templateName = nameCall
        ? (nameCall.input as { name: string }).name
        : undefined;
      writer.write({
        type: "finish",
        messageMetadata: { vfsSnapshot: fs.serialize(), templateName },
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
