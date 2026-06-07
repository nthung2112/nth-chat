import { createLanguageModelSession, isLanguageModelSupported } from "./language-model";

export interface CreateSessionOptions {
  system: string;
  onDownloadProgress?: (loaded: number) => void;
  signal?: AbortSignal;
}

interface PromptOptions {
  system: string;
  user: string;
  signal?: AbortSignal;
}

interface StreamPromptOptions extends PromptOptions {
  images?: Blob[];
  onChunk: (text: string) => void;
}

type PromptStreamingSession = LanguageModel & {
  promptStreaming?: (
    prompt: LanguageModelPrompt,
    options?: { signal?: AbortSignal }
  ) => ReadableStream<string> | AsyncIterable<string>;
};

const MULTIMODAL_EXPECTED_INPUTS: LanguageModelExpected[] = [{ type: "text" }, { type: "image" }];

function buildPromptInput(user: string, images: Blob[]): LanguageModelPrompt {
  if (images.length === 0) {
    return user;
  }

  const content: LanguageModelMessageContent[] = [{ type: "text", value: user }];
  for (const image of images) {
    content.push({ type: "image", value: image });
  }

  return [{ role: "user", content }];
}

const sessionCache = new Map<string, Promise<LanguageModel>>();

function buildSystemKey(system: string): string {
  return system.trim().slice(0, 200);
}

export async function getOrCreateSession({
  system,
  onDownloadProgress,
  signal,
}: CreateSessionOptions): Promise<LanguageModel> {
  if (!isLanguageModelSupported()) {
    throw new Error("LanguageModel is not supported in this browser");
  }

  const key = buildSystemKey(system);
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const sessionPromise = createLanguageModelSession({
    system,
    onDownloadProgress,
    signal,
  }).catch(error => {
    sessionCache.delete(key);
    throw error;
  });

  sessionCache.set(key, sessionPromise);
  return sessionPromise;
}

export async function destroyAllSessions(): Promise<void> {
  const sessions = Array.from(sessionCache.values());
  sessionCache.clear();
  await Promise.allSettled(
    sessions.map(async sessionPromise => {
      const session = await sessionPromise;
      session.destroy();
    })
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readPromptStream(
  stream: ReadableStream<string> | AsyncIterable<string>,
  onChunk: (text: string) => void
): Promise<string> {
  let text = "";

  if (stream instanceof ReadableStream) {
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return text;
      }
      text += value;
      onChunk(text);
    }
  }

  for await (const chunk of stream) {
    text += chunk;
    onChunk(text);
  }

  return text;
}

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

export async function stream({
  system,
  user,
  images,
  signal,
  onChunk,
}: StreamPromptOptions): Promise<string> {
  const hasImages = (images?.length ?? 0) > 0;
  const session = hasImages
    ? await createLanguageModelSession({
        system,
        expectedInputs: MULTIMODAL_EXPECTED_INPUTS,
        signal,
      })
    : await (await getOrCreateSession({ system })).clone({ signal });

  const promptInput = buildPromptInput(user, images ?? []);
  let text = "";

  try {
    const streamingSession = session as PromptStreamingSession;

    if (typeof streamingSession.promptStreaming !== "function") {
      text = await session.prompt(promptInput, { signal });
      onChunk(text);
      return text;
    }

    text = await readPromptStream(
      streamingSession.promptStreaming(promptInput, { signal }),
      onChunk
    );
    return text;
  } catch (error) {
    if (isAbortError(error)) {
      return text;
    }
    throw error;
  } finally {
    session.destroy();
  }
}

/**
 * Run a one-shot prompt by cloning the cached system session so context doesn't accumulate
 * across calls. Each call gets a fresh conversation copy of the base session.
 */
export async function runPrompt({
  system,
  user,
  responseConstraint,
  signal,
}: {
  system: string;
  user: string;
  responseConstraint: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<string> {
  const base = await getOrCreateSession({ system });
  const session = await base.clone({ signal });
  try {
    return await session.prompt(user, { responseConstraint, signal });
  } finally {
    session.destroy();
  }
}

export const localAITransport: ConversationTransport = {
  stream,
};
