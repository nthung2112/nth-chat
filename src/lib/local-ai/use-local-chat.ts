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
import { localAITransport } from "./conversation-transport";
import { type ChatMessage } from "./message";

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
