import { Button } from "@/components/ui/button";
import { ThemeType } from "@/config/theme-colors.config";
import { storage } from "@/config/firebase.config";
import { LocalStorageKey } from "@/config/local-storage.config";
import { ROUTES } from "@/config/routes";
import { paymentProviderName } from "@/config/legal";
import { useAuth } from "@/hooks/useAuth";
import { trackAppEvent } from "@/lib/telemetry";
import { LanguageType } from "@/i18n";
import { cn } from "@/lib/utils";
import { fetchBillingMe, type BillingMeResponse } from "@/services/billing/proxy-client";
import { usePushNotificationsStore } from "@/storage/pushNotifications";
import { useSoundEnabledStore } from "@/storage/soundEnabled";
import { useThemeStore } from "@/storage/themeStore";
import { updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Bell,
  Camera,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Save,
  Sun,
  UserCircle,
  Volume2,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { SocialFocusSection } from "@/pages/Social";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatAuthDate = (value?: string | null) => {
  if (!value) return "-";
  return formatDate(new Date(value).toISOString());
};

const formatBytes = (bytes?: number) => {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
  const source = name?.trim() || email?.trim() || "U";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const getPlanLabel = (billing: BillingMeResponse | null) => {
  if (!billing) return "Завантаження";
  if (billing.plan.adminAccess) return "Адмін-доступ";
  if (billing.plan.paymentRequired) return "Потрібна оплата";
  if (billing.plan.id === "free") return "Пробний доступ";
  return billing.plan.id === "starter" ? "Starter" : "Pro";
};

const pushStatusLabel = {
  idle: "Очікує дозволу",
  unsupported: "Не підтримується",
  permission_denied: "Дозвіл вимкнено",
  registered: "Увімкнено",
  error: "Потрібна перевірка",
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [, i18n] = useTranslation();
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const onSetTheme = useThemeStore((state) => state.onSetTheme);
  const isSoundEnabled = useSoundEnabledStore((state) => state.isSoundEnabled);
  const setSoundEnabled = useSoundEnabledStore((state) => state.setSoundEnabled);
  const pushStatus = usePushNotificationsStore((state) => state.status);
  const pushError = usePushNotificationsStore((state) => state.lastError);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL ?? "");
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  useEffect(() => {
    setPhotoUrl(user?.photoURL ?? "");
    setPhotoLoadFailed(false);
  }, [user?.photoURL]);

  useEffect(() => {
    let cancelled = false;

    if (!user) return;

    fetchBillingMe(user)
      .then((result) => {
        if (!cancelled) {
          setBilling(result);
          setBillingError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setBillingError(
            error instanceof Error ? error.message : "Не вдалося завантажити тариф.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const currentLanguage = useMemo(() => {
    return i18n.language === LanguageType.EN ? LanguageType.EN : LanguageType.UA;
  }, [i18n.language]);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim() || null,
      });
      toast.success("Профіль оновлено.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося оновити профіль.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLanguageChange = (language: LanguageType) => {
    localStorage.setItem(LocalStorageKey.lang, JSON.stringify(language));
    void i18n.changeLanguage(language);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Обери файл зображення.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Фото має бути до 5 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const avatarRef = ref(storage, `task-manager-life-focus/${user.uid}/profile/avatar`);
      await uploadBytes(avatarRef, file, {
        contentType: file.type,
        customMetadata: {
          owner: user.uid,
        },
      });
      const nextPhotoUrl = await getDownloadURL(avatarRef);
      await updateProfile(user, { photoURL: nextPhotoUrl });
      setPhotoUrl(nextPhotoUrl);
      setPhotoLoadFailed(false);
      toast.success("Фото оновлено.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося оновити фото.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    logout().then(() => navigate(ROUTES.HOME, { replace: true }));
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-white/10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xl font-semibold text-indigo-700 shadow-sm dark:text-indigo-100">
            {photoUrl && !photoLoadFailed ? (
              <img
                src={photoUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setPhotoLoadFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(user?.displayName, user?.email)
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-black/65 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
              aria-label="Змінити фото"
              title="Змінити фото"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Профіль
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Дані акаунта, налаштування інтерфейсу та швидкий доступ до тарифу.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut />
          Вийти
        </Button>
      </div>

      <section>
        <form
          onSubmit={handleProfileSave}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Особисті дані
            </h2>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Ім'я
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Як до тебе звертатися"
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </span>
              <div className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user?.email ?? "-"}</span>
              </div>
            </label>
          </div>

          <div className="mt-4 grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-zinc-500">Створено</p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {formatAuthDate(user?.metadata.creationTime)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Останній вхід</p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {formatAuthDate(user?.metadata.lastSignInTime)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="animate-spin" /> : <Save />}
              Зберегти
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            {selectedTheme === ThemeType.DARK ? (
              <Moon className="h-4 w-4 text-indigo-500" />
            ) : (
              <Sun className="h-4 w-4 text-indigo-500" />
            )}
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Тема
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { value: ThemeType.DARK, label: "Темна", icon: Moon },
              { value: ThemeType.LIGHT, label: "Світла", icon: Sun },
            ].map((item) => {
              const Icon = item.icon;
              const active = selectedTheme === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onSetTheme(item.value)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
                    active
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-100"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Мова
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { value: LanguageType.UA, label: "Українська" },
              { value: LanguageType.EN, label: "English" },
            ].map((item) => {
              const active = currentLanguage === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleLanguageChange(item.value)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
                    active
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-100"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
                  )}
                >
                  {active && <Check className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Звук
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundEnabled)}
            className={cn(
              "mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
              isSoundEnabled
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
            )}
          >
            <Volume2 className="h-4 w-4" />
            {isSoundEnabled ? "Увімкнено" : "Вимкнено"}
          </button>
        </section>
      </section>

      <SocialFocusSection showHeader={false} />

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Тариф і використання
              </h2>
            </div>
            <p className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-white">
              {getPlanLabel(billing)}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {billing?.email ?? user?.email ?? "-"}
            </p>
          </div>

          {billing?.plan.adminAccess ? (
            <Button asChild variant="outline">
              <Link to={ROUTES.BILLING}>
                <ExternalLink />
                Керувати користувачами
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <a
                href={ROUTES.BILLING}
                onClick={() =>
                  trackAppEvent("payment_clicked", {
                    source: "profile",
                    plan: billing?.plan.id,
                  })
                }
              >
                <ExternalLink />
                Оплатити
              </a>
            </Button>
          )}
        </div>

        {billingError && (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            {billingError}
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase text-zinc-500">Поточний план</p>
            <p className="mt-1 font-medium text-zinc-950 dark:text-white">
              {billing?.plan.id ?? "-"}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase text-zinc-500">Trial до</p>
            <p className="mt-1 font-medium text-zinc-950 dark:text-white">
              {formatDate(billing?.plan.trialEndsAt)}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase text-zinc-500">Оплачено до</p>
            <p className="mt-1 font-medium text-zinc-950 dark:text-white">
              {formatDate(billing?.plan.accessEndsAt)}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase text-zinc-500">Місяць</p>
            <p className="mt-1 font-medium text-zinc-950 dark:text-white">
              {billing?.usage.month ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                AI-запити
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {billing?.usage.aiRequests ?? 0} /{" "}
                {billing?.plan.adminAccess
                  ? "Безліміт"
                  : billing?.plan.aiRequestsPerMonth ?? 0}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                Сховище
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatBytes(billing?.usage.storageBytes)} /{" "}
                {billing?.plan.adminAccess
                  ? "Безліміт"
                  : formatBytes(billing?.plan.storageBytes)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          Оплата та відписка зараз проходять через {paymentProviderName}. Після завершення
          валідації мерчанта можна буде додати повне скасування підписки прямо тут.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-200">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Push-сповіщення
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Статус: {pushStatusLabel[pushStatus]}
              </p>
              {pushError && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  Деталі: {pushError}
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
              pushStatus === "registered"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300",
            )}
          >
            {pushStatusLabel[pushStatus]}
          </span>
        </div>
      </section>
    </div>
  );
}
