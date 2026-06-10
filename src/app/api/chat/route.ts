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
import { decryptApiKey } from "@/lib/crypto";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildExtractFieldsTool } from "@/lib/tools/extract-fields";
import { buildSetTemplateNameTool } from "@/lib/tools/set-template-name";
import { buildSystemPromptMessage } from "@/lib/prompts/email-generation";
import { selectModel } from "@/lib/model-router";
import type { SerializedVFS } from "@/types";
import type { UIMessage } from "ai";

type VfsMeta = { vfsSnapshot?: SerializedVFS; templateName?: string };
type AppUIMessage = UIMessage<VfsMeta>;

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
      ? ((lastMsg as { parts?: Array<{ type: string; text?: string }> }).parts?.find(
          (p) => p.type === "text"
        )?.text ?? "")
      : "";

  // Resolve per-user API key (decrypt in request scope only, never serialized)
  await connectDB();
  const userSettings = await UserSettingsModel
    .findOne({ userId: session.user.id })
    .select("+encryptedApiKey")
    .lean();

  let provider: ReturnType<typeof createAnthropic> | undefined;
  if (userSettings?.encryptedApiKey) {
    try {
      provider = createAnthropic({ apiKey: decryptApiKey(userSettings.encryptedApiKey) });
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
      { upsert: true, returnDocument: "after" }
    );
  }

  const { model, isEdit } = selectModel(lastUserText, hasFiles, provider);

  const result = streamText({
    model,
    system: buildSystemPromptMessage(fs),
    messages: await convertToModelMessages(messages.slice(-6)),
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
