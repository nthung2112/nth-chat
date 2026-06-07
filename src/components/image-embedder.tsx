import React, { useCallback } from "react";

import { ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { readFilesAsDataUrls } from "@/lib/browser";

import { Button } from "./ui/button";

interface MultiImagePickerProps {
  onImagesPick: (base64Images: string[]) => void;
  disabled: boolean;
}

const MultiImagePicker: React.FC<MultiImagePickerProps> = ({ onImagesPick, disabled }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        const base64Images = await readFilesAsDataUrls(acceptedFiles);
        onImagesPick(base64Images);
      } catch (error) {
        console.error("Error converting images to base64:", error);
      }
    },
    [onImagesPick]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true, // Allow multiple file selection
    maxSize: 10485760, // 10 MB per file
  });

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input disabled={disabled} {...getInputProps()} />
      <Button
        disabled={disabled}
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-full"
      >
        <ImageIcon className="h-5 w-5" />
        {isDragActive && <span className="sr-only">Drop the images here</span>}
      </Button>
    </div>
  );
};

export default MultiImagePicker;
