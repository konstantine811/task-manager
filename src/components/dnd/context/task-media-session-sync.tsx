import { useEffect, useMemo } from "react";
import {
  pauseTaskMediaTransport,
  playTaskMediaTransport,
} from "@/services/audio/task-media-transport";
import { useTaskManager } from "./use-task-manger-context";

const APP_TITLE = "Chrono // Керування часом";

const canUseMediaSession = (): boolean =>
  typeof navigator !== "undefined" &&
  "mediaSession" in navigator &&
  typeof window !== "undefined" &&
  "MediaMetadata" in window;

const setMediaActionHandler = (
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) => {
  if (!canUseMediaSession()) return;

  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Some browsers expose a partial Media Session API.
  }
};

export const TaskMediaSessionSync = () => {
  const playingTask = useTaskManager((s) => s.playingTask);
  const startedAt = useTaskManager((s) => s.startedAt);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);

  const livePositionSeconds = useMemo(() => {
    if (!playingTask) return 0;
    if (!startedAt) return playingTask.timeDone;

    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return playingTask.timeDone + elapsed;
  }, [playingTask, startedAt]);

  useEffect(() => {
    if (!canUseMediaSession()) return;

    if (!playingTask) {
      pauseTaskMediaTransport();
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      setMediaActionHandler("play", null);
      setMediaActionHandler("pause", null);
      setMediaActionHandler("stop", null);
      setMediaActionHandler("seekbackward", null);
      setMediaActionHandler("seekforward", null);
      setMediaActionHandler("previoustrack", null);
      setMediaActionHandler("nexttrack", null);
      return;
    }

    void playTaskMediaTransport().catch(() => undefined);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: playingTask.title || "Активна задача",
      artist: APP_TITLE,
      album: playingTask.isDetermined ? "Виконується зараз" : "Активний таймер",
      artwork: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";

    setMediaActionHandler("pause", () => {
      stopPlayingTask();
    });
    setMediaActionHandler("stop", () => {
      stopPlayingTask();
    });
    setMediaActionHandler("play", () => undefined);
    setMediaActionHandler("seekbackward", null);
    setMediaActionHandler("seekforward", null);
    setMediaActionHandler("previoustrack", null);
    setMediaActionHandler("nexttrack", null);
  }, [playingTask, stopPlayingTask]);

  useEffect(() => {
    if (!canUseMediaSession() || !playingTask) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;

    try {
      navigator.mediaSession.setPositionState({
        duration: playingTask.isDetermined && playingTask.time > 0
          ? playingTask.time
          : Math.max(livePositionSeconds, 1),
        playbackRate: 1,
        position: playingTask.isDetermined && playingTask.time > 0
          ? Math.min(livePositionSeconds, playingTask.time)
          : Math.max(livePositionSeconds, 0),
      });
    } catch {
      // Ignore unsupported position state.
    }
  }, [livePositionSeconds, playingTask]);

  useEffect(() => {
    if (!playingTask || !startedAt) return;

    const timerId = window.setInterval(() => {
      if (!canUseMediaSession() || typeof navigator.mediaSession.setPositionState !== "function") {
        return;
      }

      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const nextPosition = playingTask.timeDone + elapsed;

      try {
        navigator.mediaSession.setPositionState({
          duration: playingTask.isDetermined && playingTask.time > 0
            ? playingTask.time
            : Math.max(nextPosition, 1),
          playbackRate: 1,
          position: playingTask.isDetermined && playingTask.time > 0
            ? Math.min(nextPosition, playingTask.time)
            : Math.max(nextPosition, 0),
        });
      } catch {
        // Ignore unsupported position state.
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [playingTask, startedAt]);

  return null;
};
