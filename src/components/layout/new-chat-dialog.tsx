import { useState } from "react";

import { useNavigate, useRouter } from "@tanstack/react-router";
import { StickyNotePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/prompt-roles";
import { generateUUID } from "@/lib/utils";
import { usePromptStore } from "@/stores";

export function NewChatDialog() {
  const navigate = useNavigate();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const updateSystemPrompt = usePromptStore(state => state.updateSystemPrompt);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

  const openDialog = () => {
    setPrompt(DEFAULT_SYSTEM_PROMPT);
    setOpen(true);
  };

  const startChat = () => {
    const id = generateUUID();
    const trimmed = prompt.trim();
    updateSystemPrompt(id, trimmed.length > 0 ? trimmed : DEFAULT_SYSTEM_PROMPT);
    setOpen(false);
    setOpenMobile(false);
    void navigate({ to: "/", search: { id } });
    void router.invalidate();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              type="button"
              className="h-fit p-2 group-data-[collapsible=icon]:hidden"
              onClick={openDialog}
            />
          }
        >
          <StickyNotePlus />
        </TooltipTrigger>
        <TooltipContent align="end">New Chat</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="space-y-4">
            <DialogTitle>New chat</DialogTitle>
            <DialogDescription>
              Set the system prompt to start this conversation with the right context.
            </DialogDescription>
            <Textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              rows={8}
              autoFocus
              placeholder="Enter a system prompt..."
            />
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="button" onClick={startChat}>
                Start chat
              </Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
