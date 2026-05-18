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

export const supportPaymentInfo = {
  title: "Підтримати Life Focus",
  description:
    "Зараз застосунок можна використовувати безкоштовно. Якщо він допомагає тобі тримати фокус, можна підтримати розробку вручну, а ми активуємо Pro після підтвердження переказу.",
  email: import.meta.env.VITE_SUPPORT_PAYMENT_EMAIL?.trim() || merchantInfo.email,
  iban: import.meta.env.VITE_SUPPORT_PAYMENT_IBAN?.trim() || merchantInfo.iban,
  monoJarUrl: import.meta.env.VITE_SUPPORT_MONO_JAR_URL?.trim() || "",
  privatUrl: import.meta.env.VITE_SUPPORT_PRIVAT_URL?.trim() || "",
  wiseUrl: import.meta.env.VITE_SUPPORT_WISE_URL?.trim() || "",
  cryptoWallet: import.meta.env.VITE_SUPPORT_CRYPTO_WALLET?.trim() || "",
  paymentPurpose:
    import.meta.env.VITE_SUPPORT_PAYMENT_PURPOSE?.trim() ||
    "Підтримка Life Focus, email акаунта: [ваш email]",
};

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: "0 грн",
    period: "назавжди",
    description: "Базовий доступ без обов'язкової оплати.",
    features: ["Шаблони задач", "План на день", "Базова аналітика"],
  },
  {
    id: "starter",
    name: "Starter",
    price: import.meta.env.VITE_STARTER_PRICE_UAH?.trim() || "[вкажіть ціну] грн",
    period: "місяць",
    description: "Ручна активація після донату або переказу.",
    features: ["Більше AI-запитів", "Більше сховища", "Підтримка розвитку сервісу"],
  },
  {
    id: "pro",
    name: "Pro",
    price: import.meta.env.VITE_PRO_PRICE_UAH?.trim() || "[вкажіть ціну] грн",
    period: "місяць",
    description: "Для активної роботи і тих, хто хоче підтримати продукт сильніше.",
    features: ["Більший ліміт AI", "Більше сховище", "Пріоритетні поліпшення сервісу"],
  },
] as const;
