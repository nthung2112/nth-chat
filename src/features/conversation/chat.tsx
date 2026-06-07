import { useState } from "react";

import type { ChatMessage } from "@/lib/local-ai";

import ChatBottombar from "./chat-bottombar";
import ChatList from "./chat-list";
import ChatTopbar from "./chat-topbar";
import { useConversationController } from "./use-conversation-controller";

export interface ChatProps {
  id: string;
  initialMessages: ChatMessage[] | [];
}

export default function Chat({ initialMessages, id }: ChatProps) {
  const [isFullWidthLayout, setIsFullWidthLayout] = useState(false);

  const {
    localAI,
    messages,
    input,
    isLoading,
    loadingSubmit,
    isReady,
    handleInputChange,
    setInput,
    submit,
    stop,
    reload,
  } = useConversationController({ id, initialMessages });

  return (
    <div className="bg-background flex h-dvh min-w-0 flex-col">
      <ChatTopbar
        localAI={localAI}
        isFullWidthLayout={isFullWidthLayout}
        onToggleLayoutWidth={() => setIsFullWidthLayout(current => !current)}
      />

      {messages.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <img
            src={import.meta.env.VITE_BASE_URL + "chatbot.png"}
            alt="AI"
            width={40}
            height={40}
            className="h-16 w-14 object-contain dark:invert"
          />
          <p className="text-muted-foreground text-center text-base">How can I help you today?</p>
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={submit}
            isLoading={isLoading}
            isReady={isReady}
            stop={stop}
            setInput={setInput}
          />
        </div>
      ) : (
        <>
          <ChatList
            id={id}
            messages={messages}
            isLoading={isLoading}
            loadingSubmit={loadingSubmit}
            reload={reload}
            isFullWidthLayout={isFullWidthLayout}
          />
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={submit}
            isLoading={isLoading}
            isReady={isReady}
            stop={stop}
            setInput={setInput}
          />
        </>
      )}
    </div>
  );
}
