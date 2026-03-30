import { createStore } from "zustand/vanilla";
import { ItemTask } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";

export interface TaskManagerState {
  playingTask: ItemTask | null;
  startedAt: number | null;
  updatedTask: {
    id: UniqueIdentifier;
    timeDone: number;
  } | null;
  setPlayingTask: (task: ItemTask | null) => void;
  stopPlayingTask: () => void;
  updateTaskTime: (taskId: UniqueIdentifier, timeDone: number) => void;
  /** Board registers latest `timeDone` from React state so stop/switch uses current base after props sync. */
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
    updatedTask: null,

    setPlayingTimeDoneResolver: (fn) => {
      playingTimeDoneResolver = fn;
    },

    setPlayingTask: (task) => {
      const now = Date.now();
      const prev = get().playingTask;
      const startedAt = get().startedAt;
      if (prev && startedAt) {
        const elapsed = Math.floor((now - startedAt) / 1000);
        set({ playingTask: task, startedAt: now });

        if (prev.id !== task?.id) {
          const base =
            playingTimeDoneResolver?.(prev.id) ?? prev.timeDone;
          get().updateTaskTime(prev.id, base + elapsed);
        }
      } else {
        set({ playingTask: task, startedAt: now });
      }
    },

    stopPlayingTask: () => {
      const now = Date.now();
      const playing = get().playingTask;
      const startedAt = get().startedAt;

      if (playing && startedAt) {
        const elapsed = Math.floor((now - startedAt) / 1000);
        const base =
          playingTimeDoneResolver?.(playing.id) ?? playing.timeDone;
        get().updateTaskTime(playing.id, base + elapsed);
      }

      set({ playingTask: null, startedAt: null });
    },

    updateTaskTime: (taskId, newTimeDone) => {
      set({ updatedTask: { id: taskId, timeDone: newTimeDone } });
    },
  }));
};
