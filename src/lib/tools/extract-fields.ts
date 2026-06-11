import { tool } from "@ai-sdk/provider-utils";
import { z } from "zod";

const FieldDefSchema = z.object({
  id: z.string().describe("Must match the data-field-id attribute used in the JSX"),
  type: z.enum(["text", "image", "richtext"]),
  label: z.string().describe("Human-readable label shown in the editor"),
  defaultValue: z.string().describe("Default value used when no override is provided"),
});

const inputSchema = z.object({
  fields: z.array(FieldDefSchema).min(1),
});

type Input = z.infer<typeof inputSchema>;

export function buildExtractFieldsTool() {
  return tool<Input, { ok: boolean; fields: Input["fields"] }>({
    description:
      "Declare the complete and current list of editable fields. Must be called after every generation or edit that adds, removes, or changes fields — always reflect the exact data-field-id attributes present in the JSX at that moment. If a field was removed from the JSX, do not include it here.",
    inputSchema,
    execute: async ({ fields }) => {
      // The fields are captured client-side via onToolCall — no server-side work needed.
      return { ok: true, fields };
    },
  });
}
