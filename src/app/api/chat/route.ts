import { headers } from "next/headers";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildExtractFieldsTool } from "@/lib/tools/extract-fields";
import { emailGenerationPrompt } from "@/lib/prompts/email-generation";
import type { SerializedVFS } from "@/types";
import type { UIMessage } from "ai";

type VfsMeta = { vfsSnapshot?: SerializedVFS };
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

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: emailGenerationPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 12_000,
    stopWhen: stepCountIs(40),
    tools: {
      str_replace_editor: buildStrReplaceTool(fs),
      file_manager: buildFileManagerTool(fs),
      extract_fields: buildExtractFieldsTool(),
    },
  });

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      // Merge all Claude streaming chunks
      writer.merge(result.toUIMessageStream());

      // After the stream drains, append the final VFS snapshot as message metadata
      await result.consumeStream();
      writer.write({
        type: "finish",
        messageMetadata: { vfsSnapshot: fs.serialize() },
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
