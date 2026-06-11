import { tool } from "@ai-sdk/provider-utils";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";

const inputSchema = z.object({
  command: z.enum(["create", "str_replace", "insert", "view"]),
  path: z.string().describe("Absolute file path, e.g. /Email.tsx"),
  file_text: z.string().optional().describe("Full file content — required for 'create'"),
  old_str: z.string().optional().describe("Exact string to replace — required for 'str_replace', must be unique in the file"),
  new_str: z.string().optional().describe("Replacement / inserted text — required for 'str_replace' and 'insert'"),
  insert_line: z.number().int().optional().describe("Line number to insert after (0 = beginning) — required for 'insert'"),
  view_range: z.tuple([z.number().int(), z.number().int()]).optional().describe("Optional [startLine, endLine] for 'view'"),
});

type Input = z.infer<typeof inputSchema>;

export function buildStrReplaceTool(fs: VirtualFileSystem) {
  return tool<Input, { ok: boolean; message?: string; content?: string }>({
    description:
      "Edit and view files in the virtual file system.\n" +
      "- command='create': create/overwrite a file (requires path, file_text)\n" +
      "- command='str_replace': replace a unique string (requires path, old_str, new_str)\n" +
      "- command='insert': insert lines (requires path, insert_line, new_str)\n" +
      "- command='view': read file content (requires path; optional view_range)",
    inputSchema,
    execute: async (args) => {
      switch (args.command) {
        case "create": {
          fs.createFile(args.path, args.file_text ?? "");
          return { ok: true, message: `File ${args.path} created.` };
        }
        case "str_replace": {
          const ok = fs.replaceInFile(args.path, args.old_str ?? "", args.new_str ?? "");
          if (!ok) return { ok: false, message: `old_str not found in ${args.path}.` };
          return { ok: true, message: `Replaced in ${args.path}.` };
        }
        case "insert": {
          const ok = fs.insertInFile(args.path, args.insert_line ?? 0, args.new_str ?? "");
          if (!ok) return { ok: false, message: `Could not insert in ${args.path}.` };
          return { ok: true, message: `Inserted in ${args.path}.` };
        }
        case "view": {
          const content = fs.readFile(args.path);
          if (content === null) return { ok: false, message: `File ${args.path} not found.` };
          if (!args.view_range) return { ok: true, content };
          const [start, end] = args.view_range;
          const lines = content.split("\n").slice(start - 1, end).join("\n");
          return { ok: true, content: lines };
        }
      }
    },
  });
}
