import { Button } from "@/components/ui/button";
import {
  fetchBillingMe,
  updateUserTrial,
} from "@/services/billing/proxy-client";
import type { BillingMeResponse } from "@/services/billing/proxy-client";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const WAYFORPAY_SUBSCRIPTION_URL =
  "https://secure.wayforpay.com/sub/s1a4266d903dc";

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
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMode, setAdminMode] = useState<"expired" | "hours" | "days">("expired");
  const [adminAmount, setAdminAmount] = useState("1");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminResult, setAdminResult] = useState<BillingMeResponse | null>(null);
  const wayforpayUrl =
    import.meta.env.VITE_WAYFORPAY_SUBSCRIPTION_URL?.trim() ||
    WAYFORPAY_SUBSCRIPTION_URL;
  const isAdmin = Boolean(billing?.plan.adminAccess);

  const statusLabel = useMemo(() => {
    if (!billing) return "Loading";
    if (billing.plan.adminAccess) return "Admin access";
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

  const handleAdminTrialUpdate = async () => {
    if (!user || !adminEmail.trim()) return;

    const amount = Number(adminAmount);
    if (adminMode !== "expired" && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error("Enter a positive duration.");
      return;
    }

    setAdminSaving(true);
    setAdminResult(null);

    try {
      const result = await updateUserTrial(
        user,
        adminMode === "expired"
          ? { email: adminEmail.trim(), expired: true }
          : {
              email: adminEmail.trim(),
              trialDaysFromNow: adminMode === "hours" ? amount / 24 : amount,
            },
      );
      setAdminResult(result);
      toast.success("Trial updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update trial.");
    } finally {
      setAdminSaving(false);
    }
  };

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

      {isAdmin ? (
        <section className="rounded-lg border border-emerald-400/50 bg-emerald-50 p-4 dark:border-emerald-400/40 dark:bg-emerald-500/10">
          <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
            Admin access enabled
          </p>
          <p className="mt-1 text-sm text-emerald-900/75 dark:text-emerald-100/70">
            This account has full access without subscription.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-indigo-300/70 bg-indigo-50 p-4 dark:border-indigo-400/30 dark:bg-indigo-500/10">
          <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">
            Use this email on the WayForPay payment page
          </p>
          <p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-100/75">
            Email: <span className="font-semibold">{billing?.email ?? user?.email ?? "—"}</span>
          </p>
          <p className="mt-2 text-xs leading-5 text-indigo-900/70 dark:text-indigo-100/60">
            After payment, access is activated automatically when WayForPay sends the callback with the same email.
          </p>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Admin trial controls
            </h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px_auto]">
            <input
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="user@email.com"
              type="email"
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
            <select
              value={adminMode}
              onChange={(event) =>
                setAdminMode(event.target.value as "expired" | "hours" | "days")
              }
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="expired">Expire now</option>
              <option value="hours">Add hours</option>
              <option value="days">Add days</option>
            </select>
            <input
              value={adminAmount}
              onChange={(event) => setAdminAmount(event.target.value)}
              type="number"
              min="0.1"
              step="0.1"
              disabled={adminMode === "expired"}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
            <Button
              onClick={handleAdminTrialUpdate}
              disabled={adminSaving || !adminEmail.trim()}
            >
              {adminSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              Apply
            </Button>
          </div>

          {adminResult && (
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
              <span className="font-medium text-zinc-950 dark:text-white">
                {adminResult.email ?? adminEmail}
              </span>
              {" · "}
              {adminResult.plan.paymentRequired ? "Trial ended" : "Trial active"}
              {" · ends "}
              {formatDate(adminResult.plan.trialEndsAt)}
            </div>
          )}
        </section>
      )}

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
            {billing?.usage.aiRequests ?? 0} /{" "}
            {isAdmin ? "Unlimited" : billing?.plan.aiRequestsPerMonth ?? 0}
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
            Limit: {isAdmin ? "Unlimited" : formatBytes(billing?.plan.storageBytes ?? 0)}
          </p>
        </div>
      </section>

      {!isAdmin && (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                WayForPay subscription
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Choose Starter or Pro in the embedded payment page below.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href={wayforpayUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open page
              </a>
            </Button>
          </div>
          <iframe
            title="WayForPay subscription payment"
            src={wayforpayUrl}
            className="h-[760px] w-full bg-white"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </section>
      )}
    </div>
  );
}
