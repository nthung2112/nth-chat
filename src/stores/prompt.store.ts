import { create } from "zustand";
import { persist } from "zustand/middleware";

import { buildDefaultSystemPrompts, DEFAULT_SYSTEM_PROMPT } from "@/lib/prompt-roles";

export interface CustomDefaultChat {
  name: string;
  createdAt: string;
}

interface PromptState {
  systemPrompt: Record<string, string>;
  hiddenDefaultRoleIds: string[];
  customDefaultChats: Record<string, CustomDefaultChat>;
  defaultRoleNames: Record<string, string>;
}

interface PromptActions {
  getPrompt: (id: string) => string;
  updateSystemPrompt: (id: string, prompt: string) => void;
  hideDefaultRole: (roleId: string) => void;
  addCustomDefaultChat: (chatId: string, chat: CustomDefaultChat) => void;
  removeCustomDefaultChat: (chatId: string) => void;
  renameDefaultRole: (roleId: string, name: string) => void;
  renameCustomDefaultChat: (chatId: string, name: string) => void;
}

type PromptStore = PromptState & PromptActions;

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      systemPrompt: buildDefaultSystemPrompts(),
      hiddenDefaultRoleIds: [],
      customDefaultChats: {},
      defaultRoleNames: {},

      getPrompt: id => {
        const prompts = get().systemPrompt;
        return prompts[id] ?? prompts.default ?? DEFAULT_SYSTEM_PROMPT;
      },

      updateSystemPrompt: (id, prompt) => {
        set(state => ({
          systemPrompt: {
            ...state.systemPrompt,
            [id]: prompt,
          },
        }));
      },

      hideDefaultRole: roleId => {
        set(state => {
          if (state.hiddenDefaultRoleIds.includes(roleId)) {
            return state;
          }
          return {
            hiddenDefaultRoleIds: [...state.hiddenDefaultRoleIds, roleId],
          };
        });
      },

      addCustomDefaultChat: (chatId, chat) => {
        set(state => ({
          customDefaultChats: {
            ...state.customDefaultChats,
            [chatId]: chat,
          },
        }));
      },

      removeCustomDefaultChat: chatId => {
        set(state => {
          if (!(chatId in state.customDefaultChats)) {
            return state;
          }
          const { [chatId]: _removed, ...remaining } = state.customDefaultChats;
          return { customDefaultChats: remaining };
        });
      },

      renameDefaultRole: (roleId, name) => {
        set(state => ({
          defaultRoleNames: {
            ...state.defaultRoleNames,
            [roleId]: name,
          },
        }));
      },

      renameCustomDefaultChat: (chatId, name) => {
        set(state => {
          const chat = state.customDefaultChats[chatId];
          if (!chat) {
            return state;
          }
          return {
            customDefaultChats: {
              ...state.customDefaultChats,
              [chatId]: { ...chat, name },
            },
          };
        });
      },
    }),
    {
      name: "nth-prompts",
      partialize: state => ({
        systemPrompt: state.systemPrompt,
        hiddenDefaultRoleIds: state.hiddenDefaultRoleIds,
        customDefaultChats: state.customDefaultChats,
        defaultRoleNames: state.defaultRoleNames,
      }),
      merge: (persisted, current) => {
        const persistedState = (persisted as Partial<PromptState> | undefined) ?? {};
        return {
          ...current,
          systemPrompt: {
            ...current.systemPrompt,
            ...(persistedState.systemPrompt ?? {}),
          },
          hiddenDefaultRoleIds: persistedState.hiddenDefaultRoleIds ?? current.hiddenDefaultRoleIds,
          customDefaultChats: {
            ...current.customDefaultChats,
            ...(persistedState.customDefaultChats ?? {}),
          },
          defaultRoleNames: {
            ...current.defaultRoleNames,
            ...(persistedState.defaultRoleNames ?? {}),
          },
        };
      },
    }
  )
);
