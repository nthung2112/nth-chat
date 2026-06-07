import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import {
  createConversationEngine,
  type ConversationEngine,
  type ConversationEngineCallbacks,
} from "./conversation-engine";
import {
  getAvailability,
  isLanguageModelSupported,
  type LocalAIAvailability,
} from "./language-model";
import { type ChatMessage } from "./message";
import { destroyAllSessions, getOrCreateSession, localAITransport } from "./session";

export interface UseLocalAIResult {
  /** User's preference (true = wants to use local AI) */
  preference: boolean;
  /** Browser/model availability state */
  availability: LocalAIAvailability;
  /** Whether the LanguageModel global exists in this browser */
  supported: boolean;
  /** Last reported download progress in [0, 1] when state is 'downloading' */
  downloadProgress: number;
  /** True iff preference is enabled and model is fully ready to use */
  isReady: boolean;
  setPreference: (value: boolean) => void;
  /** Trigger an explicit model download/activation (must be called from a user gesture) */
  triggerDownload: () => Promise<LocalAIAvailability>;
  /** Re-check availability */
  refresh: () => Promise<LocalAIAvailability>;
}

export function useLocalAI(): UseLocalAIResult {
  const supported = isLanguageModelSupported();
  const [preference, setPreferenceState] = useState<boolean>(true);
  const [availability, setAvailability] = useState<LocalAIAvailability>(
    supported ? "downloadable" : "unavailable"
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const refresh = useCallback(async (): Promise<LocalAIAvailability> => {
    const next = await getAvailability();
    setAvailability(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (availability !== "downloading") return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [availability, refresh]);

  useEffect(() => {
    if (preference) return;
    destroyAllSessions().catch(error => {
      console.warn("Failed to destroy local AI sessions:", error);
    });
  }, [preference]);

  const updatePreference = useCallback((value: boolean) => {
    setPreferenceState(value);
  }, []);

  const triggerDownload = useCallback(async (): Promise<LocalAIAvailability> => {
    if (!supported) {
      return "unavailable";
    }

    try {
      await getOrCreateSession({
        system: "warmup",
        onDownloadProgress: loaded => setDownloadProgress(loaded),
      });
      return await refresh();
    } catch (error) {
      await refresh();
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to activate local AI", { cause: error });
    }
  }, [supported, refresh]);

  return {
    preference,
    availability,
    supported,
    downloadProgress,
    isReady: preference && availability === "available",
    setPreference: updatePreference,
    triggerDownload,
    refresh,
  };
}

interface UseLocalChatOptions {
  id: string;
  initialMessages: ChatMessage[];
  system: string;
  isReady: boolean;
  onSubmit?: (messages: ChatMessage[]) => void;
  onResponse?: () => void;
  onFinish?: (message: ChatMessage, messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
}

interface UseLocalChatResult {
  messages: ChatMessage[];
  input: string;
  handleInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>, images?: string[]) => void;
  isLoading: boolean;
  stop: () => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setInput: Dispatch<SetStateAction<string>>;
  reload: () => Promise<string | null>;
}

export function useLocalChat({
  id,
  initialMessages,
  system,
  isReady,
  onSubmit,
  onResponse,
  onFinish,
  onError,
}: UseLocalChatOptions): UseLocalChatResult {
  const [input, setInput] = useState("");

  const systemRef = useRef(system);
  systemRef.current = system;
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;
  const callbacksRef = useRef<ConversationEngineCallbacks>({
    onSubmit,
    onResponse,
    onFinish,
    onError,
  });
  callbacksRef.current = { onSubmit, onResponse, onFinish, onError };
  const isActiveRef = useRef(true);

  const engineRef = useRef<ConversationEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createConversationEngine({
      initialMessages,
      transport: localAITransport,
      getSystem: () => systemRef.current,
      getIsReady: () => isReadyRef.current,
      getCallbacks: () => callbacksRef.current,
      getIsActive: () => isActiveRef.current,
    });
  }
  const engine = engineRef.current;

  const state = useSyncExternalStore(engine.subscribe, engine.getState);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      engine.stop();
    };
  }, [engine]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      engine.reset(initialMessages);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [engine, id, initialMessages]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>, images: string[] = []) => {
      event.preventDefault();
      const started = engine.submit(input, images);
      if (started) {
        setInput("");
      }
    },
    [engine, input]
  );

  const reload = useCallback(() => engine.regenerate(), [engine]);

  return {
    messages: state.messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: state.isLoading,
    stop: engine.stop,
    setMessages: engine.setMessages,
    setInput,
    reload,
  };
}
