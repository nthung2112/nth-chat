import {
  useCallback,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  useLocalAI,
  useLocalChat,
  type ChatMessage,
  type UseLocalAIResult,
} from "@/lib/local-ai";
import { useComposerStore, useConversationStore, usePromptStore } from "@/stores";

import { useConversationCommand } from "./conversation-commands";

interface UseConversationControllerOptions {
  id: string;
  initialMessages: ChatMessage[];
}

export interface ConversationController {
  localAI: UseLocalAIResult;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  loadingSubmit: boolean;
  isReady: boolean;
  handleInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  setInput: Dispatch<SetStateAction<string>>;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  reload: () => Promise<string | null>;
}

function getLocalAIUnavailableMessage({ supported, availability }: UseLocalAIResult): string {
  if (!supported) {
    return "Local AI is not supported in this browser";
  }

  if (availability === "downloadable") {
    return "Activate local AI before sending a message";
  }

  if (availability === "downloading") {
    return "Local AI is still downloading";
  }

  return "Local AI is unavailable";
}

export function useConversationController({
  id,
  initialMessages,
}: UseConversationControllerOptions): ConversationController {
  const navigate = useNavigate();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const base64Images = useComposerStore(state => state.base64Images);
  const setBase64Images = useComposerStore(state => state.setBase64Images);
  const saveMessages = useConversationStore(state => state.saveMessages);
  const getPrompt = usePromptStore(state => state.getPrompt);
  const localAI = useLocalAI();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
  } = useLocalChat({
    id,
    initialMessages,
    system: getPrompt(id),
    isReady: localAI.isReady,
    onSubmit: nextMessages => {
      saveMessages(id, nextMessages);
    },
    onResponse: () => {
      setLoadingSubmit(false);
    },
    onFinish: (_message, nextMessages) => {
      saveMessages(id, nextMessages);
      setLoadingSubmit(false);
      void navigate({ to: "/c", search: { id }, replace: true });
    },
    onError: error => {
      setLoadingSubmit(false);
      toast.error(error.message);
    },
  });

  useConversationCommand("resetChat", ({ chatId }) => {
    if (id !== chatId) {
      return;
    }
    setMessages([]);
    setInput("");
    setBase64Images(null);
    saveMessages(id, []);
  });

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!input.trim() && !base64Images?.length) {
        return;
      }

      if (!localAI.isReady) {
        toast.error(getLocalAIUnavailableMessage(localAI));
        return;
      }

      setLoadingSubmit(true);
      handleSubmit(event, base64Images ?? []);
      setBase64Images(null);
    },
    [base64Images, handleSubmit, input, localAI, setBase64Images]
  );

  const handleStop = useCallback(() => {
    stop();
    setLoadingSubmit(false);
  }, [stop]);

  const handleReload = useCallback(async () => {
    setLoadingSubmit(true);
    const response = await reload();
    if (!response) {
      setLoadingSubmit(false);
    }
    return response;
  }, [reload]);

  return {
    localAI,
    messages,
    input,
    isLoading,
    loadingSubmit,
    isReady: localAI.isReady,
    handleInputChange,
    setInput,
    submit,
    stop: handleStop,
    reload: handleReload,
  };
}
