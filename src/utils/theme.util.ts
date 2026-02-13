import type { IThemeColors } from "@/config/theme-colors.config";

/** Set CSS variables on document from theme palette (e.g. --background, --primary, --chart-1). */
export function setTheme(themeColors: IThemeColors) {
  Object.entries(themeColors).forEach(([key, value]) => {
    if (value == null) return;
    const cssKey = key.replace(/([a-z])([0-9])/g, "$1-$2");
    document.documentElement.style.setProperty(`--${cssKey}`, value);
  });
}
