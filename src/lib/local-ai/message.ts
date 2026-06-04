import type { UIMessage } from "ai";

export type ChatMessage = UIMessage;

export type ChatMessageRole = UIMessage["role"];

export function getMessageText(message: ChatMessage): string {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => part.text)
    .join("");
}

export function createTextMessage(
  id: string,
  role: ChatMessageRole,
  text: string
): ChatMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  };
}

export function withMessageText(message: ChatMessage, text: string): ChatMessage {
  return {
    ...message,
    parts: [{ type: "text", text }],
  };
}

function getMediaTypeFromDataUrl(url: string): string {
  const match = url.match(/^data:([^;,]+)/);
  return match?.[1] ?? "image/png";
}

export function createUserMessage(
  id: string,
  text: string,
  imageUrls: string[] = []
): ChatMessage {
  const parts: ChatMessage["parts"] = [];

  if (text.length > 0) {
    parts.push({ type: "text", text });
  }

  for (const url of imageUrls) {
    parts.push({ type: "file", url, mediaType: getMediaTypeFromDataUrl(url) });
  }

  return { id, role: "user", parts };
}

export function getMessageImages(message: ChatMessage): string[] {
  return message.parts.flatMap(part => (part.type === "file" ? [part.url] : []));
}
