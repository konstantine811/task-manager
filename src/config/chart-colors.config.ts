/** Hex кольори категорій — синхронізовані з category-style.config */
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  health: "#34d399",
  finance: "#60a5fa",
  emotions: "#fbbf24",
  relationships: "#fb7185",
  career: "#818cf8",
  spirituality: "#a78bfa",
  personal_growth: "#22d3ee",
  hobbies: "#fb923c",
  leisure: "#a1a1aa",
};

/** Палітра для задач — ті самі кольори категорій по кругу */
const TASK_PALETTE = Object.values(CATEGORY_CHART_COLORS);

export function getChartColor(key: string, index: number): string {
  return CATEGORY_CHART_COLORS[key] ?? TASK_PALETTE[index % TASK_PALETTE.length];
}
