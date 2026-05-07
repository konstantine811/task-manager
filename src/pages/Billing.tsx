import { Button } from "@/components/ui/button";
import { fetchBillingMe } from "@/services/billing/proxy-client";
import type { BillingMeResponse, BillingPlanId } from "@/services/billing/proxy-client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Check, CreditCard, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PaidPlan = {
  id: Exclude<BillingPlanId, "free">;
  name: string;
  price: string;
  aiRequests: string;
  storage: string;
  description: string;
};

const PAID_PLANS: PaidPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$3",
    aiRequests: "250 AI requests / month",
    storage: "1 GB storage",
    description: "For light personal planning with AI support.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$5",
    aiRequests: "800 AI requests / month",
    storage: "5 GB storage",
    description: "For frequent planning, journaling, and heavier AI use.",
  },
];

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

export default function Billing() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wayforpayUrl = import.meta.env.VITE_WAYFORPAY_SUBSCRIPTION_URL?.trim();

  const currentPlanId = billing?.plan.id ?? "free";
  const statusLabel = useMemo(() => {
    if (!billing) return "Loading";
    if (billing.plan.paymentRequired) return "Trial ended";
    if (billing.plan.id === "free") return "Trial active";
    return `${billing.plan.id[0].toUpperCase()}${billing.plan.id.slice(1)} active`;
  }, [billing]);

  const loadBilling = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setBilling(await fetchBillingMe(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load billing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
  }, [user]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-white/10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Life Focus Plan
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Billing
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Manage AI limits, storage access, and paid subscriptions through WayForPay.
          </p>
        </div>
        <Button variant="outline" onClick={loadBilling} disabled={loading || !user}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-indigo-300/70 bg-indigo-50 p-4 dark:border-indigo-400/30 dark:bg-indigo-500/10">
        <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">
          Use your Life Focus account email on the payment page
        </p>
        <p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-100/75">
          Email: <span className="font-semibold">{billing?.email ?? user?.email ?? "—"}</span>
        </p>
        <p className="mt-2 text-xs leading-5 text-indigo-900/70 dark:text-indigo-100/60">
          The proxy activates access from the WayForPay Service URL callback by matching this email.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {statusLabel}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Trial ends: {formatDate(billing?.plan.trialEndsAt ?? null)}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Paid access ends: {formatDate(billing?.plan.accessEndsAt ?? null)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            AI usage
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {billing?.usage.aiRequests ?? 0} / {billing?.plan.aiRequestsPerMonth ?? 0}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Current month: {billing?.usage.month ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Storage
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {formatBytes(billing?.usage.storageBytes ?? 0)}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Limit: {formatBytes(billing?.plan.storageBytes ?? 0)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {PAID_PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id && !billing?.plan.paymentRequired;

          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-lg border bg-white p-5 dark:bg-white/[0.03]",
                isCurrent
                  ? "border-indigo-400 dark:border-indigo-400/60"
                  : "border-zinc-200 dark:border-white/10",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-zinc-950 dark:text-white">
                    {plan.price}
                  </p>
                  <p className="text-xs text-zinc-500">30 days</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {plan.aiRequests}
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {plan.storage}
                </p>
              </div>

              <Button
                className="mt-6"
                asChild={Boolean(wayforpayUrl)}
                disabled={!wayforpayUrl}
              >
                {wayforpayUrl ? (
                  <a href={wayforpayUrl} target="_blank" rel="noreferrer">
                    <CreditCard />
                    {isCurrent ? "Manage subscription" : "Subscribe with WayForPay"}
                    <ExternalLink />
                  </a>
                ) : (
                  <>
                    <CreditCard />
                    Configure WayForPay URL
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
