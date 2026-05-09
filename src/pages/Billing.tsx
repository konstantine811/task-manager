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

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
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
  const wayforpayUrl = import.meta.env.VITE_WAYFORPAY_SUBSCRIPTION_URL?.trim();
  const isAdmin = Boolean(billing?.plan.adminAccess);

  const statusLabel = useMemo(() => {
    if (!billing) return "Завантаження";
    if (billing.plan.adminAccess) return "Адмін-доступ";
    if (billing.plan.paymentRequired) return "Пробний період завершено";
    if (billing.plan.id === "free") return "Пробний період активний";
    return `${billing.plan.id === "starter" ? "Starter" : "Pro"} активний`;
  }, [billing]);

  const loadBilling = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setBilling(await fetchBillingMe(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити дані підписки.");
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
      toast.error("Вкажи додатну тривалість.");
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
      toast.success("Пробний період оновлено.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не вдалося оновити пробний період.");
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
            Тариф Life Focus
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Підписка
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Керуй лімітами AI, сховищем і доступом через оплату WayForPay.
          </p>
        </div>
        <Button variant="outline" onClick={loadBilling} disabled={loading || !user}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Оновити
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
            Адмін-доступ увімкнено
          </p>
          <p className="mt-1 text-sm text-emerald-900/75 dark:text-emerald-100/70">
            Цей акаунт має повний доступ без підписки.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-indigo-300/70 bg-indigo-50 p-4 dark:border-indigo-400/30 dark:bg-indigo-500/10">
          <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">
            Використай цю пошту на сторінці оплати WayForPay
          </p>
          <p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-100/75">
            Пошта: <span className="font-semibold">{billing?.email ?? user?.email ?? "—"}</span>
          </p>
          <p className="mt-2 text-xs leading-5 text-indigo-900/70 dark:text-indigo-100/60">
            Після оплати доступ активується автоматично, коли WayForPay надішле підтвердження з тією самою поштою.
          </p>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Керування пробним періодом
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
              <option value="expired">Завершити зараз</option>
              <option value="hours">Додати години</option>
              <option value="days">Додати дні</option>
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
              Застосувати
            </Button>
          </div>

          {adminResult && (
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
              <span className="font-medium text-zinc-950 dark:text-white">
                {adminResult.email ?? adminEmail}
              </span>
              {" · "}
              {adminResult.plan.paymentRequired ? "Пробний період завершено" : "Пробний період активний"}
              {" · до "}
              {formatDate(adminResult.plan.trialEndsAt)}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Статус
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {statusLabel}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Пробний період до: {formatDate(billing?.plan.trialEndsAt ?? null)}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Оплачений доступ до: {formatDate(billing?.plan.accessEndsAt ?? null)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Використання AI
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {billing?.usage.aiRequests ?? 0} /{" "}
            {isAdmin ? "Безліміт" : billing?.plan.aiRequestsPerMonth ?? 0}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Поточний місяць: {billing?.usage.month ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Сховище
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
            {formatBytes(billing?.usage.storageBytes ?? 0)}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Ліміт: {isAdmin ? "Безліміт" : formatBytes(billing?.plan.storageBytes ?? 0)}
          </p>
        </div>
      </section>

      {!isAdmin && wayforpayUrl && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Підписка через WayForPay
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Оплата відкриється в окремій вкладці. На сторінці WayForPay обери Starter або Pro і вкажи пошту з цього акаунта.
              </p>
            </div>
            <Button asChild>
              <a href={wayforpayUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Перейти до оплати
              </a>
            </Button>
          </div>
        </section>
      )}

      {!isAdmin && !wayforpayUrl && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          URL сторінки оплати WayForPay не налаштований.
        </section>
      )}
    </div>
  );
}
