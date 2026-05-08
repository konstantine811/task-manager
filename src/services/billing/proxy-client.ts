import type { User } from "firebase/auth";

export type BillingPlanId = "free" | "starter" | "pro";

export type BillingPlan = {
  id: BillingPlanId;
  aiRequestsPerMonth: number;
  storageBytes: number;
  trialDays: number;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialActive: boolean;
  accessEndsAt: string | null;
  paymentRequired: boolean;
};

export type BillingUsage = {
  month: string;
  aiRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  storageBytes: number;
};

export type BillingMeResponse = {
  userId: string;
  email: string | null;
  plan: BillingPlan;
  usage: BillingUsage;
};

export type LiqPayCheckoutResponse = {
  provider: "liqpay";
  checkoutUrl: string;
  method: "POST";
  data: string;
  signature: string;
  orderId: string;
};

export type StorageCapacityResponse = {
  allowed: boolean;
  plan: BillingPlan;
  storageBytes: number;
  projectedBytes: number;
};

const getProxyUrl = () => {
  const url = import.meta.env.VITE_AI_PROXY_URL?.trim();
  if (!url) {
    throw new Error("VITE_AI_PROXY_URL is not configured.");
  }
  return url.replace(/\/$/, "");
};

const getAuthHeaders = async (user: User) => {
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? data.error
        : "Billing request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function fetchBillingMe(user: User): Promise<BillingMeResponse> {
  const response = await fetch(`${getProxyUrl()}/api/me`, {
    headers: await getAuthHeaders(user),
  });
  return readJsonOrThrow<BillingMeResponse>(response);
}

export async function createBillingCheckout(
  user: User,
  plan: Exclude<BillingPlanId, "free">,
): Promise<LiqPayCheckoutResponse> {
  const response = await fetch(`${getProxyUrl()}/api/billing/checkout`, {
    method: "POST",
    headers: await getAuthHeaders(user),
    body: JSON.stringify({ plan }),
  });
  return readJsonOrThrow<LiqPayCheckoutResponse>(response);
}

export async function checkStorageCapacity(
  user: User,
  additionalBytes: number,
): Promise<StorageCapacityResponse> {
  const response = await fetch(`${getProxyUrl()}/api/storage/check-capacity`, {
    method: "POST",
    headers: await getAuthHeaders(user),
    body: JSON.stringify({ additionalBytes }),
  });
  return readJsonOrThrow<StorageCapacityResponse>(response);
}
