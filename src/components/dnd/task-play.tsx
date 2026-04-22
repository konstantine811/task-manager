import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import { ItemTask } from "@/types/drag-and-drop.model";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { Pause, Play } from "lucide-react";
import TaskLocalTime from "./task-local-time";
import { useTranslation } from "react-i18next";
import TaskLocalTimeStatic from "./task-local-time-static";
import { useCallback, useEffect, useRef } from "react";
import { useTaskManager } from "./context/use-task-manger-context";
import { initializeSfx, playSfx } from "@/services/audio/sfx";
import { primeTaskMediaTransport } from "@/services/audio/task-media-transport";
import { useSoundEnabledStore } from "@/storage/soundEnabled";

const TaskPlay = ({
  task,
  onPlay,
  templated,
}: {
  task: ItemTask;
  onPlay: (status: boolean) => void;
  templated: boolean;
}) => {
  const playingTask = useTaskManager((s) => s.playingTask);
  const startedAt = useTaskManager((s) => s.startedAt);
  const setPlayingTask = useTaskManager((s) => s.setPlayingTask);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);
  const isSoundEnabled = useSoundEnabledStore((s) => s.isSoundEnabled);
  const [t] = useTranslation();
  const dingIntervalRef = useRef<number | null>(null);
  const hasPlayedPlannedDingRef = useRef(false);
  const prevLiveTimeRef = useRef(task.timeDone);

  const isPlaying = playingTask?.id === task.id;
  const displayTimeTooltip =
    task.timeDone > 0 || isPlaying
      ? t("task_manager.dialog_create_task.task.time.wasted_time")
      : t("task_manager.dialog_create_task.task.time.duration.label");

  const handleClick = () => {
    if (isPlaying) {
      stopPlayingTask();
    } else {
      void primeTaskMediaTransport().catch(() => undefined);
      setPlayingTask(task);
    }
  };

  const getLiveTimeDone = useCallback(() => {
    const baseTimeDone =
      playingTask?.id === task.id ? playingTask.timeDone : task.timeDone;
    if (!isPlaying || !startedAt) return baseTimeDone;
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return baseTimeDone + elapsed;
  }, [isPlaying, playingTask, startedAt, task.id, task.timeDone]);

  useEffect(() => {
    onPlay(isPlaying);
  }, [isPlaying, onPlay]);

  useEffect(() => {
    initializeSfx(["/sfx/ding.wav"]);
    return () => {
      if (dingIntervalRef.current !== null) {
        window.clearInterval(dingIntervalRef.current);
        dingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const currentLiveTime = getLiveTimeDone();
    prevLiveTimeRef.current = currentLiveTime;
    hasPlayedPlannedDingRef.current =
      task.time > 0 && currentLiveTime >= task.time;
  }, [getLiveTimeDone, task.time]);

  useEffect(() => {
    if (dingIntervalRef.current !== null) {
      window.clearInterval(dingIntervalRef.current);
      dingIntervalRef.current = null;
    }

    if (!isPlaying || task.time <= 0) return;

    dingIntervalRef.current = window.setInterval(() => {
      const plannedSeconds = task.time;
      if (plannedSeconds <= 0) return;

      const currentLiveTime = getLiveTimeDone();
      const previousLiveTime = prevLiveTimeRef.current;
      prevLiveTimeRef.current = currentLiveTime;

      const crossedPlannedTime =
        previousLiveTime < plannedSeconds && currentLiveTime >= plannedSeconds;
      if (!crossedPlannedTime || hasPlayedPlannedDingRef.current) return;

      hasPlayedPlannedDingRef.current = true;
      if (!isSoundEnabled) return;

      void playSfx("/sfx/ding.wav").catch(() => undefined);
    }, 300);

    return () => {
      if (dingIntervalRef.current !== null) {
        window.clearInterval(dingIntervalRef.current);
        dingIntervalRef.current = null;
      }
    };
  }, [getLiveTimeDone, isPlaying, isSoundEnabled, task.time]);

  return (
    <div className="flex items-center gap-2">
      {!templated && (
        <SoundHoverElement
          hoverTypeElement={SoundTypeElement.NONE}
          hoverStyleElement={
            task.isDone ? HoverStyleElement.none : HoverStyleElement.circle
          }
        >
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 rounded-md border border-zinc-300/80 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-300 hover:border-zinc-400/80 dark:hover:border-white/10 transition-colors ${
              task.isDone && "cursor-not-allowed opacity-40"
            }`}
            onClick={handleClick}
            disabled={task.isDone}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
        </SoundHoverElement>
      )}
      <div className="flex items-center gap-2">
        {task.isDetermined ? (
          <>
            {isPlaying ? (
              <TaskLocalTime
                outerTime={task.timeDone}
                isPlay={isPlaying}
                tooltipText={t(
                  "task_manager.dialog_create_task.task.time.wasted_time"
                )}
                className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
              />
            ) : (
              <TaskLocalTimeStatic
                timeInSeconds={task.timeDone}
                tooltipText={t(
                  "task_manager.dialog_create_task.task.time.wasted_time"
                )}
                className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
              />
            )}
            <span className="text-zinc-600 dark:text-zinc-500 text-[10px]">/</span>
            <TaskLocalTimeStatic
              timeInSeconds={task.time}
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.total_time"
              )}
              className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
            />
          </>
        ) : isPlaying ? (
          <TaskLocalTime
            outerTime={task.timeDone}
            isPlay={isPlaying}
            tooltipText={displayTimeTooltip}
            className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
          />
        ) : (
          <TaskLocalTimeStatic
            timeInSeconds={task.timeDone > 0 ? task.timeDone : task.time}
            tooltipText={displayTimeTooltip}
            className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
          />
        )}
      </div>
    </div>
  );
};

export default TaskPlay;
