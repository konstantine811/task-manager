import type { BillingPlanId } from "@/services/billing/proxy-client";

type PaidPlanId = Exclude<BillingPlanId, "free">;

type PortmoneCheckoutInput = {
  plan: PaidPlanId;
  userId: string;
  email: string | null;
};

const PORTMONE_GATEWAY_URL =
  import.meta.env.VITE_PORTMONE_GATEWAY_URL?.trim() ||
  "https://www.portmone.com.ua/gateway/";

const getPublicSiteUrl = () =>
  (
    import.meta.env.VITE_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");

const getPlanAmount = (plan: PaidPlanId) => {
  const value =
    plan === "starter"
      ? import.meta.env.VITE_PORTMONE_STARTER_AMOUNT_UAH
      : import.meta.env.VITE_PORTMONE_PRO_AMOUNT_UAH;
  const normalized = value?.trim().replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Не налаштована сума Portmone для тарифу ${plan}.`);
  }

  return amount.toFixed(2);
};

const getPortmonePayeeId = () => {
  const payeeId = import.meta.env.VITE_PORTMONE_PAYEE_ID?.trim();
  if (!payeeId) {
    throw new Error("VITE_PORTMONE_PAYEE_ID is not configured.");
  }
  return payeeId;
};

const createOrderReference = (plan: PaidPlanId, userId: string) => {
  const safeUserPart = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "user";
  return `LF-${plan}-${Date.now()}-${safeUserPart}`;
};

const submitPostForm = (action: string, fields: Record<string, string>) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
};

export const startPortmoneCheckout = ({
  plan,
  userId,
  email,
}: PortmoneCheckoutInput) => {
  const siteUrl = getPublicSiteUrl();
  const orderReference = createOrderReference(plan, userId);
  const planLabel = plan === "starter" ? "Starter" : "Pro";

  submitPostForm(PORTMONE_GATEWAY_URL, {
    payee_id: getPortmonePayeeId(),
    shop_order_number: orderReference,
    bill_amount: getPlanAmount(plan),
    description: `Life Focus ${planLabel} subscription`,
    success_url: `${siteUrl}/payment-result?status=success&order=${encodeURIComponent(orderReference)}`,
    failure_url: `${siteUrl}/payment-result?status=failure&order=${encodeURIComponent(orderReference)}`,
    lang: "uk",
    encoding: "UTF-8",
    attribute1: userId,
    attribute2: plan,
    attribute3: email ?? "",
  });

  return orderReference;
};

export const isPortmoneCheckoutConfigured = () =>
  Boolean(import.meta.env.VITE_PORTMONE_PAYEE_ID?.trim());
