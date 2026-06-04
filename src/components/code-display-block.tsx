"use client";
import React, { useMemo, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

import { writeTextToClipboard } from "@/lib/browser";

import { Button } from "./ui/button";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("java", java);

interface ButtonCodeblockProps {
  code: string;
}

export default function CodeDisplayBlock({ code }: ButtonCodeblockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isCopiedRef = useRef(false);
  const { theme } = useTheme();

  const filteredCode = useMemo(() => code.split("\n").slice(1).join("\n") || code, [code]);
  const trimmedCode = useMemo(() => filteredCode.trim(), [filteredCode]);
  const language = useMemo(
    () =>
      ["tsx", "js", "python", "css", "html", "java"].includes(code.split("\n")[0])
        ? code.split("\n")[0]
        : "tsx",
    [code]
  );

  const customStyle = useMemo(
    () => ({
      margin: 0,
      background: theme === "dark" ? "#303033" : "#fcfcfc",
    }),
    [theme]
  );
  const codeStyle = useMemo(() => (theme === "dark" ? oneDark : oneLight), [theme]);

  const copyToClipboard = async () => {
    if (isCopiedRef.current) return; // Prevent multiple triggers
    try {
      await writeTextToClipboard(trimmedCode);
      isCopiedRef.current = true;
      setIsCopied(true);
      toast.success("Code copied to clipboard!");

      setTimeout(() => {
        isCopiedRef.current = false;
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to copy code");
    }
  };

  return (
    <div className="relative my-4 flex flex-col overflow-hidden text-start">
      <Button
        onClick={() => void copyToClipboard()}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-5 w-5"
      >
        {isCopied ? (
          <CheckIcon className="h-4 w-4 scale-100 transition-all" />
        ) : (
          <CopyIcon className="h-4 w-4 scale-100 transition-all" />
        )}
      </Button>
      <SyntaxHighlighter language={language} style={codeStyle} customStyle={customStyle}>
        {trimmedCode}
      </SyntaxHighlighter>
    </div>
  );
}
