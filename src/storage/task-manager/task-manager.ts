import { createStore } from "zustand/vanilla";
import { ItemTask } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";

export interface TaskTimerUpdatedTask {
  id: UniqueIdentifier;
  timeDone: number;
  /** Daily board ISO date this flush belongs to; null = current board / template */
  dayId: string | null;
}

export interface TaskManagerState {
  playingTask: ItemTask | null;
  startedAt: number | null;
  /** ISO yyyy-mm-dd for daily tasks — set when play starts */
  playingDayId: string | null;
  /** `task.timeDone` when current play session started (authoritative base for stop) */
  sessionBaseTimeDone: number | null;
  timerSyncSource: "local" | "remote" | null;
  updatedTask: TaskTimerUpdatedTask | null;
  setPlayingTask: (
    task: ItemTask | null,
    opts?: { dayId?: string | null },
  ) => void;
  stopPlayingTask: () => void;
  /** Stop timer UI without writing `updatedTask` (e.g. toggle-done merges time in-board) */
  clearPlayingSession: () => void;
  syncTimerFromRemote: (
    task: ItemTask | null,
    startedAt: number | null,
    dayId?: string | null,
  ) => void;
  updateTaskTime: (
    taskId: UniqueIdentifier,
    timeDone: number,
    dayId?: string | null,
  ) => void;
  setPlayingTimeDoneResolver: (
    fn: ((id: UniqueIdentifier) => number | undefined) | null,
  ) => void;
}

export const createTaskManagerStore = () => {
  let playingTimeDoneResolver:
    | ((id: UniqueIdentifier) => number | undefined)
    | null = null;

  return createStore<TaskManagerState>((set, get) => ({
    playingTask: null,
    startedAt: null,
    playingDayId: null,
    sessionBaseTimeDone: null,
    timerSyncSource: null,
    updatedTask: null,

    setPlayingTimeDoneResolver: (fn) => {
      playingTimeDoneResolver = fn;
    },

    clearPlayingSession: () => {
      set({
        playingTask: null,
        startedAt: null,
        playingDayId: null,
        sessionBaseTimeDone: null,
        timerSyncSource: "local",
      });
    },

    setPlayingTask: (task, opts) => {
      if (!task) {
        set({
          playingTask: null,
          startedAt: null,
          playingDayId: null,
          sessionBaseTimeDone: null,
          timerSyncSource: "local",
        });
        return;
      }
      const now = Date.now();
      const prev = get().playingTask;
      const prevStarted = get().startedAt;
      const prevDayId = get().playingDayId;

      const nextDayId =
        opts?.dayId !== undefined ? opts.dayId : prev ? prevDayId : null;

      if (prev && prevStarted) {
        const elapsed = Math.floor((now - prevStarted) / 1000);
        set({
          playingTask: task,
          startedAt: now,
          playingDayId: nextDayId,
          sessionBaseTimeDone: task.timeDone,
          timerSyncSource: "local",
        });

        if (prev.id !== task?.id) {
          const base =
            playingTimeDoneResolver?.(prev.id) ?? prev.timeDone;
          set({
            updatedTask: {
              id: prev.id,
              timeDone: base + elapsed,
              dayId: prevDayId,
            },
          });
        }
      } else {
        set({
          playingTask: task,
          startedAt: now,
          playingDayId: nextDayId,
          sessionBaseTimeDone: task.timeDone,
          timerSyncSource: "local",
        });
      }
    },

    stopPlayingTask: () => {
      const playing = get().playingTask;
      const startedAt = get().startedAt;
      const dayId = get().playingDayId;
      const sessionBase = get().sessionBaseTimeDone;

      if (playing && startedAt) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const baseFromSession =
          typeof sessionBase === "number" ? sessionBase : playing.timeDone;
        const next = Math.max(0, baseFromSession + elapsed);
        set({
          updatedTask: { id: playing.id, timeDone: next, dayId },
          playingTask: null,
          startedAt: null,
          playingDayId: null,
          sessionBaseTimeDone: null,
          timerSyncSource: "local",
        });
      } else {
        set({
          playingTask: null,
          startedAt: null,
          playingDayId: null,
          sessionBaseTimeDone: null,
          timerSyncSource: "local",
        });
      }
    },

    syncTimerFromRemote: (task, startedAt, dayId = null) => {
      set({
        playingTask: task,
        startedAt,
        playingDayId: dayId,
        sessionBaseTimeDone: task?.timeDone ?? null,
        timerSyncSource: "remote",
      });
    },

    updateTaskTime: (taskId, newTimeDone, dayId = null) => {
      set({ updatedTask: { id: taskId, timeDone: newTimeDone, dayId } });
    },
  }));
};
