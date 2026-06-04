import { useCallback, useMemo } from "react";

import { getMessageText } from "@/lib/local-ai";
import { CUSTOM_DEFAULT_ROLE, PROMPT_ROLES } from "@/lib/prompt-roles";
import { type ChatSession, useConversationStore, usePromptStore } from "@/stores";

import { dispatchConversationCommand } from "../conversation-commands";
import type {
  BuiltInCatalogItem,
  ChatCatalog,
  CustomDefaultCatalogItem,
  UserChatCatalogItem,
} from "./chat-catalog.types";

function deriveDefaultName(chat: ChatSession): string {
  const text = chat.messages.length > 0 ? getMessageText(chat.messages[0]) : "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 0 ? clean.slice(0, 60) : "New chat";
}

function getPreview(chat: ChatSession): string {
  return chat.messages.length > 0 ? getMessageText(chat.messages[0]) : "";
}

export function useChatCatalog(): ChatCatalog {
  const allChats = useConversationStore(state => state.chats);
  const handleDelete = useConversationStore(state => state.handleDelete);
  const createNewChat = useConversationStore(state => state.createNewChat);
  const setChatRole = useConversationStore(state => state.setChatRole);
  const saveMessages = useConversationStore(state => state.saveMessages);

  const hiddenDefaultRoleIds = usePromptStore(state => state.hiddenDefaultRoleIds);
  const customDefaultChats = usePromptStore(state => state.customDefaultChats);
  const defaultRoleNames = usePromptStore(state => state.defaultRoleNames);
  const hideDefaultRole = usePromptStore(state => state.hideDefaultRole);
  const addCustomDefaultChat = usePromptStore(state => state.addCustomDefaultChat);
  const removeCustomDefaultChat = usePromptStore(state => state.removeCustomDefaultChat);
  const renameDefaultRole = usePromptStore(state => state.renameDefaultRole);
  const renameCustomDefaultChat = usePromptStore(state => state.renameCustomDefaultChat);

  const builtIns = useMemo<BuiltInCatalogItem[]>(
    () =>
      PROMPT_ROLES.filter(role => !hiddenDefaultRoleIds.includes(role.id)).map(role => ({
        id: role.id,
        name: defaultRoleNames[role.id] ?? role.name,
        key: role.key,
        icon: role.icon,
      })),
    [hiddenDefaultRoleIds, defaultRoleNames]
  );

  const customDefaults = useMemo<CustomDefaultCatalogItem[]>(
    () =>
      Object.entries(customDefaultChats)
        .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(([id, item]) => ({ id, name: item.name })),
    [customDefaultChats]
  );

  const userChats = useMemo<UserChatCatalogItem[]>(
    () =>
      Object.entries(allChats)
        .filter(([, chat]) => !chat.role)
        .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(([id, chat]) => ({ id, preview: getPreview(chat), chat })),
    [allChats]
  );

  const createBuiltInSession = useCallback(
    (role: BuiltInCatalogItem) => {
      createNewChat(role.id, role.key);
    },
    [createNewChat]
  );

  const clearChat = useCallback(
    (chatId: string) => {
      dispatchConversationCommand("resetChat", { chatId });
      if (useConversationStore.getState().getChatById(chatId)) {
        saveMessages(chatId, []);
      }
    },
    [saveMessages]
  );

  const deleteBuiltIn = useCallback(
    (chatId: string) => {
      hideDefaultRole(chatId);
      handleDelete(chatId);
    },
    [handleDelete, hideDefaultRole]
  );

  const removeCustomDefault = useCallback(
    (chatId: string) => {
      removeCustomDefaultChat(chatId);
      setChatRole(chatId, undefined);
    },
    [removeCustomDefaultChat, setChatRole]
  );

  const promoteToDefault = useCallback(
    (chatId: string) => {
      const chat = useConversationStore.getState().getChatById(chatId);
      if (!chat) {
        return;
      }
      addCustomDefaultChat(chatId, { name: deriveDefaultName(chat), createdAt: chat.createdAt });
      setChatRole(chatId, CUSTOM_DEFAULT_ROLE);
    },
    [addCustomDefaultChat, setChatRole]
  );

  const deleteUserChat = useCallback(
    (chatId: string) => {
      handleDelete(chatId);
    },
    [handleDelete]
  );

  const renameBuiltIn = useCallback(
    (chatId: string, name: string) => {
      renameDefaultRole(chatId, name);
    },
    [renameDefaultRole]
  );

  const renameCustomDefault = useCallback(
    (chatId: string, name: string) => {
      renameCustomDefaultChat(chatId, name);
    },
    [renameCustomDefaultChat]
  );

  return {
    builtIns,
    customDefaults,
    userChats,
    createBuiltInSession,
    clearChat,
    deleteBuiltIn,
    removeCustomDefault,
    promoteToDefault,
    deleteUserChat,
    renameBuiltIn,
    renameCustomDefault,
  };
}
