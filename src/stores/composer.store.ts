import { create } from "zustand";

interface ComposerState {
  base64Images: string[] | null;
}

interface ComposerActions {
  setBase64Images: (base64Images: string[] | null) => void;
}

type ComposerStore = ComposerState & ComposerActions;

export const useComposerStore = create<ComposerStore>(set => ({
  base64Images: null,
  setBase64Images: base64Images => set({ base64Images }),
}));
