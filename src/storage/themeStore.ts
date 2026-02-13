import { ThemeType } from "@/config/theme-colors.config";
import { create } from "zustand";

interface ThemeState {
  selectedTheme: ThemeType;
  onSetTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  selectedTheme: ThemeType.DARK,
  onSetTheme: (theme: ThemeType) => {
    set({ selectedTheme: theme });
  },
}));
