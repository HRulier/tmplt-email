import { anthropic } from "@ai-sdk/anthropic";

const EDIT_SIGNALS = [
  /\b(remove|delete|erase|strip)\b/i,
  /\b(change|modify|update|edit|replace)\b/i,
  /\b(add|insert|append)\b.{0,30}\b(to|in|into|after|before)\b/i,
  /\b(make it|adjust|tweak|fix|resize)\b/i,
  /\b(color|font|size|spacing|style|button|text|image)\b/i,
];

const GENERATION_SIGNALS = [
  /\b(generate|create|build|write)\b.{0,30}\b(email|template|newsletter)\b/i,
  /\b(from scratch|entirely new|completely new)\b/i,
];

export function selectModel(lastUserMessage: string, hasFiles: boolean) {
  if (!hasFiles) {
    return { model: anthropic("claude-sonnet-4-6"), isEdit: false };
  }
  for (const p of GENERATION_SIGNALS) {
    if (p.test(lastUserMessage)) {
      return { model: anthropic("claude-sonnet-4-6"), isEdit: false };
    }
  }
  for (const p of EDIT_SIGNALS) {
    if (p.test(lastUserMessage)) {
      return { model: anthropic("claude-haiku-4-5"), isEdit: true };
    }
  }
  // Files exist, ambiguous intent → default to Haiku (edits are the common case post-generation)
  return { model: anthropic("claude-haiku-4-5"), isEdit: true };
}
