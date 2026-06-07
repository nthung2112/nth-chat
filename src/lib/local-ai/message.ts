export type ChatMessageRole = "system" | "user" | "assistant";

export interface TextMessagePart {
  type: "text";
  text: string;
}

export interface FileMessagePart {
  type: "file";
  /** IANA media type of the file. */
  mediaType: string;
  /** URL to a hosted file or a data URL. */
  url: string;
  filename?: string;
}

export type MessagePart = TextMessagePart | FileMessagePart;

/**
 * Minimal message shape, structurally compatible with the Vercel AI SDK
 * `UIMessage` (text and file parts). Kept local so the package has no runtime
 * or type dependency on the `ai` package.
 */
export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  parts: MessagePart[];
}

const DEFAULT_MEDIA_TYPE = "application/octet-stream";

export function getMediaTypeFromDataUrl(
  dataUrl: string,
  fallback: string = DEFAULT_MEDIA_TYPE
): string {
  return dataUrl.match(/^data:([^;,]+)/)?.[1] ?? fallback;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [, base64 = ""] = dataUrl.split(",");
  const mediaType = getMediaTypeFromDataUrl(dataUrl);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mediaType });
}

export function getMessageText(message: ChatMessage): string {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => part.text)
    .join("");
}

export function createTextMessage(id: string, role: ChatMessageRole, text: string): ChatMessage {
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

export function createUserMessage(id: string, text: string, imageUrls: string[] = []): ChatMessage {
  const parts: ChatMessage["parts"] = [];

  if (text.length > 0) {
    parts.push({ type: "text", text });
  }

  for (const url of imageUrls) {
    parts.push({ type: "file", url, mediaType: getMediaTypeFromDataUrl(url, "image/png") });
  }

  return { id, role: "user", parts };
}

export function getMessageImages(message: ChatMessage): string[] {
  return message.parts.flatMap(part => (part.type === "file" ? [part.url] : []));
}
