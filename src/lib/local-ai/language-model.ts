export type LocalAIAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface CreateLanguageModelOptions {
  system: string;
  expectedInputs?: LanguageModelExpected[];
  onDownloadProgress?: (loaded: number) => void;
  signal?: AbortSignal;
}

export function isLanguageModelSupported(): boolean {
  return typeof globalThis !== "undefined" && "LanguageModel" in globalThis;
}

export async function getAvailability(): Promise<LocalAIAvailability> {
  if (!isLanguageModelSupported()) {
    return "unavailable";
  }

  return (await LanguageModel.availability()) as LocalAIAvailability;
}

export function createLanguageModelSession({
  system,
  expectedInputs,
  onDownloadProgress,
  signal,
}: CreateLanguageModelOptions): Promise<LanguageModel> {
  if (!isLanguageModelSupported()) {
    throw new Error("LanguageModel is not supported in this browser");
  }

  return LanguageModel.create({
    initialPrompts: [{ role: "system", content: system }],
    ...(expectedInputs ? { expectedInputs } : {}),
    monitor(m) {
      m.addEventListener("downloadprogress", event => {
        const progressEvent = event as Event & { loaded: number };
        onDownloadProgress?.(progressEvent.loaded);
      });
    },
    signal,
  });
}
