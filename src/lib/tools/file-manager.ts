import { tool } from "@ai-sdk/provider-utils";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";

const inputSchema = z.object({
  command: z.enum(["rename", "delete"]),
  path: z.string().optional().describe("Absolute path to delete — required for 'delete'"),
  old_path: z.string().optional().describe("Current absolute path — required for 'rename'"),
  new_path: z.string().optional().describe("New absolute path — required for 'rename'"),
});

type Input = z.infer<typeof inputSchema>;

export function buildFileManagerTool(fs: VirtualFileSystem) {
  return tool<Input, { ok: boolean; message: string }>({
    description:
      "Rename or delete files and directories in the virtual file system.\n" +
      "- command='rename': rename/move a file (requires old_path, new_path)\n" +
      "- command='delete': delete a file (requires path)",
    inputSchema,
    execute: async (args) => {
      switch (args.command) {
        case "rename": {
          fs.rename(args.old_path ?? "", args.new_path ?? "");
          return { ok: true, message: `Renamed ${args.old_path} → ${args.new_path}.` };
        }
        case "delete": {
          fs.deleteFile(args.path ?? "");
          return { ok: true, message: `Deleted ${args.path}.` };
        }
      }
    },
  });
}
