"use client";

import React, { useEffect } from "react";

import { AnimatePresence } from "framer-motion";
import { CrossIcon, XIcon } from "lucide-react";
import { Mic, SendHorizonal } from "lucide-react";

import useSpeechToText from "@/hooks/useSpeechRecognition";
import { useComposerStore } from "@/stores";

import { ChatInput } from "../../components/chat/chat-input";
import MultiImagePicker from "../../components/image-embedder";
import { Button } from "../../components/ui/button";

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isReady: boolean;
  stop: () => void;
  setInput?: React.Dispatch<React.SetStateAction<string>>;
  input: string;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isReady,
  stop,
  setInput,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const base64Images = useComposerStore(state => state.base64Images);
  const setBase64Images = useComposerStore(state => state.setBase64Images);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const { isListening, transcript, startListening, stopListening } = useSpeechToText({
    continuous: true,
  });

  const listen = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startListening();
    }
  };

  const stopVoiceInput = () => {
    if (setInput) {
      setInput(transcript.length ? transcript : "");
    }
    stopListening();
  };

  const handleListenClick = () => {
    listen();
  };

  const handleImagesPick = (images: string[]) => {
    if (!images.length) {
      return;
    }
    setBase64Images([...(base64Images ?? []), ...images]);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-4 pb-4">
      <AnimatePresence initial={false}>
        <form
          onSubmit={handleSubmit}
          className="bg-accent dark:bg-card flex w-full flex-col items-center rounded-lg"
        >
          <ChatInput
            value={isListening ? (transcript.length ? transcript : "") : input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder={
              isReady
                ? !isListening
                  ? "Enter your prompt here"
                  : "Listening"
                : "Local AI is not ready"
            }
            className="bg-accent placeholder:text-muted-foreground dark:bg-card max-h-40 rounded-lg border-0 px-6 pt-4 text-sm shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed"
          />

          <div className="flex w-full items-center p-2">
            {isLoading ? (
              <div className="flex w-full justify-between">
                <MultiImagePicker disabled onImagesPick={handleImagesPick} />
                <div>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    onClick={e => {
                      e.preventDefault();
                      stop();
                    }}
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-between">
                <MultiImagePicker
                  disabled={!isReady || isListening}
                  onImagesPick={handleImagesPick}
                />
                <div>
                  <Button
                    className={`shrink-0 rounded-full ${
                      isListening ? "relative bg-blue-500/30 hover:bg-blue-400/30" : ""
                    }`}
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={handleListenClick}
                    disabled={isLoading}
                  >
                    <Mic className="h-5 w-5" />
                    {isListening && (
                      <span className="absolute h-[120%] w-[120%] animate-pulse rounded-full bg-blue-500/30" />
                    )}
                  </Button>

                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    disabled={isLoading || !input.trim() || isListening || !isReady}
                  >
                    <SendHorizonal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {base64Images && (
            <div className="flex w-full gap-2 px-2 pb-2">
              {base64Images.map((image, index) => {
                return (
                  <div
                    key={index}
                    className="bg-muted-foreground/20 relative flex w-fit flex-col gap-2 rounded-md border-x border-t p-1"
                  >
                    <div className="flex text-sm">
                      <img
                        src={image}
                        width={20}
                        height={20}
                        className="h-auto max-h-[100px] w-auto max-w-[100px] rounded-md"
                        alt={""}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const updatedImages = (prevImages: string[]) =>
                          prevImages.filter((_, i) => i !== index);
                        setBase64Images(updatedImages(base64Images));
                      }}
                      size="icon"
                      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <CrossIcon className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </AnimatePresence>
    </div>
  );
}
