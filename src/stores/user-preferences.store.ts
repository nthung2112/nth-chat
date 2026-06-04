import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferencesState {
  userName: string;
  isInitialized: boolean;
}

interface UserPreferencesActions {
  setUserName: (userName: string) => void;
  setIsInitialized: (value: boolean) => void;
}

type UserPreferencesStore = UserPreferencesState & UserPreferencesActions;

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    set => ({
      userName: "",
      isInitialized: false,
      setUserName: userName => set({ userName }),
      setIsInitialized: isInitialized => set({ isInitialized }),
    }),
    {
      name: "nth-user-preferences",
      partialize: state => ({
        userName: state.userName,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
