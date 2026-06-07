import {
  createTextMessage,
  createUserMessage,
  dataUrlToBlob,
  getMessageImages,
  getMessageText,
  withMessageText,
  type ChatMessage,
} from "./message";
import type { ConversationTransport } from "./session";

export interface ConversationEngineCallbacks {
  onSubmit?: (messages: ChatMessage[]) => void;
  onResponse?: () => void;
  onFinish?: (message: ChatMessage, messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
}

export interface ConversationEngineConfig {
  initialMessages: ChatMessage[];
  transport: ConversationTransport;
  getSystem: () => string;
  getIsReady: () => boolean;
  getCallbacks: () => ConversationEngineCallbacks;
  /** Returns false once the consumer is detached, so stale runs stop emitting state and callbacks */
  getIsActive: () => boolean;
}

export interface ConversationEngineState {
  messages: ChatMessage[];
  isLoading: boolean;
}

export type MessagesUpdater = ChatMessage[] | ((previous: ChatMessage[]) => ChatMessage[]);

export interface ConversationEngine {
  getState: () => ConversationEngineState;
  subscribe: (listener: () => void) => () => void;
  setMessages: (value: MessagesUpdater) => void;
  reset: (messages: ChatMessage[]) => void;
  submit: (content: string, images?: string[]) => boolean;
  regenerate: () => Promise<string | null>;
  stop: () => void;
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRoleLabel(role: ChatMessage["role"]): string {
  if (role === "user") {
    return "User";
  }

  if (role === "assistant") {
    return "Assistant";
  }

  if (role === "system") {
    return "System";
  }

  return "Message";
}

function buildPrompt(messages: ChatMessage[]): string {
  const conversation = messages
    .map(message => ({ role: message.role, text: getMessageText(message) }))
    .filter(message => message.text.trim().length > 0)
    .map(message => `${getRoleLabel(message.role)}: ${message.text}`)
    .join("\n\n");

  return `${conversation}\n\nAssistant:`;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Local AI request failed");
}

function upsertAssistantMessage(
  messages: ChatMessage[],
  assistantId: string,
  content: string
): ChatMessage[] {
  const assistantExists = messages.some(message => message.id === assistantId);

  if (!assistantExists) {
    return [...messages, createTextMessage(assistantId, "assistant", content)];
  }

  return messages.map(message =>
    message.id === assistantId ? withMessageText(message, content) : message
  );
}

export function createConversationEngine(config: ConversationEngineConfig): ConversationEngine {
  const { transport, getSystem, getIsReady, getCallbacks, getIsActive } = config;

  let state: ConversationEngineState = {
    messages: config.initialMessages,
    isLoading: false,
  };
  const listeners = new Set<() => void>();
  let abortController: AbortController | null = null;

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const getState = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const setState = (partial: Partial<ConversationEngineState>) => {
    state = { ...state, ...partial };
    emit();
  };

  const setMessages = (value: MessagesUpdater) => {
    const next =
      typeof value === "function"
        ? (value as (previous: ChatMessage[]) => ChatMessage[])(state.messages)
        : value;
    setState({ messages: next });
  };

  const reset = (messages: ChatMessage[]) => {
    state = { messages, isLoading: false };
    emit();
  };

  const stop = () => {
    abortController?.abort();
    setState({ isLoading: false });
  };

  const runAssistant = async (
    promptMessages: ChatMessage[],
    assistantId: string
  ): Promise<string | null> => {
    if (!getIsReady()) {
      getCallbacks().onError?.(new Error("Local AI is not ready"));
      return null;
    }

    const controller = new AbortController();
    let hasResponse = false;
    abortController = controller;
    setState({ isLoading: true });

    const notifyResponse = () => {
      if (hasResponse || !getIsActive()) {
        return;
      }
      hasResponse = true;
      getCallbacks().onResponse?.();
    };

    const lastUserMessage = [...promptMessages].reverse().find(message => message.role === "user");
    const images = lastUserMessage ? getMessageImages(lastUserMessage).map(dataUrlToBlob) : [];

    try {
      const finalText = await transport.stream({
        system: getSystem(),
        user: buildPrompt(promptMessages),
        images,
        signal: controller.signal,
        onChunk: content => {
          if (!getIsActive()) {
            return;
          }
          notifyResponse();
          setMessages(current => upsertAssistantMessage(current, assistantId, content));
        },
      });

      notifyResponse();

      if (!getIsActive()) {
        return finalText;
      }

      if (controller.signal.aborted && finalText.length === 0) {
        return finalText;
      }

      const finalMessages = upsertAssistantMessage(state.messages, assistantId, finalText);
      const assistantMessage = finalMessages.find(message => message.id === assistantId);

      setMessages(finalMessages);

      if (assistantMessage) {
        getCallbacks().onFinish?.(assistantMessage, finalMessages);
      }

      return finalText;
    } catch (error) {
      if (!getIsActive()) {
        return null;
      }
      setMessages(current => current.filter(message => message.id !== assistantId));
      getCallbacks().onError?.(toError(error));
      return null;
    } finally {
      if (abortController === controller) {
        abortController = null;
      }
      setState({ isLoading: false });
      notifyResponse();
    }
  };

  const submit = (content: string, images: string[] = []): boolean => {
    const trimmed = content.trim();
    if ((!trimmed && images.length === 0) || state.isLoading) {
      return false;
    }

    if (!getIsReady()) {
      getCallbacks().onError?.(new Error("Local AI is not ready"));
      return false;
    }

    const userMessage = createUserMessage(createMessageId(), trimmed, images);
    const assistantId = createMessageId();
    const promptMessages = [...state.messages, userMessage];

    setMessages(promptMessages);
    getCallbacks().onSubmit?.(promptMessages);
    void runAssistant(promptMessages, assistantId);
    return true;
  };

  const regenerate = async (): Promise<string | null> => {
    if (state.isLoading) {
      return null;
    }

    if (!getIsReady()) {
      getCallbacks().onError?.(new Error("Local AI is not ready"));
      return null;
    }

    const currentMessages = state.messages;
    const withoutLatestAssistant =
      currentMessages.at(-1)?.role === "assistant" ? currentMessages.slice(0, -1) : currentMessages;
    const lastUserIndex = withoutLatestAssistant.findLastIndex(message => message.role === "user");

    if (lastUserIndex < 0) {
      return null;
    }

    const promptMessages = withoutLatestAssistant.slice(0, lastUserIndex + 1);
    const assistantId = createMessageId();

    setMessages(promptMessages);
    return runAssistant(promptMessages, assistantId);
  };

  return {
    getState,
    subscribe,
    setMessages,
    reset,
    submit,
    regenerate,
    stop,
  };
}
