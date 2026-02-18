import { ThemeType } from "@/config/theme-colors.config";
import { LocalStorageKey } from "@/config/local-storage.config";
import { create } from "zustand";

interface ThemeState {
  selectedTheme: ThemeType;
  onSetTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  selectedTheme: ThemeType.DARK,
  onSetTheme: (theme: ThemeType) => {
    try {
      localStorage.setItem(LocalStorageKey.theme, theme);
    } catch {
      // ignore
    }
    set({ selectedTheme: theme });
  },
}));
