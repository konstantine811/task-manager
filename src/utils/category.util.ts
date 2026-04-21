import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

const normalizeCategoryLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const CATEGORY_LABEL_ALIASES: Record<string, string> = {
  "здоров'я": "health",
  "здоровя": "health",
  health: "health",
  "фінанси": "finance",
  finance: "finance",
  "емоції": "emotions",
  emotions: "emotions",
  "відносини": "relationships",
  relationships: "relationships",
  "кар'єра": "career",
  "карєра": "career",
  career: "career",
  "духовність": "spirituality",
  spirituality: "spirituality",
  "особистісний розвиток": "personal_growth",
  "особистий розвиток": "personal_growth",
  "personal growth": "personal_growth",
  personal_growth: "personal_growth",
  "хобі": "hobbies",
  hobbies: "hobbies",
  "інше": "leisure",
  other: "leisure",
  leisure: "leisure",
};

/**
 * Canonical category key resolver for analytics and task merge flows.
 * Returns one of CATEGORY_OPTIONS when mapping is known, otherwise normalized raw label.
 */
export const resolveCategoryKey = (raw: string): string => {
  const value = raw.trim();
  if (!value) return value;

  if (CATEGORY_OPTIONS.includes(value)) return value;

  const normalized = normalizeCategoryLabel(value);
  const alias = CATEGORY_LABEL_ALIASES[normalized];
  if (alias) return alias;

  const byCanonicalOption = CATEGORY_OPTIONS.find(
    (option) => normalizeCategoryLabel(option) === normalized,
  );
  if (byCanonicalOption) return byCanonicalOption;

  return normalized;
};

