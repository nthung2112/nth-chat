import { useState } from "react";

import { useNavigate, useRouter } from "@tanstack/react-router";
import { SettingsIcon } from "lucide-react";
import { MoreVerticalIcon, ZapOff } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useComposerStore, useConversationStore, useUserPreferencesStore } from "@/stores";

import EditUsernameForm from "../edit-username-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export function NavUser() {
  const userName = useUserPreferencesStore(state => state.userName);
  const clearAllChats = useConversationStore(state => state.clearAll);
  const clearComposerImages = useComposerStore(state => state.setBase64Images);
  const navigate = useNavigate();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleClearAll = () => {
    const confirmation = confirm("Are you sure you want to clear all chats?");
    if (confirmation) {
      clearAllChats();
      clearComposerImages(null);
      void navigate({ to: "/" });
      void router.invalidate();
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarImage
                src={import.meta.env.VITE_BASE_URL + "chatbot.png"}
                alt="AI"
                width={4}
                height={4}
                className="object-contain"
              />
              <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{userName}</span>
            </div>
            <MoreVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side="top"
            align="center"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={handleClearAll}>
              <div className="flex w-full cursor-pointer items-center gap-2 p-1">
                <ZapOff className="h-4 w-4" />
                <p>Clear all</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <div className="flex w-full cursor-pointer items-center gap-2 p-1">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent>
            <DialogHeader className="space-y-4">
              <DialogTitle>Settings</DialogTitle>
              <EditUsernameForm />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
