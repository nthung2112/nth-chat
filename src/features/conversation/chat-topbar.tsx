"use client";

import React from "react";

import { useNavigate, useRouter } from "@tanstack/react-router";
import { DownloadIcon, Loader2Icon, Maximize2Icon, Minimize2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { ThemeSwitcher } from "@/components/theme-switcher";
import type { UseLocalAIResult } from "@/lib/local-ai";

import { Button } from "../../components/ui/button";
import { SidebarTrigger, useSidebar } from "../../components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";

interface ChatTopbarProps {
  localAI: UseLocalAIResult;
  isFullWidthLayout: boolean;
  onToggleLayoutWidth: () => void;
}

function getStatusText({ supported, availability }: UseLocalAIResult): string {
  if (!supported) {
    return "Local AI unavailable";
  }

  if (availability === "available") {
    return "Local AI ready";
  }

  if (availability === "downloading") {
    return "Local AI downloading";
  }

  if (availability === "downloadable") {
    return "Local AI inactive";
  }

  return "Local AI unavailable";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to activate local AI";
}

export default function ChatTopbar({
  localAI,
  isFullWidthLayout,
  onToggleLayoutWidth,
}: ChatTopbarProps) {
  const [isActivating, setIsActivating] = React.useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const { open: sidebarOpen, isMobile } = useSidebar();
  const canActivate = localAI.supported && localAI.availability === "downloadable";
  const isDownloading = isActivating || localAI.availability === "downloading";
  const progress = Math.round(localAI.downloadProgress * 100);

  const handleActivate = async () => {
    if (!canActivate || isActivating) {
      return;
    }

    setIsActivating(true);
    try {
      const nextAvailability = await localAI.triggerDownload();
      if (nextAvailability === "available") {
        toast.success("Local AI is ready");
        return;
      }
      if (nextAvailability === "downloading") {
        toast.message("Local AI download started");
        return;
      }
      toast.error("Local AI is unavailable");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="bg-background sticky top-0 flex items-center justify-between gap-2 px-2 py-1.5 md:px-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {(!sidebarOpen || isMobile) && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                className="ml-auto h-7 px-1 md:ml-0"
                onClick={() => {
                  void navigate({ to: "/" });
                  void router.invalidate();
                }}
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant={localAI.isReady ? "secondary" : "ghost"}
            className="gap-2"
            type="button"
            disabled={!canActivate || isDownloading}
            onClick={handleActivate}
          >
            {isDownloading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
            <span>{isDownloading ? `Downloading ${progress}%` : getStatusText(localAI)}</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              className="hidden h-8 w-8 md:flex"
              onClick={onToggleLayoutWidth}
              aria-label={
                isFullWidthLayout
                  ? "Switch to centred chat layout"
                  : "Switch to full width chat layout"
              }
            >
              {isFullWidthLayout ? (
                <Minimize2Icon className="rotate-45 transform" />
              ) : (
                <Maximize2Icon className="rotate-45 transform" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullWidthLayout ? "Centred width (max-w-3xl)" : "Full width"}
          </TooltipContent>
        </Tooltip>
        <ThemeSwitcher />
      </div>
    </div>
  );
}
