import { useState } from "react";

import { generateUUID } from "@/lib/utils";
import { type ChatSession, useConversationStore } from "@/stores";

export function useNewChatSessionId(searchId?: string): string {
  const [generatedId] = useState(generateUUID);
  return searchId ?? generatedId;
}

export function useExistingChatSession(id: string): ChatSession | undefined {
  const getChatById = useConversationStore(state => state.getChatById);
  return getChatById(id);
}
