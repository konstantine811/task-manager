export const ThemePalette: IThemePalette = {
  dark: {
    background: "#000000",
    border: "#2a2a2a",
    foreground: "#d4d4d4",
    card: "#0a0a0a",
    "card-foreground": "#d4d4d4",
    popover: "#000000",
    "popover-foreground": "#d4d4d4",
    primary: "#4a80e8",
    "primary-foreground": "#d4d4d4",
    secondary: "#e6e6e6",
    "secondary-foreground": "#666666",
    muted: "#0a0a0a",
    "muted-foreground": "#666666",
    accent: "#4a80e8",
    "accent-foreground": "#d4d4d4",
    destructive: "#ff3333",
    input: "#333333",
    ring: "#4a80e8",
    chart1: "#4a80e8",
    chart2: "#65e396",
    chart3: "#5b9bd5",
    chart4: "#7eb8e8",
    chart5: "#fffe00",
  },
  light: {
    background: "#fbfcf8",
    border: "#e0e0e0",
    foreground: "#333333",
    card: "#e8e8e8",
    "card-foreground": "#333333",
    popover: "#fbfcf8",
    "popover-foreground": "#333333",
    primary: "#3f6ae0",
    "primary-foreground": "#ffffff",
    secondary: "#4d4d4d",
    "secondary-foreground": "#666666",
    muted: "#f2f2f2",
    "muted-foreground": "#666666",
    accent: "#3f6ae0",
    "accent-foreground": "#333333",
    destructive: "#cc0000",
    input: "#e6e6e6",
    ring: "#3f6ae0",
    chart1: "#3f6ae0",
    chart2: "#65e396",
    chart3: "#5b9bd5",
    chart4: "#7eb8e8",
    chart5: "#fffe00",
  },
};

export enum ThemeType {
  DARK = "dark",
  LIGHT = "light",
}

export const ThemeStaticPalette = {
  green: "#65e396",
  yellow: "#fffe00",
};

export type IThemePalette = {
  [key in ThemeType]: IThemeColors;
};

export interface IThemeColors {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  input: string;
  ring: string;
  border: string;
  sidebar?: string;
  "sidebar-foreground"?: string;
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
}
