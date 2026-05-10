import { Button } from "@/components/ui/button";
import { FocusMap } from "@/components/social/FocusMap";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  type SocialPriority,
  type SocialProfile,
  type SocialVisibility,
  ensureSocialProfile,
  findPublicProfileByEmail,
  loadPublicMapProfiles,
  saveSocialProfile,
  sendFriendRequest,
} from "@/services/firebase/social";
import {
  Eye,
  Check,
  Loader2,
  Map,
  MapPin,
  Search,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { trackAppEvent } from "@/lib/telemetry";

const visibilityOptions: Array<{
  value: SocialVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Приватно",
    description: "Ніхто не бачить твій соціальний статус.",
  },
  {
    value: "friends",
    label: "Друзі",
    description: "Підготовлено для наступного етапу друзів.",
  },
  {
    value: "public",
    label: "Публічно",
    description: "Профіль можна знайти й показати на opt-in мапі.",
  },
];

const priorityOptions: Array<{ value: SocialPriority; label: string }> = [
  { value: "low", label: "Низький" },
  { value: "medium", label: "Середній" },
  { value: "high", label: "Високий" },
];

const priorityClass: Record<SocialPriority, string> = {
  low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  medium: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
};

const getPersistedSocialSignature = (profile: SocialProfile) =>
  JSON.stringify({
    displayName: profile.displayName.trim(),
    visibility: profile.visibility,
    showOnMap: profile.showOnMap,
    trackCurrentLocation: profile.trackCurrentLocation,
    city: profile.city.trim(),
    showTaskTitle: profile.showTaskTitle,
    locationLat: profile.locationLat ?? null,
    locationLng: profile.locationLng ?? null,
  });

function CompactSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-left transition-colors hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-950 dark:text-white">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-4 text-zinc-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-indigo-500 bg-indigo-500"
            : "border-zinc-300 bg-zinc-200 dark:border-white/15 dark:bg-zinc-800",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

const geocodeCity = async (
  city: string,
): Promise<{ lat: number; lng: number } | null> => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  const normalizedCity = city.trim();
  if (!mapboxToken || !normalizedCity) return null;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      normalizedCity,
    )}.json`,
  );
  url.searchParams.set("access_token", mapboxToken);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "uk,en");
  url.searchParams.set("types", "place,locality,region,country");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Mapbox не зміг знайти місто.");
  }

  const data = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };
  const center = data.features?.[0]?.center;
  if (!center) return null;

  return {
    lng: center[0],
    lat: center[1],
  };
};

export function SocialFocusSection({ showHeader = true }: { showHeader?: boolean }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [publicProfiles, setPublicProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SocialProfile | null>(null);
  const lastSavedSignatureRef = useRef<string | null>(null);
  const hydratedProfileRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    Promise.all([ensureSocialProfile(user), loadPublicMapProfiles()])
      .then(([ownProfile, mapProfiles]) => {
        if (cancelled) return;
        lastSavedSignatureRef.current = getPersistedSocialSignature(ownProfile);
        hydratedProfileRef.current = true;
        setProfile(ownProfile);
        setPublicProfiles(mapProfiles.filter((item) => item.uid !== user.uid));
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Не вдалося завантажити соціум.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const canAppearOnMap = profile?.visibility === "public" && profile.showOnMap;
  const taskTitleLabel =
    profile?.focusStatus === "У фокус-сесії"
      ? "Активна задача"
      : "Остання виконана задача";

  const visibleMapProfiles = useMemo(() => {
    if (!profile || !canAppearOnMap) return publicProfiles;
    return [profile, ...publicProfiles.filter((item) => item.uid !== profile.uid)];
  }, [canAppearOnMap, profile, publicProfiles]);

  const updateProfileField = <K extends keyof SocialProfile>(
    key: K,
    value: SocialProfile[K],
  ) => {
    if (key === "visibility" && value === "public") {
      trackAppEvent("social_enabled", { source: "visibility" });
    }
    if (key === "showOnMap" && value === true) {
      trackAppEvent("map_enabled", { source: "show_on_map" });
    }
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateProfileCity = (city: string) => {
    setProfile((current) =>
      current
        ? {
            ...current,
            city,
            locationLat: null,
            locationLng: null,
          }
        : current,
    );
  };

  const handleTrackCurrentLocationChange = (enabled: boolean) => {
    if (enabled) {
      trackAppEvent("map_enabled", { source: "current_location" });
    }
    setProfile((current) =>
      current
        ? {
            ...current,
            trackCurrentLocation: enabled,
            locationLat: enabled ? current.locationLat : null,
            locationLng: enabled ? current.locationLng : null,
          }
        : current,
    );
  };

  const resolveCurrentLocation = async (targetProfile: SocialProfile): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    if (!targetProfile.trackCurrentLocation) return null;
    if (!("geolocation" in navigator)) {
      throw new Error("Геолокація не підтримується цим браузером.");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => reject(new Error("Не вдалося отримати поточне положення.")),
        {
          enableHighAccuracy: false,
          maximumAge: 5 * 60 * 1000,
          timeout: 10_000,
        },
      );
    });
  };

  const saveProfileSnapshot = async (nextProfile: SocialProfile) => {
    if (!user) return;

    const requestedSignature = getPersistedSocialSignature(nextProfile);
    setSaving(true);
    try {
      const nextLocation =
        (await resolveCurrentLocation(nextProfile)) ??
        (nextProfile.city.trim() ? await geocodeCity(nextProfile.city) : null);
      const savedProfile = {
        ...nextProfile,
        displayName: nextProfile.displayName.trim(),
        city: nextProfile.city.trim(),
        locationLat: nextLocation?.lat ?? nextProfile.locationLat ?? null,
        locationLng: nextLocation?.lng ?? nextProfile.locationLng ?? null,
      };
      await saveSocialProfile(user, {
        displayName: savedProfile.displayName,
        visibility: savedProfile.visibility,
        showOnMap: savedProfile.showOnMap,
        trackCurrentLocation: savedProfile.trackCurrentLocation,
        city: savedProfile.city,
        showTaskTitle: savedProfile.showTaskTitle,
        locationLat: savedProfile.locationLat,
        locationLng: savedProfile.locationLng,
      });
      lastSavedSignatureRef.current = getPersistedSocialSignature(savedProfile);
      setProfile((current) =>
        current && getPersistedSocialSignature(current) === requestedSignature
          ? {
              ...current,
              displayName: savedProfile.displayName,
              city: savedProfile.city,
              trackCurrentLocation: savedProfile.trackCurrentLocation,
              locationLat: savedProfile.locationLat,
              locationLng: savedProfile.locationLng,
            }
          : current,
      );
      setPublicProfiles(await loadPublicMapProfiles());
      setSavedOnce(true);
      trackAppEvent("social_profile_updated", {
        visibility: savedProfile.visibility,
        show_on_map: savedProfile.showOnMap,
        tracks_location: savedProfile.trackCurrentLocation,
        shows_task_title: savedProfile.showTaskTitle,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося оновити соціальний профіль.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!profile || !hydratedProfileRef.current) return;

    const signature = getPersistedSocialSignature(profile);
    if (signature === lastSavedSignatureRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void saveProfileSnapshot(profile);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [profile, user]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setSearchResult(null);
    try {
      const result = await findPublicProfileByEmail(searchEmail);
      setSearchResult(result);
      if (!result) {
        toast("Користувача не знайдено або профіль приватний.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося знайти користувача.");
    } finally {
      setSearching(false);
    }
  };

  const handleFriendRequest = async (target: SocialProfile) => {
    if (!user) return;
    try {
      await sendFriendRequest(user, target);
      toast.success("Запит у друзі відправлено.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося відправити запит.");
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        showHeader && "mx-auto max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8",
      )}
    >
      {showHeader && (
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-white/10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
              <Users className="h-3.5 w-3.5" />
              Social Focus MVP
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Соціум
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Перший безпечний шар соціальності: opt-in профіль, статус фокусу,
              приблизна локація, публічна мапа та запити в друзі.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
            {saving ? "Збереження..." : savedOnce ? "Збережено" : "Автозбереження"}
          </div>
        </div>
      )}

      {!showHeader && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  Social Focus
                </h2>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Видимість, приблизна локація, статус фокусу та opt-in мапа.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
              {saving ? "Збереження..." : savedOnce ? "Збережено" : "Автозбереження"}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Видимість
            </h2>
          </div>
          <div className="mt-4 grid rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-3">
            {visibilityOptions.map((option) => {
              const active = profile.visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateProfileField("visibility", option.value)}
                  className={cn(
                    "rounded-[5px] px-3 py-2 text-left transition-colors",
                    active
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      active && "text-white",
                    )}
                  >
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-4",
                      active ? "text-indigo-50" : "text-zinc-500",
                    )}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2">
            <CompactSwitch
              checked={profile.showOnMap}
              onChange={(checked) => updateProfileField("showOnMap", checked)}
              label="Показувати на мапі"
              description="Працює тільки для публічного профілю."
            />
            <CompactSwitch
              checked={profile.trackCurrentLocation}
              onChange={handleTrackCurrentLocationChange}
              label="Відстежувати поточне положення"
              description="Оновлює приблизні координати через браузер."
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Мій соціальний профіль
            </h2>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Ім'я
              </span>
              <input
                value={profile.displayName}
                onChange={(event) => updateProfileField("displayName", event.target.value)}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Місто або зона
              </span>
              <input
                value={profile.city}
                onChange={(event) => updateProfileCity(event.target.value)}
                placeholder="Київ, Варшава, Online"
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Статус фокусу
              </span>
              <input
                value={profile.focusStatus}
                readOnly
                className="h-10 rounded-md border border-zinc-300 bg-zinc-50 px-3 outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <span className="text-xs text-zinc-500">
                Оновлюється автоматично з таймера або останньої виконаної задачі.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {taskTitleLabel}
              </span>
              <input
                value={profile.activeTaskTitle}
                readOnly
                placeholder="З'явиться після запуску таймера або виконання задачі"
                className="h-10 rounded-md border border-zinc-300 bg-zinc-50 px-3 outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Пріоритет
              </span>
              <span
                className={cn(
                  "inline-flex h-10 w-fit items-center rounded-full border px-3 text-sm font-medium",
                  priorityClass[profile.priority],
                )}
              >
                {priorityOptions.find((option) => option.value === profile.priority)?.label}
              </span>
            </div>
          </div>

          <div className="mt-4 max-w-md">
            <CompactSwitch
              checked={profile.showTaskTitle}
              onChange={(checked) => updateProfileField("showTaskTitle", checked)}
              label="Показувати назву активної задачі іншим"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Opt-in мапа фокусу
            </h2>
          </div>
          <div className="mt-4">
            <FocusMap profiles={visibleMapProfiles} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Знайти друга
            </h2>
          </div>
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <input
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
              type="email"
              placeholder="friend@email.com"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
            <Button type="submit" disabled={searching}>
              {searching ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </form>

          {searchResult && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950 dark:text-white">
                    {searchResult.displayName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {searchResult.email}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {searchResult.focusStatus}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFriendRequest(searchResult)}
                  disabled={searchResult.uid === user?.uid}
                >
                  <UserPlus />
                  Додати
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm text-indigo-950 dark:text-indigo-100">
            <div className="flex gap-2">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                На цьому етапі пошук працює тільки по публічних профілях. Це
                навмисно: соціальні функції мають стартувати з приватності, а не
                з відкритості за замовчуванням.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Social() {
  return <SocialFocusSection />;
}
