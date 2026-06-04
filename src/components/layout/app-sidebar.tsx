"use client";

import { useEffect, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import { Eraser, MessageSquare, MoreHorizontal, Pencil, PenLine, Star, Trash2 } from "lucide-react";

import { PromptEditDialog } from "@/components/prompt-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { type BuiltInCatalogItem, useChatCatalog } from "@/features/conversation/chat-catalog";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { NavUser } from "./nav-user";
import { NewChatDialog } from "./new-chat-dialog";

interface SidebarProps {
  chatId: string;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button variant="destructive" onClick={onConfirm} />}>
              {confirmLabel}
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onRename: (name: string) => void;
}

function RenameDialog({ open, onOpenChange, initialName, onRename }: RenameDialogProps) {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) {
      setValue(initialName);
    }
  }, [open, initialName]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      onRename(trimmed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle>Rename item</DialogTitle>
          <DialogDescription>Give this item a name that is easy to recognise.</DialogDescription>
          <Input
            value={value}
            onChange={event => setValue(event.target.value)}
            autoFocus
            placeholder="Enter a name..."
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
                onOpenChange(false);
              }
            }}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button onClick={handleSave} />}>Save</DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

interface DefaultChatMenuProps {
  id: string;
  name: string;
  isBuiltIn: boolean;
  onRename: (name: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

function DefaultChatMenu({ id, name, isBuiltIn, onRename, onClear, onDelete }: DefaultChatMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuAction />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem className="gap-2" onClick={() => setRenameOpen(true)}>
            <PenLine className="h-4 w-4 shrink-0" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 shrink-0" />
            Edit prompt
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setClearOpen(true)}>
            <Eraser className="h-4 w-4 shrink-0" />
            Clear chat
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            Delete item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        initialName={name}
        onRename={onRename}
      />
      <PromptEditDialog id={id} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear chat?"
        description="Are you sure you want to clear this chat? This action cannot be undone."
        confirmLabel="Clear"
        onConfirm={onClear}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isBuiltIn ? "Delete item?" : "Remove from default?"}
        description={
          isBuiltIn
            ? "This hides the default item and clears its chat history. Reset the app to restore defaults."
            : "This moves the chat back to Your chats and keeps its history."
        }
        confirmLabel={isBuiltIn ? "Delete" : "Remove"}
        onConfirm={onDelete}
      />
    </>
  );
}

interface UserChatMenuProps {
  onSetDefault: () => void;
  onDelete: () => void;
}

function UserChatMenu({ onSetDefault, onDelete }: UserChatMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuAction />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem className="gap-2" onClick={onSetDefault}>
            <Star className="h-4 w-4 shrink-0" />
            Set as default chat
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 shrink-0" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete chat?"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onDelete}
      />
    </>
  );
}

export function AppSidebar({ chatId }: SidebarProps) {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const catalog = useChatCatalog();

  const openBuiltInChat = (role: BuiltInCatalogItem) => () => {
    setOpenMobile(false);
    catalog.createBuiltInSession(role);
    void navigate({ to: "/c", search: { id: role.id } });
  };

  const openCustomChat = (id: string) => () => {
    setOpenMobile(false);
    void navigate({ to: "/c", search: { id } });
  };

  const deleteBuiltInItem = (id: string) => {
    catalog.deleteBuiltIn(id);
    if (id === chatId) {
      void navigate({ to: "/" });
    }
  };

  const deleteUserChat = (id: string) => {
    catalog.deleteUserChat(id);
    void navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <Link
              to="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row items-center gap-3 px-2 group-data-[collapsible=icon]:px-0"
            >
              <img
                src={import.meta.env.VITE_BASE_URL + "chatbot.png"}
                alt="AI"
                width={28}
                height={28}
                className="object-contain dark:invert"
              />
            </Link>
            <NewChatDialog />
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Default chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {catalog.builtIns.map(role => (
                <SidebarMenuItem key={role.id}>
                  <SidebarMenuButton
                    onClick={openBuiltInChat(role)}
                    isActive={role.id === chatId}
                    tooltip={role.name}
                  >
                    <role.icon />
                    <span>{role.name}</span>
                  </SidebarMenuButton>
                  <DefaultChatMenu
                    id={role.id}
                    name={role.name}
                    isBuiltIn
                    onRename={name => catalog.renameBuiltIn(role.id, name)}
                    onClear={() => catalog.clearChat(role.id)}
                    onDelete={() => deleteBuiltInItem(role.id)}
                  />
                </SidebarMenuItem>
              ))}
              {catalog.customDefaults.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={openCustomChat(item.id)}
                    isActive={item.id === chatId}
                    tooltip={item.name}
                  >
                    <MessageSquare />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                  <DefaultChatMenu
                    id={item.id}
                    name={item.name}
                    isBuiltIn={false}
                    onRename={name => catalog.renameCustomDefault(item.id, name)}
                    onClear={() => catalog.clearChat(item.id)}
                    onDelete={() => catalog.removeCustomDefault(item.id)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Your chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {catalog.userChats.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={item.id === chatId}
                    tooltip={item.preview || "New chat"}
                    render={
                      <Link
                        to="/c"
                        search={{ id: item.id }}
                        onClick={() => {
                          setOpenMobile(false);
                        }}
                      />
                    }
                  >
                    <span>{item.preview}</span>
                  </SidebarMenuButton>
                  <UserChatMenu
                    onSetDefault={() => catalog.promoteToDefault(item.id)}
                    onDelete={() => deleteUserChat(item.id)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
