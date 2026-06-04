export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof navigator.clipboard.writeText === "function"
  );
}

export async function writeTextToClipboard(text: string): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error("Clipboard is not supported in this browser");
  }

  await navigator.clipboard.writeText(text);
}
