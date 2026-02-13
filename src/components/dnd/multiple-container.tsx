import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CancelDrop,
  CollisionDetection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  Modifiers,
  UniqueIdentifier,
  useSensors,
  useSensor,
  MeasuringStrategy,
  KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  SortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { coordinateGetter as multipleContainersCoordinateGetter } from "./utils/multipleContainersKeyboardCoordinates";
import { RenderItemProps } from "./item";
import DroppableContainer from "./droppable-container";
import { GetItemStyles, Items, ItemTask } from "@/types/drag-and-drop.model";
import { PLACEHOLDER_ID, TRASH_ID } from "./config/dnd.config";
import useCollisionDectionStrategy from "./hooks/useCollisionDectionStrategy";
import { dropAnimation, getIndex } from "./utils/dnd.utils";
import useDrag from "./hooks/useDrag";
import SortableItem from "./sortable-item";
import Trash from "./trash";
import ContainerDragOverlay from "./container-drag-overlay";
import SortableItemDragOverlay from "./sortable-item-drag-overlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import DialogTask from "./dialog-task";
import SoundHoverElement from "../ui-abc/sound-hover-element";
import { Button } from "../ui/button";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { useTranslation } from "react-i18next";
import WrapperHoverElement from "../ui-abc/wrapper-hover-element";
import TaskTimer from "./task-timer";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { useTaskManager } from "./context/use-task-manger-context";
import { CATEGORY_OPTIONS } from "./config/category-options";
import useCategoryHandle from "./hooks/useCategoryHandle";
import DialogAgree from "../ui-abc/dialog/dialog-agree";
import { AddTasksWithAIDialog } from "@/components/ai/add-tasks-with-ai-dialog";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;
  containerStyle?: React.CSSProperties;
  coordinateGetter?: KeyboardCoordinateGetter;
  getItemStyles?: GetItemStyles;
  wrapperStyle?(args: { index: number }): React.CSSProperties;
  itemCount?: number;
  items: Items;
  handle?: boolean;
  renderItem?: (args: RenderItemProps) => React.ReactElement;
  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
  templated?: boolean;
  testedCount?: number;
  onChangeTasks: (items: Items) => void;
  onEditPlannedTask?: (task: ItemTask) => void;
  onDeletePlannedTask?: (taskId: UniqueIdentifier) => void;
}

export function MultipleContainers({
  adjustScale = false,
  cancelDrop,
  columns,
  handle = false,
  items: initialItems,
  containerStyle,
  coordinateGetter = multipleContainersCoordinateGetter,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  strategy = verticalListSortingStrategy,
  trashable = false,
  vertical = false,
  templated = true,
  scrollable,
  onChangeTasks = () => {},
  onEditPlannedTask,
  onDeletePlannedTask,
}: Props) {
  const [t] = useTranslation();
  const [items, setItems] = useState<Items>(initialItems);
  const sH = useHeaderSizeStore((s) => s.size);

  const [containers, setContainers] = useState<UniqueIdentifier[]>(
    items.map((cat) => cat.id)
  );
  const playingTask = useTaskManager((s) => s.playingTask);
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  const [addTaskContainerId, setAddTaskContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [editTask, setEditTask] = useState<ItemTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;
  const taskTimeDone = useTaskManager((s) => s.updatedTask);
  const [isOpenAgreeDialog, setIsOpenAgreeDialog] = useState(false);
  const [removeContainerId, setRemoveContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiDialogContainerId, setAiDialogContainerId] =
    useState<UniqueIdentifier | null>(null);
  const lastUpdatedTaskRef = useRef<UniqueIdentifier | null>(null);
  const collisionDetectionStrategy: CollisionDetection =
    useCollisionDectionStrategy({
      activeId,
      items,
      lastOverId,
      recentlyMovedToNewContainer,
    });

  const { onDragOver, onDragEnd, onDragCancel, onDragStart } = useDrag({
    items,
    setItems,
    recentlyMovedToNewContainer,
    setActiveId,
    activeId,
    onDeletePlannedTask,
    onChangeTasks,
  });

  const { handleAddColumn, handleRemove } = useCategoryHandle({
    items,
    setItems,
    setContainers,
    activeId,
    onDeletePlannedTask,
    onChangeTasks,
  });
  const updateTaskTime = useCallback(
    (taskId: UniqueIdentifier, newTimeDone: number) => {
      setItems((prev) => {
        const updated = prev.map((container) => ({
          ...container,
          tasks: container.tasks.map((task) =>
            task.id === taskId ? { ...task, timeDone: newTimeDone } : task
          ),
        }));
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks]
  );

  useEffect(() => {
    if (taskTimeDone && taskTimeDone.id !== lastUpdatedTaskRef.current) {
      updateTaskTime(taskTimeDone.id, taskTimeDone.timeDone);
      lastUpdatedTaskRef.current = taskTimeDone.id;
    }
  }, [taskTimeDone, updateTaskTime]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  const handleToggleTask = useCallback(
    (taskId: UniqueIdentifier, newIsDone: boolean) => {
      setItems((prevItems) => {
        const updated = prevItems.map((container) => ({
          ...container,
          tasks: container.tasks.map((t) => {
            if (t.id === taskId) {
              const updated = { ...t, isDone: newIsDone };
              if (updated.isPlanned || updated.isDetermined) {
                onEditPlannedTask?.(updated);
              }
              return updated;
            } else {
              // Якщо це не той таск, то просто повертаємо його без змін
              return t;
            }
          }),
        }));
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks, onEditPlannedTask]
  );

  const handleAddTask = useCallback(
    (newTask: ItemTask, id: UniqueIdentifier) => {
      if (!setItems) return;
      setItems((prev) => {
        const updated = prev.map((category) =>
          category.id === id
            ? { ...category, tasks: [...category.tasks, newTask] }
            : category
        );
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks]
  );

  const handleAddTasks = useCallback(
    (newTasks: ItemTask[], id: UniqueIdentifier) => {
      if (!setItems || newTasks.length === 0) return;
      setItems((prev) => {
        const updated = prev.map((category) =>
          category.id === id
            ? { ...category, tasks: [...category.tasks, ...newTasks] }
            : category
        );
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks]
  );

  const handleEditTask = useCallback(
    (editTask: ItemTask, containerId: UniqueIdentifier) => {
      if (onEditPlannedTask && editTask.isPlanned) {
        onEditPlannedTask(editTask);
      }
      setItems((prevItems) => {
        const updated = prevItems.map((container) => {
          if (container.id === containerId) {
            return {
              ...container,
              tasks: container.tasks.map((task) =>
                task.id === editTask.id ? { ...editTask } : task
              ),
            };
          }
          return container;
        });
        onChangeTasks(updated);
        return updated;
      });
    },
    [onEditPlannedTask, onChangeTasks]
  );

  const handleChangeCategory = useCallback(
    (value: string, id: UniqueIdentifier) => {
      setItems((prev) => {
        const updated = prev.map((cat) =>
          cat.id === id ? { ...cat, title: value } : cat
        );
        onChangeTasks(updated);
        return updated;
      });
      setContainers((prev) =>
        prev.map(
          (containerId) => (id === id ? id : containerId) // ❗️не міняємо ID, просто оновили title вже в items
        )
      );
    },
    [onChangeTasks]
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  return (
    <>
      {aiDialogContainerId && (
        <AddTasksWithAIDialog
          isOpen={isAiDialogOpen}
          onClose={() => {
            setIsAiDialogOpen(false);
            setAiDialogContainerId(null);
          }}
          onAddTasks={handleAddTasks}
          containerId={aiDialogContainerId}
        />
      )}
      <DialogAgree
        isOpen={isOpenAgreeDialog}
        setIsOpen={setIsOpenAgreeDialog}
        title={t("task_manager.dialog_category.delete.title")}
        description={t("task_manager.dialog_category.delete.description")}
        buttonYesTitle={t("task_manager.dialog_category.delete.yes")}
        buttonNoTitle={t("task_manager.dialog_category.delete.no")}
        onAgree={(status) => {
          setIsOpenAgreeDialog(false);
          if (status && removeContainerId) {
            handleRemove(removeContainerId);
          }
        }}
      ></DialogAgree>
      <DialogTask
        key={editTask?.id ?? "new-task"}
        isOpen={isDialogOpen}
        containerId={addTaskContainerId}
        task={editTask}
        templated={templated}
        onChangeTask={(task, containerId, isEdit) => {
          if (!containerId) {
            console.error("Container ID is required for task operations.");
            return;
          }
          if (isEdit) {
            handleEditTask(task, containerId);
          } else if (containerId) {
            handleAddTask(task, containerId);
          }
          setIsDialogOpen(false);
          setAddTaskContainerId(null);
          setEditTask(null);
        }}
        setOpen={(status) => {
          setAddTaskContainerId(null);
          setEditTask(null);
          setIsDialogOpen(status);
        }}
      />
      <AnimatePresence>
        {!templated && playingTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "60px" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ top: sH }}
            className="sticky flex h-[60px] justify-center items-center z-30 bg-background/50 backdrop-blur-xs"
          >
            <TaskTimer />
          </motion.div>
        )}
      </AnimatePresence>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={({ active }) => {
          onDragStart(active);
        }}
        onDragOver={({ active, over }) => {
          return onDragOver(active, over);
        }}
        onDragEnd={({ active, over }) => {
          return onDragEnd(active, over);
        }}
        cancelDrop={cancelDrop}
        onDragCancel={onDragCancel}
        modifiers={modifiers}
      >
        <div className={`${templated && "mt-5"}`}>
          <SortableContext
            items={[...containers, PLACEHOLDER_ID]}
            strategy={
              vertical
                ? verticalListSortingStrategy
                : horizontalListSortingStrategy
            }
          >
            {items.map((category) => (
              <DroppableContainer
                key={category.id}
                id={category.id}
                templated={templated}
                label={minimal ? undefined : category.title}
                columns={columns}
                items={category.tasks}
                scrollable={scrollable}
                style={containerStyle}
                options={CATEGORY_OPTIONS}
                onAddTask={(id) => {
                  setAddTaskContainerId(id);
                  setIsDialogOpen(true);
                }}
                onAddTaskWithAI={(id) => {
                  setAiDialogContainerId(id);
                  setIsAiDialogOpen(true);
                }}
                onChangeCategory={(value) =>
                  handleChangeCategory(value, category.id)
                }
                {...(minimal ? { unstyled: true } : {})}
                onRemove={() => {
                  setIsOpenAgreeDialog(true);
                  setRemoveContainerId(category.id);
                }}
              >
                <SortableContext
                  items={category.tasks.map((t) => t.id)}
                  strategy={strategy}
                >
                  {category.tasks.length === 0 ? (
                    <li
                      className={`rounded-lg border border-dashed border-white/5 flex items-center justify-center text-zinc-600 text-xs transition-all duration-200 bg-white/[0.02]
    ${category.tasks.length > 0 ? "invisible absolute" : ""}
  `}
                      style={{
                        minHeight: "56px",
                        height: "56px",
                      }}
                    >
                      {t("task_manager.drag_task_here")}
                    </li>
                  ) : category.tasks.length > 10 ? (
                    <ul>
                      {category.tasks.map((task, index) => (
                        <SortableItem
                          disabled={isSortingContainer}
                          id={task.id}
                          key={task.id}
                          templated={templated}
                          index={index}
                          handle={handle}
                          items={items}
                          style={getItemStyles}
                          wrapperStyle={wrapperStyle}
                          renderItem={renderItem}
                          containerId={category.id}
                          getIndex={getIndex}
                          task={task}
                          onToggle={handleToggleTask}
                          onEditTask={(task) => {
                            setEditTask(null);
                            setTimeout(() => {
                              setEditTask(task);
                              setAddTaskContainerId(category.id);
                              setIsDialogOpen(true);
                            }, 0);
                          }}
                        />
                      ))}
                    </ul>
                  ) : (
                    <TooltipProvider>
                      {category.tasks.map((task, index) => (
                        <SortableItem
                          disabled={isSortingContainer}
                          key={task.id}
                          id={task.id}
                          templated={templated}
                          index={index}
                          handle={handle}
                          items={items}
                          style={getItemStyles}
                          wrapperStyle={wrapperStyle}
                          renderItem={renderItem}
                          containerId={category.id}
                          getIndex={getIndex}
                          task={task}
                          onToggle={handleToggleTask}
                          onEditTask={(task) => {
                            setEditTask(null);
                            setTimeout(() => {
                              setEditTask(task);
                              setAddTaskContainerId(category.id);
                              setIsDialogOpen(true);
                            }, 0);
                          }}
                        />
                      ))}
                    </TooltipProvider>
                  )}
                </SortableContext>
              </DroppableContainer>
            ))}

            {!minimal && (
              <DroppableContainer
                id={PLACEHOLDER_ID}
                templated={templated}
                options={CATEGORY_OPTIONS}
                disabled={isSortingContainer}
                items={[]}
                onClick={handleAddColumn}
                placeholder
              >
                <div className="flex justify-center items-center">
                  <WrapperHoverElement className="w-full">
                    <SoundHoverElement
                      animValue={1.09}
                      hoverTypeElement={SoundTypeElement.LINK}
                      hoverStyleElement={HoverStyleElement.quad}
                      className="w-full"
                    >
                      <Button
                        className="w-full uppercase hover:bg-transparent hover:text-primary"
                        variant="ghost"
                      >
                        {t("task_manager.add_container")}
                      </Button>
                    </SoundHoverElement>
                  </WrapperHoverElement>
                </div>
              </DroppableContainer>
            )}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
            {activeId ? (
              containers.includes(activeId) ? (
                <ContainerDragOverlay
                  items={items}
                  getItemStyles={getItemStyles}
                  handle={handle}
                  renderItem={renderItem}
                  columns={columns}
                  containerId={activeId}
                  templated={templated}
                  options={CATEGORY_OPTIONS}
                />
              ) : (
                <SortableItemDragOverlay
                  items={items}
                  templated={templated}
                  getItemStyles={getItemStyles}
                  handle={handle}
                  renderItem={renderItem}
                  id={activeId}
                />
              )
            ) : null}
          </DragOverlay>,
          document.body
        )}
        {trashable && activeId && !containers.includes(activeId) ? (
          <Trash id={TRASH_ID} />
        ) : null}
      </DndContext>
    </>
  );
}
