import { tool } from "@ai-sdk/provider-utils";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().max(30).describe("French, 2–4 words, max 30 chars"),
});

type Input = z.infer<typeof inputSchema>;

export function buildSetTemplateNameTool() {
  return tool<Input, { ok: boolean }>({
    description:
      "French template name, 2–4 words, max 30 chars. Call once on initial generation only. e.g. 'Confirmation commande', 'Biens immobiliers'.",
    inputSchema,
    execute: async () => ({ ok: true }),
  });
}
