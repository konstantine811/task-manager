import type { IThemeColors } from "@/config/theme-colors.config";
import { ThemeType } from "@/config/theme-colors.config";

/** Set CSS variables and dark class on document from theme palette. */
export function setTheme(themeColors: IThemeColors, themeName?: ThemeType) {
  Object.entries(themeColors).forEach(([key, value]) => {
    if (value == null) return;
    const cssKey = key.replace(/([a-z])([0-9])/g, "$1-$2");
    document.documentElement.style.setProperty(`--${cssKey}`, value);
  });
  if (themeName !== undefined) {
    if (themeName === ThemeType.DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}
