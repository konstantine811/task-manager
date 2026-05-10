import type { SocialPriority, SocialProfile } from "@/services/firebase/social";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map, MapPin, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

const priorityLabel: Record<SocialPriority, string> = {
  low: "Низький",
  medium: "Середній",
  high: "Високий",
};

const defaultCenter: [number, number] = [30.5234, 50.4501];

const getInitials = (profile: SocialProfile) => {
  const source = profile.displayName || profile.email || "LF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function MarkerCard({ profile }: { profile: SocialProfile }) {
  const taskTitleLabel =
    profile.focusStatus === "У фокус-сесії"
      ? "Зараз виконує"
      : "Остання виконана";
  const activeTaskLabel =
    profile.showTaskTitle && profile.activeTaskTitle
      ? profile.activeTaskTitle
      : "Назва задачі прихована";

  return (
    <div className="w-56 rounded-lg border border-zinc-200 bg-white p-3 text-zinc-950 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-white">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-700 dark:text-indigo-200">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(profile)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.displayName}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{profile.city || "Online"}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {taskTitleLabel}
      </p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        {activeTaskLabel}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        {profile.focusStatus || "Не в фокус-сесії"}
      </p>
      <span className="mt-3 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
        {priorityLabel[profile.priority]}
      </span>
    </div>
  );
}

export function FocusMap({ profiles }: { profiles: SocialProfile[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Array<{ marker: mapboxgl.Marker; roots: Root[] }>>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

  const mappedProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          typeof profile.locationLng === "number" &&
          typeof profile.locationLat === "number",
      ),
    [profiles],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: mappedProfiles[0]
          ? [mappedProfiles[0].locationLng ?? defaultCenter[0], mappedProfiles[0].locationLat ?? defaultCenter[1]]
          : defaultCenter,
        zoom: mappedProfiles.length > 0 ? 9 : 3,
        attributionControl: false,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Mapbox map failed to initialize.");
    }

    return () => {
      markersRef.current.forEach(({ marker, roots }) => {
        marker.remove();
        roots.forEach((root) => root.unmount());
      });
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, mappedProfiles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(({ marker, roots }) => {
      marker.remove();
      roots.forEach((root) => root.unmount());
    });
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    for (const profile of mappedProfiles) {
      if (typeof profile.locationLng !== "number" || typeof profile.locationLat !== "number") {
        continue;
      }

      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className =
        "group flex -translate-y-4 flex-col items-center border-0 bg-transparent p-0 text-zinc-950 outline-none dark:text-white";

      const initialsElement = document.createElement("span");
      initialsElement.className =
        "mb-0.5 rounded-full border-2 border-white bg-indigo-500 px-2 py-0.5 text-[11px] font-black leading-none text-white shadow-lg";
      initialsElement.textContent = getInitials(profile).slice(0, 2);

      const iconElement = document.createElement("span");
      iconElement.className =
        "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-950 text-white shadow-lg transition-transform group-hover:scale-110 dark:bg-white dark:text-zinc-950";
      markerElement.appendChild(initialsElement);
      markerElement.appendChild(iconElement);

      const iconRoot = createRoot(iconElement);
      iconRoot.render(
        profile.photoURL ? (
          <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-4 w-4" />
        ),
      );

      const popupElement = document.createElement("div");
      const root = createRoot(popupElement);
      root.render(<MarkerCard profile={profile} />);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 26,
        className: "life-focus-map-popup",
      }).setDOMContent(popupElement);

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([profile.locationLng, profile.locationLat])
        .setPopup(popup)
        .addTo(map);

      const openPopup = () => popup.addTo(map);

      markerElement.addEventListener("mouseenter", openPopup);
      markerElement.addEventListener("mouseleave", () => popup.remove());
      markerElement.addEventListener("focus", openPopup);
      markerElement.addEventListener("blur", () => popup.remove());

      bounds.extend([profile.locationLng, profile.locationLat]);
      markersRef.current.push({ marker, roots: [iconRoot, root] });
    }

    if (mappedProfiles.length === 1) {
      map.easeTo({
        center: [
          mappedProfiles[0].locationLng ?? defaultCenter[0],
          mappedProfiles[0].locationLat ?? defaultCenter[1],
        ],
        zoom: 10,
      });
    } else if (mappedProfiles.length > 1) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  }, [mappedProfiles]);

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 px-6 text-center dark:border-white/15">
        <Map className="h-8 w-8 text-zinc-400" />
        <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-white">
          Mapbox token не налаштований
        </p>
        <p className="mt-1 max-w-md text-sm text-zinc-500">
          Додай `VITE_MAPBOX_TOKEN` у `.env`, перезапусти dev server, і тут
          з'явиться справжня Mapbox-мапа.
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-red-300 bg-red-50 px-6 text-center text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        <MapPin className="h-8 w-8" />
        <p className="mt-3 text-sm font-medium">Не вдалося завантажити Mapbox.</p>
        <p className="mt-1 max-w-md text-sm">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
      <div ref={mapContainerRef} className="h-[420px] w-full" />
      {mappedProfiles.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 px-6 text-center backdrop-blur-sm dark:bg-black/60">
          <div>
            <MapPin className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-white">
              Немає профілів із координатами
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Вкажи місто, збережи статус, і ми прив'яжемо профіль до приблизної
              точки через Mapbox geocoding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
