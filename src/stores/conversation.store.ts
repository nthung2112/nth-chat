import type { UIMessage } from "ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatSession {
  messages: UIMessage[];
  createdAt: string;
  role?: string;
}

interface ConversationState {
  chats: Record<string, ChatSession>;
}

interface ConversationActions {
  getChatById: (chatId: string) => ChatSession | undefined;
  createNewChat: (chatId: string, role: string) => void;
  setChatRole: (chatId: string, role: string | undefined) => void;
  saveMessages: (chatId: string, messages: UIMessage[]) => void;
  handleDelete: (chatId: string, messageId?: string) => void;
  clearAll: () => void;
}

type ConversationStore = ConversationState & ConversationActions;

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      chats: {},

      getChatById: chatId => get().chats[chatId],

      createNewChat: (chatId, role) => {
        set(state => {
          const existingChat = state.chats[chatId];
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: existingChat?.messages ?? [],
                createdAt: existingChat?.createdAt ?? new Date().toISOString(),
                role,
              },
            },
          };
        });
      },

      setChatRole: (chatId, role) => {
        set(state => {
          const chat = state.chats[chatId];
          if (!chat) {
            return state;
          }
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                role,
              },
            },
          };
        });
      },

      saveMessages: (chatId, messages) => {
        set(state => {
          const existingChat = state.chats[chatId];
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: [...messages],
                createdAt: existingChat?.createdAt ?? new Date().toISOString(),
                role: existingChat?.role,
              },
            },
          };
        });
      },

      handleDelete: (chatId, messageId) => {
        set(state => {
          const chat = state.chats[chatId];
          if (!chat) {
            return state;
          }

          if (messageId) {
            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  messages: chat.messages.filter(message => message.id !== messageId),
                },
              },
            };
          }

          const { [chatId]: _removed, ...remainingChats } = state.chats;
          return { chats: remainingChats };
        });
      },

      clearAll: () => set({ chats: {} }),
    }),
    {
      name: "nth-conversation",
      partialize: state => ({ chats: state.chats }),
    }
  )
);
