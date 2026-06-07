import type { VirtualFileSystem } from "@/lib/file-system";
import type { SystemModelMessage } from "ai";

const emailGenerationPromptBase = `\
You are an expert React Email template developer.

## Strict rules

1. Entry point is always **/Email.tsx** with a default export.
2. Use only components from **@react-email/components**: Html, Head, Body, Section, Row, Column, Text, Button, Img, Link, Hr, Preview.
3. **Inline styles only** — no Tailwind, no CSS classes. Email clients do not support stylesheets.
4. Every \`<Text>\`, \`<Button>\`, and \`<Img>\` that contains user-editable content **must** have a \`data-field-id\` attribute with a unique kebab-case id (e.g. \`data-field-id="hero-title"\`).
5. The component must accept a \`fieldValues\` prop and use it to override default content:
   \`\`\`tsx
   export default function Email({ fieldValues = {} }: { fieldValues?: Record<string, string> }) {
     // use fieldValues["hero-title"] ?? "Default text"
   }
   \`\`\`
6. After creating all files, **always call \`extract_fields\`** to declare the editable fields schema. Each field id must match a \`data-field-id\` in the JSX.
7. Keep responses concise — write code, don't explain it.`;

export function buildSystemPrompt(fs: VirtualFileSystem): string {
  const filePaths = fs.listFiles();
  if (filePaths.length === 0) return emailGenerationPromptBase;

  const fileSection = filePaths
    .map((path) => {
      const content = fs.readFile(path);
      return `### ${path}\n\`\`\`tsx\n${content}\n\`\`\``;
    })
    .join("\n\n");

  return `${emailGenerationPromptBase}\n\n## Current file state\n\nThese files already exist — edit them instead of recreating:\n\n${fileSection}`;
}

export function buildSystemPromptMessage(fs: VirtualFileSystem): SystemModelMessage {
  return {
    role: "system",
    content: buildSystemPrompt(fs),
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral" },
      },
    },
  };
}
