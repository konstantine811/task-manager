import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import { useHoverStore } from "@/storage/hoverStore";
import { DayNumber, ItemTask, Priority } from "@/types/drag-and-drop.model";
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
import LabelCheckData from "../ui-abc/dialog/task/label-check-data";
import LabelTooltip from "../ui-abc/dialog/task/label-tooltip";
import Dialog from "@/components/ui-abc/dialog/dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";

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
  const weekDays = Array.from({ length: 7 }, (_, i) => i + 1) as DayNumber[];
  const [selectedDays, setSelectedDays] = useState<DayNumber[]>(weekDays);
  const [title, setTitle] = useState<string>("");
  const [priority, setPriority] = useState<Priority>(Priority.LOW);
  const [time, setTime] = useState<number>(0);
  const [wastedTime, setWastedTime] = useState<number>(0);
  const [translateRandom, setTranslateRandom] = useState(1);
  const [isDetermined, setIsDetermined] = useState<boolean>(false);

  function toggleDay(day: DayNumber) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const handleCreateTask = () => {
    if (title.trim() === "") return;
    if (task) {
      onChangeTask(
        {
          ...task,
          title,
          priority,
          time,
          timeDone: wastedTime,
          whenDo: selectedDays,
          isDetermined,
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
        selectedDays,
        isDetermined
      );
      onChangeTask(newTask, containerId, false);
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
    setIsDetermined(false);
  }, [weekDays]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setTime(task.time);
      setWastedTime(task.timeDone);
      setSelectedDays(task.whenDo || []);
      setIsDetermined(task.isDetermined || false);
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
              <h3 className="text-2xl font-semibold break-words">
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
                  className="hover:bg-white/10 hover:text-zinc-200 rounded-full transition duration-200 text-zinc-400"
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
