import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import { useHoverStore } from "@/storage/hoverStore";
import { ItemTask, Priority } from "@/types/drag-and-drop.model";
import type {
  DayNumber,
  ISODate,
  ScheduleRule,
} from "@/types/task-template.model";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPriorityClassByPrefix } from "../utils/dnd.utils";
import { TimePickerInputs } from "../time-picker-inputs";
import { UniqueIdentifier } from "@dnd-kit/core";
import { createTask } from "../utils/createTask";
import TimePicker from "@/components/ui-abc/select/select-time";
import LabelTextArea from "../../ui-abc/dialog/task/label-text-area";
import LabelSelectOption from "../../ui-abc/dialog/task/label-select-option";
import LabelSelectWeek from "../../ui-abc/dialog/task/label-select-week";
import LabelCheckData from "../../ui-abc/dialog/task/label-check-data";
import LabelTooltip from "../../ui-abc/dialog/task/label-tooltip";
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
import { WEEK_DAYS } from "@/config/data-config";
import DialogTaskHeader from "./dialog-task-header";
import DialogTaskIntro from "./dialog-task-intro";

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
    isEdit: boolean,
  ) => void;
  setOpen: (open: boolean) => void;
  task?: ItemTask | null;
  containerId: UniqueIdentifier | null;
  templated: boolean;
}) => {
  const [t] = useTranslation();
  const setHover = useHoverStore((s) => s.setHover);
  const [selectedDays, setSelectedDays] = useState<DayNumber[]>(WEEK_DAYS);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekdays");
  const [intervalEvery, setIntervalEvery] = useState(3);
  const [intervalAnchorDate, setIntervalAnchorDate] = useState<ISODate>(() =>
    toISODate(new Date()),
  );
  const [timesPerWeek, setTimesPerWeek] = useState(2);
  const [title, setTitle] = useState<string>("");
  const [priority, setPriority] = useState<Priority>(Priority.LOW);
  const [time, setTime] = useState<number>(0);
  const [wastedTime, setWastedTime] = useState<number>(0);
  const [isDetermined, setIsDetermined] = useState<boolean>(false);
  const isPlannedTask = Boolean(task?.isPlanned);
  const showActualSpentTimeField =
    Boolean(task) && !templated && !isPlannedTask && !isDetermined;

  function toggleDay(day: DayNumber) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

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
      schedule.type === "weekdays" ? schedule.days : WEEK_DAYS;
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
          schedule,
        },
        containerId,
        true,
      );
    } else {
      const newTask = createTask(
        title,
        priority,
        time,
        !templated && isDetermined,
        wastedTime,
        whenDo,
        isDetermined,
      );
      onChangeTask({ ...newTask, schedule }, containerId, false);
    }
    reset();
    setHover(false, null, HoverStyleElement.circle);
  };

  const reset = useCallback(() => {
    setTitle("");
    setPriority(Priority.LOW);
    setTime(0);
    setWastedTime(0);
    setSelectedDays(WEEK_DAYS);
    setScheduleType("weekdays");
    setIntervalEvery(3);
    setIntervalAnchorDate(toISODate(new Date()));
    setTimesPerWeek(2);
    setIsDetermined(false);
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setTime(task.time);
      setWastedTime(task.timeDone);
      setSelectedDays(task.whenDo?.length ? task.whenDo : WEEK_DAYS);
      setIsDetermined(task.isDetermined || false);
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
            task.schedule.type === "weekdays" ? task.schedule.days : WEEK_DAYS,
          );
        }
      } else {
        setScheduleType("weekdays");
      }
    }
  }, [task]);

  return (
    <DialogTaskHeader isOpen={isOpen} setOpen={setOpen}>
      <div className="w-full min-h-0 touch-auto touch-pan-y pr-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2 md:gap-4">
          <DialogTaskIntro />
          <div className="grid gap-6 md:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4 sm:gap-4">
              <LabelTextArea
                id="task-title"
                label={t("task_manager.dialog_create_task.task.title.label")}
                placeholder={t(
                  "task_manager.dialog_create_task.task.title.description",
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
            {isPlannedTask ? (
              <>
                <div className="grid grid-cols-1 xs:grid-cols-4 items-start xs:items-center gap-2 md:gap-4 ">
                  <LabelTooltip
                    label={t(
                      "task_manager.dialog_create_task.task.time.determined.label",
                    )}
                    tooltip={t(
                      "task_manager.dialog_create_task.task.time.determined.description",
                    )}
                  >
                    <TimePicker
                      className="col-span-3"
                      onChange={(time) => {
                        setTime(time);
                      }}
                      time={time}
                    />
                  </LabelTooltip>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                  <LabelTooltip
                    label={t(
                      "task_manager.dialog_create_task.task.time.wasted.label",
                    )}
                    tooltip={t(
                      "task_manager.dialog_create_task.task.time.wasted.description",
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
                      "task_manager.dialog_create_task.task.time.is_determined_task",
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
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                      <LabelTooltip
                        label={t(
                          "task_manager.dialog_create_task.task.time.determined.label",
                        )}
                        tooltip={t(
                          "task_manager.dialog_create_task.task.time.determined.description",
                        )}
                      >
                        <TimePicker
                          onChange={(time) => {
                            setTime(time);
                          }}
                          time={time}
                          className="col-span-3"
                        ></TimePicker>
                      </LabelTooltip>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                      <LabelTooltip
                        label={t(
                          task
                            ? "task_manager.dialog_create_task.task.time.wasted.label"
                            : "task_manager.dialog_create_task.task.time.duration.label",
                        )}
                        tooltip={t(
                          task
                            ? "task_manager.dialog_create_task.task.time.wasted.description"
                            : "task_manager.dialog_create_task.task.time.duration.description",
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
                )}
                {!isDetermined && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                    <LabelTooltip
                      label={t(
                        "task_manager.dialog_create_task.task.time.duration.label",
                      )}
                      tooltip={t(
                        "task_manager.dialog_create_task.task.time.duration.description",
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
                {showActualSpentTimeField && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                    <LabelTooltip
                      label={t(
                        "task_manager.dialog_create_task.task.time.wasted.label",
                      )}
                      tooltip={t(
                        "task_manager.dialog_create_task.task.time.wasted.description",
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
                  {t(
                    "task_manager.dialog_create_task.task.time.schedule_type.label",
                  )}
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
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_type.weekdays",
                      )}
                    </SelectItem>
                    <SelectItem value="interval_days">
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_type.interval_days",
                      )}
                    </SelectItem>
                    <SelectItem value="times_per_week">
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_type.times_per_week",
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleType === "weekdays" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 md:gap-4">
                  <LabelSelectWeek
                    weekData={WEEK_DAYS}
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
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_interval_every",
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={intervalEvery}
                      onChange={(e) =>
                        setIntervalEvery(
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_interval_days",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0">
                      {t(
                        "task_manager.dialog_create_task.task.time.schedule_interval_anchor",
                      )}
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
                    {t(
                      "task_manager.dialog_create_task.task.time.schedule_times_per_week",
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={timesPerWeek}
                    onChange={(e) =>
                      setTimesPerWeek(
                        Math.max(
                          1,
                          Math.min(7, parseInt(e.target.value, 10) || 1),
                        ),
                      )
                    }
                    className="w-20"
                  />
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
      </div>
    </DialogTaskHeader>
  );
};

export default DialogTask;
