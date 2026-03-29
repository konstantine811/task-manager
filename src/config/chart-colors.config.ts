import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import { CATEGORY_STYLE } from "@/components/dnd/config/category-style.config";

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

/**
 * Користувацькі / старі підписи колонки → канонічний id (наприклад «Інше» замість leisure у даних).
 */
const ANALYTICS_CATEGORY_ALIASES: Record<string, string> = {
  Інше: "leisure",
  інше: "leisure",
  Відпочинок: "leisure",
  "Побут/відпочинок": "leisure",
  Other: "leisure",
  other: "leisure",
  Leisure: "leisure",
  leisure: "leisure",
  Rest: "leisure",
  "Life/rest": "leisure",
};

export function getChartColor(key: string, index: number): string {
  return CATEGORY_CHART_COLORS[key] ?? TASK_PALETTE[index % TASK_PALETTE.length];
}

/** Стабільний колір для невідомої категорії (не прив’язувати до індексу сегмента — інакше збіг з духовністю тощо). */
export function chartColorFallbackForUnknownKey(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return TASK_PALETTE[Math.abs(h) % TASK_PALETTE.length];
}

/**
 * Ключ категорії для кольору графіка: id з даних або локалізована назва з перекладу.
 * Без цього getChartColor(name, i) падає в палітру за індексом — кольори не збігаються з іконками.
 */
export function resolveAnalyticsCategoryId(
  raw: string,
  t: (key: string) => string,
): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const aliased = ANALYTICS_CATEGORY_ALIASES[trimmed];
  if (aliased) return aliased;
  if (CATEGORY_CHART_COLORS[raw] !== undefined) return raw;
  if (CATEGORY_STYLE[raw]) return raw;
  const hit = CATEGORY_OPTIONS.find(
    (k) => t(`task_manager.categories.${k}`) === raw,
  );
  return hit ?? raw;
}

/** Колір сегмента / прогрес-бару: той самий, що тема категорії (іконка). */
export function getChartColorForAnalyticsCategory(
  rawKey: string,
  _index: number,
  t: (key: string) => string,
): string {
  const id = resolveAnalyticsCategoryId(rawKey, t);
  if (CATEGORY_CHART_COLORS[id] !== undefined) return CATEGORY_CHART_COLORS[id];
  return chartColorFallbackForUnknownKey(rawKey);
}
