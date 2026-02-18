import { LocalStorageKey } from "@/config/local-storage.config";
import { ThemePalette, ThemeType } from "@/config/theme-colors.config";
import { useThemeStore } from "@/storage/themeStore";
import { setTheme } from "@/utils/theme.util";
import { useEffect } from "react";

function applyTheme(themeName: ThemeType) {
  const theme = ThemePalette[themeName] ?? ThemePalette[ThemeType.DARK];
  setTheme(theme, themeName);
}

export default function useSetTheme() {
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const setThemeStore = useThemeStore((state) => state.onSetTheme);

  useEffect(() => {
    const stored = localStorage.getItem(LocalStorageKey.theme);
    const themeName = (stored as ThemeType) ?? ThemeType.DARK;
    setThemeStore(themeName);
    applyTheme(themeName);
  }, [setThemeStore]);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);
}
