import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePromptStore } from "@/stores";

interface PromptEditDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptEditDialog({ id, open, onOpenChange }: PromptEditDialogProps) {
  const prompt = usePromptStore(state => state.getPrompt(id));
  const updateSystemPrompt = usePromptStore(state => state.updateSystemPrompt);
  const [value, setValue] = useState(prompt);

  useEffect(() => {
    if (open) {
      setValue(prompt);
    }
  }, [open, id, prompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={event => setValue(event.target.value)}
          className="mt-2"
          autoFocus
          placeholder="Type your prompt here..."
          rows={10}
        />
        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="button"
                variant="secondary"
                onClick={() => updateSystemPrompt(id, value)}
              />
            }
          >
            Save Changes
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
