export const merchantInfo = {
  brandName: "Life Focus",
  legalName: import.meta.env.VITE_MERCHANT_LEGAL_NAME?.trim() || "ФОП/ТОВ [вкажіть назву]",
  taxId: import.meta.env.VITE_MERCHANT_TAX_ID?.trim() || "[ІПН/ЄДРПОУ]",
  legalAddress: import.meta.env.VITE_MERCHANT_LEGAL_ADDRESS?.trim() || "[юридична адреса]",
  actualAddress: import.meta.env.VITE_MERCHANT_ACTUAL_ADDRESS?.trim() || "[фактична адреса]",
  email: import.meta.env.VITE_MERCHANT_EMAIL?.trim() || "support@life-focus.app",
  phone: import.meta.env.VITE_MERCHANT_PHONE?.trim() || "[телефон підтримки]",
  iban: import.meta.env.VITE_MERCHANT_IBAN?.trim() || "[IBAN]",
  bank: import.meta.env.VITE_MERCHANT_BANK?.trim() || "[банк]",
  website:
    import.meta.env.VITE_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "https://life-focus.app"),
};

export const paymentProviderName = "Portmone";

export const pricingPlans = [
  {
    id: "free",
    name: "Пробний доступ",
    price: "0 грн",
    period: "14 днів",
    description: "Базовий старт для знайомства із сервісом.",
    features: ["Шаблони задач", "План на день", "Базова аналітика"],
  },
  {
    id: "starter",
    name: "Starter",
    price: import.meta.env.VITE_STARTER_PRICE_UAH?.trim() || "[вкажіть ціну] грн",
    period: "місяць",
    description: "Для регулярного планування та помірного використання AI.",
    features: ["AI-запити в межах тарифу", "Сховище в межах тарифу", "Аналітика за період"],
  },
  {
    id: "pro",
    name: "Pro",
    price: import.meta.env.VITE_PRO_PRICE_UAH?.trim() || "[вкажіть ціну] грн",
    period: "місяць",
    description: "Для активної роботи з шаблонами, аналітикою та AI.",
    features: ["Більший ліміт AI", "Більше сховище", "Пріоритетні поліпшення сервісу"],
  },
] as const;
