export interface ConversationCommands {
  resetChat: {
    chatId: string;
  };
}

export type ConversationCommandName = keyof ConversationCommands;
