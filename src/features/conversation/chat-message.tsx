import React, { memo, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { CheckIcon, CopyIcon } from "lucide-react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import ButtonWithTooltip from "@/components/button-with-tooltip";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/chat/chat-bubble";
import CodeDisplayBlock from "@/components/code-display-block";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { presentMessage } from "@/features/conversation/message-presentation";
import { writeTextToClipboard } from "@/lib/browser";
import { type ChatMessage } from "@/lib/local-ai";

export type ChatMessageProps = {
  message: ChatMessage;
  isLast: boolean;
  isLoading: boolean | undefined;
  reload: () => Promise<string | null>;
};

const MOTION_CONFIG = {
  initial: { opacity: 0, scale: 1, y: 20, x: 0 },
  animate: { opacity: 1, scale: 1, y: 0, x: 0 },
  exit: { opacity: 0, scale: 1, y: 20, x: 0 },
  transition: {
    opacity: { duration: 0.1 },
    layout: {
      type: "spring" as const,
      bounce: 0.3,
      duration: 0.2,
    },
  },
};

function ChatMessage({ message, isLast, isLoading, reload }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const presented = useMemo(() => presentMessage(message), [message]);
  const { text: messageText, thinkContent, segments } = presented;

  const handleCopy = async () => {
    try {
      await writeTextToClipboard(messageText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to copy message");
    }
  };

  const renderAttachments = () => (
    <div className="flex gap-2">
      {presented.images.map(image => (
        <img
          key={`${message.id}-${image.partIndex}`}
          src={image.url}
          width={200}
          height={200}
          alt="attached image"
          className="rounded-md object-contain"
        />
      ))}
    </div>
  );

  const renderThinkingProcess = () =>
    thinkContent &&
    message.role === "assistant" && (
      <details className="mb-2 text-sm" open>
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
          Thinking process
        </summary>
        <div className="text-muted-foreground mt-2">
          <Markdown>{thinkContent}</Markdown>
        </div>
      </details>
    );

  const renderContent = () =>
    segments.map((segment, index) =>
      segment.kind === "markdown" ? (
        <Markdown key={index}>{segment.value}</Markdown>
      ) : (
        <pre className="whitespace-pre-wrap" key={index}>
          <CodeDisplayBlock code={segment.value} />
        </pre>
      )
    );

  const renderActionButtons = () =>
    message.role === "assistant" && (
      <div className="text-muted-foreground flex items-center gap-1 pt-2">
        {!isLoading && (
          <ButtonWithTooltip side="bottom" toolTipText="Copy">
            <Button
              onClick={() => void handleCopy()}
              variant="ghost"
              size="icon"
              className="h-4 w-4"
            >
              {isCopied ? (
                <CheckIcon className="h-3.5 w-3.5 transition-all" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5 transition-all" />
              )}
            </Button>
          </ButtonWithTooltip>
        )}
        {!isLoading && isLast && (
          <ButtonWithTooltip side="bottom" toolTipText="Regenerate">
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => reload()}>
              <RefreshCcw className="h-3.5 w-3.5 scale-100 transition-all" />
            </Button>
          </ButtonWithTooltip>
        )}
      </div>
    );

  return (
    <motion.div {...MOTION_CONFIG} className="flex flex-col gap-2">
      <ChatBubble variant={message.role === "user" ? "sent" : "received"}>
        <ChatBubbleAvatar
          src={import.meta.env.VITE_BASE_URL + "chatbot.png"}
          width={6}
          height={6}
          className="object-contain dark:invert"
          fallback={message.role === "user" ? "US" : ""}
        />
        <ChatBubbleMessage>
          {renderThinkingProcess()}
          {renderAttachments()}
          {renderContent()}
          {renderActionButtons()}
        </ChatBubbleMessage>
      </ChatBubble>
    </motion.div>
  );
}

export default memo(ChatMessage, (prevProps, nextProps) => {
  if (nextProps.isLast) return false;
  return prevProps.isLast === nextProps.isLast && prevProps.message === nextProps.message;
});
