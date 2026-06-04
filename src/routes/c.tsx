import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";

import { ChatLayout } from "@/components/layout/chat-layout";
import { useExistingChatSession } from "@/features/conversation/session";

const chatSchema = z.object({
  id: z.string().default(""),
});

export const Route = createFileRoute("/c")({
  component: ChatView,
  validateSearch: chatSchema,
});

function ChatView() {
  const { id } = Route.useSearch();

  const chat = useExistingChatSession(id);

  if (!chat) {
    return notFound();
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center">
      <ChatLayout key={id} id={id} initialMessages={chat.messages} />
    </main>
  );
}
