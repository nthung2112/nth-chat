import { getRawAvailability, isLanguageModelSupported } from "./language-model";

export type LocalAIAvailability = "unavailable" | "downloadable" | "downloading" | "available";

export { isLanguageModelSupported };

export async function getAvailability(): Promise<LocalAIAvailability> {
  const result = await getRawAvailability();
  return result as LocalAIAvailability;
}
