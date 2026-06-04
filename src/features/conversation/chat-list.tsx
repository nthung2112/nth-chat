import { useState } from "react";

import { PromptEditDialog } from "@/components/prompt-edit-dialog";
import type { ChatMessage as ChatMessageData } from "@/lib/local-ai";
import { usePromptStore } from "@/stores";
import { cn } from "@/utils/styles";

import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "../../components/chat/chat-bubble";
import { ChatMessageList } from "../../components/chat/chat-message-list";
import ChatMessage from "./chat-message";

interface ChatListProps {
  id: string;
  messages: ChatMessageData[];
  isLoading: boolean;
  loadingSubmit?: boolean;
  reload: () => Promise<string | null>;
  isFullWidthLayout: boolean;
}

function PromptEditModal({ id }: { id: string }) {
  const prompt = usePromptStore(state => state.getPrompt(id));
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="line-clamp-2 max-h-14 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-[1.55] dark:border-gray-700 dark:bg-gray-800"
        onClick={() => setOpen(true)}
        title={prompt}
      >
        {prompt}
      </div>
      <PromptEditDialog id={id} open={open} onOpenChange={setOpen} />
    </>
  );
}

export default function ChatList({
  id,
  messages,
  isLoading,
  loadingSubmit,
  reload,
  isFullWidthLayout,
}: ChatListProps) {
  return (
    <div
      className={cn(
        "w-full flex-1 overflow-y-auto",
        isFullWidthLayout ? "max-w-none" : "mx-auto max-w-3xl"
      )}
    >
      <ChatMessageList>
        <PromptEditModal id={id} />
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLast={index === messages.length - 1}
            isLoading={isLoading}
            reload={reload}
          />
        ))}
        {loadingSubmit && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar
              src={import.meta.env.VITE_BASE_URL + "chatbot.png"}
              width={6}
              height={6}
              className="object-contain dark:invert"
            />
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
    </div>
  );
}
