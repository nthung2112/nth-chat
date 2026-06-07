import type { ChatProps } from "@/features/conversation/chat";
import Chat from "@/features/conversation/chat";

import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function ChatLayout({ initialMessages, id }: ChatProps) {
  return (
    <SidebarProvider>
      <AppSidebar chatId={id} />
      <SidebarInset>
        <Chat id={id} initialMessages={initialMessages} />
      </SidebarInset>
    </SidebarProvider>
  );
}
