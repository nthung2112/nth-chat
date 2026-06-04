import type { PromptRole } from "@/lib/prompt-roles";
import type { ChatSession } from "@/stores";

export interface BuiltInCatalogItem {
  id: string;
  name: string;
  key: string;
  icon: PromptRole["icon"];
}

export interface CustomDefaultCatalogItem {
  id: string;
  name: string;
}

export interface UserChatCatalogItem {
  id: string;
  preview: string;
  chat: ChatSession;
}

export interface ChatCatalog {
  builtIns: BuiltInCatalogItem[];
  customDefaults: CustomDefaultCatalogItem[];
  userChats: UserChatCatalogItem[];
  createBuiltInSession: (role: BuiltInCatalogItem) => void;
  clearChat: (chatId: string) => void;
  deleteBuiltIn: (chatId: string) => void;
  removeCustomDefault: (chatId: string) => void;
  promoteToDefault: (chatId: string) => void;
  deleteUserChat: (chatId: string) => void;
  renameBuiltIn: (chatId: string, name: string) => void;
  renameCustomDefault: (chatId: string, name: string) => void;
}
