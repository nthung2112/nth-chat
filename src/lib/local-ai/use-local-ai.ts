import { useCallback, useEffect, useState } from "react";

import {
  getAvailability,
  isLanguageModelSupported,
  type LocalAIAvailability,
} from "./availability";
import { destroyAllSessions, getOrCreateSession } from "./session";

export interface UseLocalAIResult {
  /** User's preference (true = wants to use local AI) */
  preference: boolean;
  /** Browser/model availability state */
  availability: LocalAIAvailability;
  /** Whether the LanguageModel global exists in this browser */
  supported: boolean;
  /** Last reported download progress in [0, 1] when state is 'downloading' */
  downloadProgress: number;
  /** True iff preference is enabled and model is fully ready to use */
  isReady: boolean;
  setPreference: (value: boolean) => void;
  /** Trigger an explicit model download/activation (must be called from a user gesture) */
  triggerDownload: () => Promise<LocalAIAvailability>;
  /** Re-check availability */
  refresh: () => Promise<LocalAIAvailability>;
}

export function useLocalAI(): UseLocalAIResult {
  const supported = isLanguageModelSupported();
  const [preference, setPreferenceState] = useState<boolean>(true);
  const [availability, setAvailability] = useState<LocalAIAvailability>(
    supported ? "downloadable" : "unavailable"
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const refresh = useCallback(async (): Promise<LocalAIAvailability> => {
    const next = await getAvailability();
    setAvailability(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (availability !== "downloading") return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [availability, refresh]);

  useEffect(() => {
    if (preference) return;
    destroyAllSessions().catch(error => {
      console.warn("Failed to destroy local AI sessions:", error);
    });
  }, [preference]);

  const updatePreference = useCallback((value: boolean) => {
    setPreferenceState(value);
  }, []);

  const triggerDownload = useCallback(async (): Promise<LocalAIAvailability> => {
    if (!supported) {
      return "unavailable";
    }

    try {
      await getOrCreateSession({
        system: "warmup",
        onDownloadProgress: loaded => setDownloadProgress(loaded),
      });
      return await refresh();
    } catch (error) {
      await refresh();
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to activate local AI", { cause: error });
    }
  }, [supported, refresh]);

  return {
    preference,
    availability,
    supported,
    downloadProgress,
    isReady: preference && availability === "available",
    setPreference: updatePreference,
    triggerDownload,
    refresh,
  };
}
