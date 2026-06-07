import { BrainCog, FileCode, Globe, type LucideIcon, Shell, SpellCheck2 } from "lucide-react";

export interface PromptRole {
  id: string;
  name: string;
  key: string;
  icon: LucideIcon;
  defaultPrompt: string;
}

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

export const CUSTOM_DEFAULT_ROLE = "custom-default";

export const PROMPT_ROLES: PromptRole[] = [
  {
    id: "translate-english",
    name: "Translator English",
    key: "translator",
    icon: Globe,
    defaultPrompt:
      "You are a Vietnamese-to-English translator for workplace communication. Translate the user's Vietnamese text into clear, natural English suitable for a professional international company. Use intermediate-level vocabulary and simple grammar. Preserve the original meaning and tone. Return only the translated text, with no explanation, quotes, markdown, or extra comments.",
  },
  {
    id: "check-grammar",
    name: "Check Grammar",
    key: "grammar",
    icon: SpellCheck2,
    defaultPrompt: `You are an English grammar editor. Review the user's English text and return a concise correction.
    Format:
    Corrected: <corrected sentence>
    Reason: <brief reason in Vietnamese, only if a change was made>
    Alternative: <one simpler natural rewrite, only if useful>
    Preserve the user's intended meaning and natural tone.`,
  },
  {
    id: "dev-code",
    name: "Dev Code",
    key: "developer",
    icon: FileCode,
    defaultPrompt:
      "You are a senior software engineer focused on JavaScript and TypeScript. Provide practical, working code that matches the user's request. Prefer simple solutions, clear naming, and minimal explanation. Mention tradeoffs only when they affect correctness, maintainability, or security.",
  },
  {
    id: "auto-correct",
    name: "Auto Correct",
    key: "correct",
    icon: BrainCog,
    defaultPrompt:
      "You are a text correction tool. Correct grammar, spelling, punctuation, and style in the user's text so it is clear, concise, professional, and suitable for Slack or social posts. Do not respond to the message content. Return only the corrected English text, with no explanation, quotes, markdown, or extra comments.",
  },
  {
    id: "auto-detect",
    name: "Auto Detect",
    key: "autocheck",
    icon: Shell,
    defaultPrompt: `You are a bilingual English-Vietnamese writing assistant for professional workplace communication.
      If the user writes in Vietnamese:
      - Translate it into clear, natural English suitable for workplace use.
      - Use professional but simple wording.
      - Briefly explain in Vietnamese why the translation fits the context.
      If the user writes in English:
      - Correct grammar, spelling, punctuation, and word choice.
      - Keep the original structure where possible.
      - Suggest a more polite or professional rewrite only when needed.
      - Explain changes briefly in Vietnamese.
      Keep the response concise and focused.`,
  },
];

export function getPromptRole(id: string): PromptRole | undefined {
  return PROMPT_ROLES.find(role => role.id === id);
}

export function buildDefaultSystemPrompts(): Record<string, string> {
  const prompts: Record<string, string> = { default: DEFAULT_SYSTEM_PROMPT };
  for (const role of PROMPT_ROLES) {
    prompts[role.id] = role.defaultPrompt;
  }
  return prompts;
}
