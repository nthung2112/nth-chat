import { getMessageText, type ChatMessage } from "@/lib/local-ai";

export interface MarkdownSegment {
  kind: "markdown";
  value: string;
}

export interface CodeSegment {
  kind: "code";
  value: string;
}

export type MessageSegment = MarkdownSegment | CodeSegment;

export interface PresentedImage {
  url: string;
  partIndex: number;
}

export interface PresentedMessage {
  text: string;
  thinkContent: string | null;
  segments: MessageSegment[];
  images: PresentedImage[];
}

const THINK_BLOCK = /<think>([\s\S]*?)(?:<\/think>|$)/;
const THINK_BLOCK_GLOBAL = /<think>[\s\S]*?(?:<\/think>|$)/g;

function extractThinkContent(content: string): string | null {
  const match = content.match(THINK_BLOCK);
  return match ? match[1].trim() : null;
}

function toSegments(cleanContent: string): MessageSegment[] {
  return cleanContent
    .split("```")
    .map((value, index) =>
      index % 2 === 0 ? { kind: "markdown", value } : { kind: "code", value }
    );
}

export function presentMessage(message: ChatMessage): PresentedMessage {
  const text = getMessageText(message);
  const isAssistant = message.role === "assistant";
  const cleanContent = text.replace(THINK_BLOCK_GLOBAL, "").trim();

  return {
    text,
    thinkContent: isAssistant ? extractThinkContent(text) : null,
    segments: toSegments(cleanContent),
    images: message.parts.flatMap((part, partIndex) =>
      part.type === "file" && part.mediaType.startsWith("image/")
        ? [{ url: part.url, partIndex }]
        : []
    ),
  };
}
