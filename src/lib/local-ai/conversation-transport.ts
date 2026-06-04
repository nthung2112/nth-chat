import { streamPrompt } from "./session";

export interface ConversationStreamRequest {
  system: string;
  user: string;
  images: Blob[];
  signal: AbortSignal;
  onChunk: (text: string) => void;
}

export interface ConversationTransport {
  stream: (request: ConversationStreamRequest) => Promise<string>;
}

export const localAITransport: ConversationTransport = {
  stream: ({ system, user, images, signal, onChunk }) =>
    streamPrompt({ system, user, images, signal, onChunk }),
};
