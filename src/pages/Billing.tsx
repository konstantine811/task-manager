import { Button } from "@/components/ui/button";
import {
  fetchAdminBillingUsers,
  fetchBillingMe,
  updateUserTrial,
} from "@/services/billing/proxy-client";
import type {
  AdminBillingUser,
  BillingMeResponse,
} from "@/services/billing/proxy-client";
import { useAuth } from "@/hooks/useAuth";
import { trackAppEvent } from "@/lib/telemetry";
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

const adminUserStatusLabel = (user: AdminBillingUser) => {
  if (user.status === "admin") return "Адмін";
  if (user.status === "paid-active") return "Оплачено";
  if (user.status === "trial-active") return "Пробний";
  return "Завершено";
};

const adminUserStatusClass = (user: AdminBillingUser) => {
  if (user.status === "paid-active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }
  if (user.status === "admin") {
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200";
  }
  if (user.status === "trial-active") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200";
  }
  return "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300";
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
  const [adminUsers, setAdminUsers] = useState<AdminBillingUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const wayforpayUrl = import.meta.env.VITE_WAYFORPAY_SUBSCRIPTION_URL?.trim();
  const isAdmin = Boolean(billing?.plan.adminAccess);
  const activePaidCount = adminUsers.filter(
    (adminUser) => adminUser.status === "paid-active",
  ).length;

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

  const loadAdminUsers = async () => {
    if (!user || !isAdmin) return;

    setAdminUsersLoading(true);
    setAdminUsersError(null);
    try {
      const result = await fetchAdminBillingUsers(user);
      setAdminUsers(result.users);
    } catch (err) {
      setAdminUsersError(
        err instanceof Error
          ? err.message
          : "Не вдалося завантажити список підписок.",
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadAdminUsers();
    } else {
      setAdminUsers([]);
      setAdminUsersError(null);
    }
  }, [isAdmin, user]);

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
      void loadAdminUsers();
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Керування пробним періодом
            </h2>
            </div>
            <Button
              variant="outline"
              onClick={loadAdminUsers}
              disabled={adminUsersLoading}
            >
              {adminUsersLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Оновити список
            </Button>
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

      {isAdmin && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Підписки користувачів
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Усього записів: {adminUsers.length} · активних оплат: {activePaidCount}
              </p>
            </div>
          </div>

          {adminUsersError && (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {adminUsersError}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
                <tr>
                  <th className="py-2 pr-4 font-medium">Користувач</th>
                  <th className="py-2 pr-4 font-medium">Статус</th>
                  <th className="py-2 pr-4 font-medium">Тариф</th>
                  <th className="py-2 pr-4 font-medium">Оплачено до</th>
                  <th className="py-2 pr-4 font-medium">Trial до</th>
                  <th className="py-2 pr-4 font-medium">Провайдер</th>
                  <th className="py-2 font-medium">Оновлено</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {adminUsersLoading && adminUsers.length === 0 ? (
                  <tr>
                    <td className="py-4 text-zinc-600 dark:text-zinc-400" colSpan={7}>
                      Завантаження...
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td className="py-4 text-zinc-600 dark:text-zinc-400" colSpan={7}>
                      Записів підписок поки немає.
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((adminUser) => (
                    <tr key={adminUser.userId}>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-zinc-950 dark:text-white">
                          {adminUser.email ?? "Без пошти"}
                        </div>
                        <div className="mt-0.5 max-w-[220px] truncate text-xs text-zinc-500">
                          {adminUser.userId}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${adminUserStatusClass(adminUser)}`}>
                          {adminUserStatusLabel(adminUser)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                        {adminUser.plan.id}
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                        {formatDate(adminUser.plan.accessEndsAt)}
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                        {formatDate(adminUser.plan.trialEndsAt)}
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                        {adminUser.billingProvider ?? adminUser.subscriptionStatus ?? "—"}
                      </td>
                      <td className="py-3 text-zinc-700 dark:text-zinc-300">
                        {formatDate(adminUser.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
              <a
                href={wayforpayUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackAppEvent("payment_clicked", {
                    source: "billing",
                    plan: billing?.plan.id,
                  })
                }
              >
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
