import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ChatLayout } from "@/components/layout/chat-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UsernameForm from "@/components/username-form";
import { useNewChatSessionId } from "@/features/conversation/session";
import { useUserPreferencesStore } from "@/stores";

const homeSearchSchema = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeView,
  validateSearch: homeSearchSchema,
});

function HomeView() {
  const { id: searchId } = Route.useSearch();
  const id = useNewChatSessionId(searchId);
  const isInitialized = useUserPreferencesStore(state => state.isInitialized);

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center">
      <ChatLayout key={id} id={id} initialMessages={[]} />
      <Dialog open={!isInitialized}>
        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to NTH Chat!</DialogTitle>
            <DialogDescription>
              Enter your name to get started. This is just to personalize your experience.
            </DialogDescription>
            <UsernameForm />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
