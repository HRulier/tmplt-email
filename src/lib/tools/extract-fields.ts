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
      "Call this after creating all email files to declare the list of editable fields. Each field must correspond to a data-field-id attribute present in the JSX.",
    inputSchema,
    execute: async ({ fields }) => {
      // The fields are captured client-side via onToolCall — no server-side work needed.
      return { ok: true, fields };
    },
  });
}
