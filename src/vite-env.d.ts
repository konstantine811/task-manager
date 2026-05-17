/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string;
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_STARTER_PRICE_UAH?: string;
  readonly VITE_PRO_PRICE_UAH?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_PORTMONE_PAYEE_ID?: string;
  readonly VITE_PORTMONE_GATEWAY_URL?: string;
  readonly VITE_PORTMONE_STARTER_AMOUNT_UAH?: string;
  readonly VITE_PORTMONE_PRO_AMOUNT_UAH?: string;
  readonly VITE_MERCHANT_LEGAL_NAME?: string;
  readonly VITE_MERCHANT_TAX_ID?: string;
  readonly VITE_MERCHANT_LEGAL_ADDRESS?: string;
  readonly VITE_MERCHANT_ACTUAL_ADDRESS?: string;
  readonly VITE_MERCHANT_EMAIL?: string;
  readonly VITE_MERCHANT_PHONE?: string;
  readonly VITE_MERCHANT_IBAN?: string;
  readonly VITE_MERCHANT_BANK?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
