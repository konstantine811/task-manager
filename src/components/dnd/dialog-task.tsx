import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import { useHoverStore } from "@/storage/hoverStore";
import { DayNumber, ItemTask, Priority, TaskGoalLink } from "@/types/drag-and-drop.model";
import type { ISODate, ScheduleRule } from "@/types/task-template.model";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { getRandomFromTo } from "@/utils/random";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPriorityClassByPrefix } from "./utils/dnd.utils";
import { TimePickerInputs } from "./time-picker-inputs";
import { UniqueIdentifier } from "@dnd-kit/core";
import { X } from "lucide-react";
import WrapperHoverElement from "../ui-abc/wrapper-hover-element";
import { createTask } from "./utils/createTask";
import TimePicker from "@/components/ui-abc/select/select-time";
import LabelTextArea from "../ui-abc/dialog/task/label-text-area";
import LabelSelectOption from "../ui-abc/dialog/task/label-select-option";
import LabelSelectWeek from "../ui-abc/dialog/task/label-select-week";
import { useGoalsStore } from "@/storage/goalsStore";
import LabelCheckData from "../ui-abc/dialog/task/label-check-data";
import LabelTooltip from "../ui-abc/dialog/task/label-tooltip";
import Dialog from "@/components/ui-abc/dialog/dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const weekDays = [1, 2, 3, 4, 5, 6, 7] as DayNumber[];

type ScheduleType = "weekdays" | "interval_days" | "times_per_week";

function toISODate(d: Date): ISODate {
  return format(d, "yyyy-MM-dd") as ISODate;
}

const DialogTask = ({
  onChangeTask,
  isOpen,
  setOpen,
  task,
  containerId,
  templated,
}: {
  isOpen: boolean;
  onChangeTask: (
    task: ItemTask,
    containerId: UniqueIdentifier | null,
    isEdit: boolean
  ) => void;
  setOpen: (open: boolean) => void;
  task?: ItemTask | null;
  containerId: UniqueIdentifier | null;
  templated: boolean;
}) => {
  const [t] = useTranslation();
  const setHover = useHoverStore((s) => s.setHover);
  const [selectedDays, setSelectedDays] = useState<DayNumber[]>(weekDays);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekdays");
  const [intervalEvery, setIntervalEvery] = useState(3);
  const [intervalAnchorDate, setIntervalAnchorDate] = useState<ISODate>(() =>
    toISODate(new Date())
  );
  const [timesPerWeek, setTimesPerWeek] = useState(2);
  const [title, setTitle] = useState<string>("");
  const [priority, setPriority] = useState<Priority>(Priority.LOW);
  const [time, setTime] = useState<number>(0);
  const [wastedTime, setWastedTime] = useState<number>(0);
  const [translateRandom, setTranslateRandom] = useState(1);
  const [isDetermined, setIsDetermined] = useState<boolean>(false);
  const [linkedGoalIds, setLinkedGoalIds] = useState<UniqueIdentifier[]>([]);
  // Джерело списку цілей: тільки Zustand store (persist key: chrono-goals). Показуємо лише активні — виконані (done) не пропонуємо для прив'язки.
  const goals = useGoalsStore((s) => s.goals).filter(
    (g) => g.status === "active" && g.id != null && g.title != null
  );


  function toggleDay(day: DayNumber) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  // Тільки цілі з поточного списку (active/done) — не зберігати посилання на видалені
  const validGoalIds = linkedGoalIds.filter((id) =>
    goals.some((g) => String(g.id) === String(id))
  );
  const goalLinks: TaskGoalLink[] | undefined =
    validGoalIds.length > 0
      ? validGoalIds.map((goalId) => ({
          goalId,
          impact: { type: "count" as const, value: 1 },
        }))
      : undefined;

  const buildSchedule = (): ScheduleRule => {
    switch (scheduleType) {
      case "interval_days":
        return {
          type: "interval_days",
          every: Math.max(1, intervalEvery),
          anchorDate: intervalAnchorDate,
        };
      case "times_per_week":
        return {
          type: "times_per_week",
          times: Math.max(1, Math.min(7, timesPerWeek)),
        };
      default:
        return { type: "weekdays", days: selectedDays };
    }
  };

  const handleCreateTask = () => {
    if (title.trim() === "") return;
    const schedule = buildSchedule();
    const whenDo: DayNumber[] =
      schedule.type === "weekdays" ? schedule.days : [1, 2, 3, 4, 5, 6, 7];
    if (task) {
      onChangeTask(
        {
          ...task,
          title,
          priority,
          time,
          timeDone: wastedTime,
          whenDo,
          isDetermined,
          goalLinks,
          schedule,
        },
        containerId,
        true
      );
    } else {
      const newTask = createTask(
        title,
        priority,
        time,
        false,
        wastedTime,
        whenDo,
        isDetermined
      );
      onChangeTask({ ...newTask, goalLinks, schedule }, containerId, false);
    }
    reset();
    setHover(false, null, HoverStyleElement.circle);
  };

  const reset = useCallback(() => {
    setTitle("");
    setPriority(Priority.LOW);
    setTime(0);
    setWastedTime(0);
    setSelectedDays(weekDays);
    setScheduleType("weekdays");
    setIntervalEvery(3);
    setIntervalAnchorDate(toISODate(new Date()));
    setTimesPerWeek(2);
    setIsDetermined(false);
    setLinkedGoalIds([]);
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setTime(task.time);
      setWastedTime(task.timeDone);
      setSelectedDays(task.whenDo?.length ? task.whenDo : weekDays);
      setIsDetermined(task.isDetermined || false);
      // Тільки активні цілі з поточного списку — видалені та done не показувати й не зберігати
      const storeGoals = useGoalsStore.getState().goals.filter(
        (g) => g.status === "active"
      );
      const currentGoalIds = new Set(storeGoals.map((g) => String(g.id)));
      setLinkedGoalIds(
        task.goalLinks
          ?.filter((l) => currentGoalIds.has(String(l.goalId)))
          .map((l) => l.goalId) ?? []
      );
      if (task.schedule) {
        if (task.schedule.type === "interval_days") {
          setScheduleType("interval_days");
          setIntervalEvery(task.schedule.every);
          setIntervalAnchorDate(task.schedule.anchorDate);
        } else if (task.schedule.type === "times_per_week") {
          setScheduleType("times_per_week");
          setTimesPerWeek(task.schedule.times);
        } else {
          setScheduleType("weekdays");
          setSelectedDays(
            task.schedule.type === "weekdays" ? task.schedule.days : weekDays
          );
        }
      } else {
        setScheduleType("weekdays");
      }
    }
  }, [task]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setTranslateRandom(getRandomFromTo(1, 4));
    setTimeout(() => {
      setHover(false, null, HoverStyleElement.circle);
    }, 100);
  }, [setHover, isOpen]);

  return (
    <Dialog isOpen={isOpen} setOpen={setOpen} className="p-4 md:p-6">
      <ScrollArea className="w-full h-full touch-auto overscroll-contain">
        <div className="flex flex-col gap-2 md:gap-4">
          <div className="relative">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold wrap-break-word">
                {t(`task_manager.dialog_create_task.${translateRandom}.title`)}
              </h3>
              <p className="chrono-dialog-description font-mono text-sm">
                {t(
                  `task_manager.dialog_create_task.${translateRandom}.description`
                )}
              </p>
            </div>
            <WrapperHoverElement>
              <SoundHoverElement
                className="absolute -top-4 -right-2 rounded-full"
                hoverTypeElement={SoundTypeElement.SELECT_2}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/10 rounded-full transition duration-200"
                  onClick={() => setOpen(false)}
                >
                  <X />
                </Button>
              </SoundHoverElement>
            </WrapperHoverElement>
          </div>
          <div className="grid gap-6 md:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4 sm:gap-4">
              <LabelTextArea
                id="task-title"
                label={t("task_manager.dialog_create_task.task.title.label")}
                placeholder={t(
                  "task_manager.dialog_create_task.task.title.description"
                )}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4 sm:gap-4">
              <LabelSelectOption<Priority>
                id="priority"
                label={"task_manager.dialog_create_task.task.priority.label"}
                options={Priority}
                value={priority}
                onChange={setPriority}
                prefixTranslationPath="task_manager.dialog_create_task.task.priority.options"
                classPrefixFunction={getPriorityClassByPrefix}
                placeholder={
                  "task_manager.dialog_create_task.task.priority.description"
                }
                selectLabel={
                  "task_manager.dialog_create_task.task.priority.description"
                }
              />
            </div>
            {task?.isPlanned ? (
              <>
                <div className="grid grid-cols-1 xs:grid-cols-4 items-start xs:items-center gap-2 md:gap-4 ">
                  <LabelTooltip
                    label={t(
                      "task_manager.dialog_create_task.task.time.determined.label"
                    )}
                    tooltip={t(
                      "task_manager.dialog_create_task.task.time.determined.description"
                    )}
                  >
                    <TimePicker
                      className="col-span-3"
                      onChange={(time) => {
                        setTime(time);
                      }}
                      time={task ? task.time : 0}
                    />
                  </LabelTooltip>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                  <LabelTooltip
                    label={t(
                      "task_manager.dialog_create_task.task.time.wasted.label"
                    )}
                    tooltip={t(
                      "task_manager.dialog_create_task.task.time.wasted.description"
                    )}
                  >
                    <TimePickerInputs
                      time={wastedTime}
                      onChange={(value) => {
                        setWastedTime(value);
                      }}
                    />
                  </LabelTooltip>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 md:gap-4">
                  <LabelCheckData
                    id="is_determined_task"
                    label={t(
                      "task_manager.dialog_create_task.task.time.is_determined_task"
                    )}
                    onCheckedChange={() => {
                      setIsDetermined((prev) => {
                        setTime(0);
                        setWastedTime(0);
                        return !prev;
                      });
                    }}
                    checked={isDetermined}
                  />
                </div>
                {isDetermined && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-2 md:gap-4">
                      <LabelTooltip
                        label={t(
                          "task_manager.dialog_create_task.task.time.determined.label"
                        )}
                        tooltip={t(
                          "task_manager.dialog_create_task.task.time.determined.description"
                        )}
                      >
                        <TimePicker
                          onChange={(time) => {
                            setTime(time);
                          }}
                          time={task ? task.time : 0}
                          className="col-span-3"
                        ></TimePicker>
                      </LabelTooltip>
                    </div>
                    {templated && (
                      <div className="grid grid-cols-4 items-center gap-2 md:gap-4">
                        <LabelTooltip
                          label={t(
                            "task_manager.dialog_create_task.task.time.wasted.label"
                          )}
                          tooltip={t(
                            "task_manager.dialog_create_task.task.time.wasted.description"
                          )}
                        >
                          <TimePickerInputs
                            time={wastedTime}
                            onChange={(value) => {
                              setWastedTime(value);
                            }}
                          />
                        </LabelTooltip>
                      </div>
                    )}
                  </>
                )}
                {!isDetermined && (
                  <div className="grid grid-cols-4 items-center gap-2 md:gap-4">
                    <LabelTooltip
                      label={t(
                        "task_manager.dialog_create_task.task.time.duration.label"
                      )}
                      tooltip={t(
                        "task_manager.dialog_create_task.task.time.duration.description"
                      )}
                    >
                      <TimePickerInputs
                        time={time}
                        onChange={(value) => {
                          setTime(value);
                        }}
                      />
                    </LabelTooltip>
                  </div>
                )}
                {task && !templated && (
                  <div className="grid grid-cols-4 items-center gap-2 md:gap-4">
                    <LabelTooltip
                      label={t(
                        "task_manager.dialog_create_task.task.time.wasted.label"
                      )}
                      tooltip={t(
                        "task_manager.dialog_create_task.task.time.wasted.description"
                      )}
                    >
                      <TimePickerInputs
                        time={wastedTime}
                        onChange={(value) => {
                          setWastedTime(value);
                        }}
                      />
                    </LabelTooltip>
                  </div>
                )}
              </>
            )}
          </div>
          {templated && (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2">
                <Label>
                  {t("task_manager.dialog_create_task.task.time.schedule_type.label")}
                </Label>
                <Select
                  value={scheduleType}
                  onValueChange={(v) => setScheduleType(v as ScheduleType)}
                >
                  <SelectTrigger className="col-span-3 chrono-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="chrono-select-content">
                    <SelectItem value="weekdays">
                      {t("task_manager.dialog_create_task.task.time.schedule_type.weekdays")}
                    </SelectItem>
                    <SelectItem value="interval_days">
                      {t("task_manager.dialog_create_task.task.time.schedule_type.interval_days")}
                    </SelectItem>
                    <SelectItem value="times_per_week">
                      {t("task_manager.dialog_create_task.task.time.schedule_type.times_per_week")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleType === "weekdays" && (
                <div className="grid grid-cols-4 items-center gap-2 md:gap-4">
                  <LabelSelectWeek
                    weekData={weekDays}
                    selectedDays={selectedDays}
                    label={"task_manager.dialog_create_task.task.time.when_day"}
                    prefixWeedDay={"task_manager.day_names"}
                    toggleDay={toggleDay}
                  />
                </div>
              )}
              {scheduleType === "interval_days" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0">
                      {t("task_manager.dialog_create_task.task.time.schedule_interval_every")}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={intervalEvery}
                      onChange={(e) =>
                        setIntervalEvery(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("task_manager.dialog_create_task.task.time.schedule_interval_days")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0">
                      {t("task_manager.dialog_create_task.task.time.schedule_interval_anchor")}
                    </Label>
                    <Input
                      type="date"
                      value={intervalAnchorDate}
                      onChange={(e) =>
                        setIntervalAnchorDate(e.target.value as ISODate)
                      }
                      className="w-40"
                    />
                  </div>
                </div>
              )}
              {scheduleType === "times_per_week" && (
                <div className="flex items-center gap-2">
                  <Label>
                    {t("task_manager.dialog_create_task.task.time.schedule_times_per_week")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={timesPerWeek}
                    onChange={(e) =>
                      setTimesPerWeek(
                        Math.max(1, Math.min(7, parseInt(e.target.value, 10) || 1))
                      )
                    }
                    className="w-20"
                  />
                </div>
              )}
            </div>
          )}
          {templated && (
            <div className="grid grid-cols-1 gap-2 md:gap-4">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-300">
                {t("task_manager.dialog_create_task.task.goal_link.label") || "Пов'язати з ціллю"}
              </p>
              {goals.length === 0 ? (
                <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-white/10 px-3 py-3 bg-zinc-50 dark:bg-white/[0.02]">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("goals.no_goals_hint")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="chrono-dialog-submit w-fit"
                    onClick={() =>
                      setTimeout(
                        () => useGoalsStore.getState().setGoalDialog(true, null),
                        0
                      )
                    }
                  >
                    {t("goals.create_goal")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {goals.map((g) => {
                    const isLinked = linkedGoalIds.some(
                      (id) => String(id) === String(g.id)
                    );
                    return (
                      <label
                        key={String(g.id)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-white/10 px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 data-checked:border-indigo-500/50 data-checked:bg-indigo-500/10"
                        data-checked={isLinked}
                      >
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={() =>
                            setLinkedGoalIds((prev) => {
                              if (isLinked) {
                                return prev.filter(
                                  (id) => String(id) !== String(g.id)
                                );
                              }
                              if (prev.some((id) => String(id) === String(g.id)))
                                return prev;
                              return [...prev, g.id];
                            })
                          }
                          className="rounded border-zinc-300 dark:border-white/20"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{g.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-1 justify-end">
            <SoundHoverElement
              animValue={0.98}
              hoverTypeElement={SoundTypeElement.LINK}
              hoverStyleElement={HoverStyleElement.none}
            >
              <Button
                onClick={() => {
                  handleCreateTask();
                }}
                disabled={title === ""}
                variant="outline"
                className="chrono-dialog-submit cursor-pointer"
              >
                {task ? t("task_manager.edit") : t("task_manager.add")}
              </Button>
            </SoundHoverElement>
          </div>
        </div>
      </ScrollArea>
    </Dialog>
  );
};

export default DialogTask;
