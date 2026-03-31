import { createPortal } from "react-dom";
import { DndContext, DragOverlay, MeasuringStrategy } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { coordinateGetter as multipleContainersCoordinateGetter } from "../utils/multipleContainersKeyboardCoordinates";
import DroppableContainer from "../droppable-container";
import { ItemTask } from "@/types/drag-and-drop.model";
import { PLACEHOLDER_ID, TRASH_ID } from "../config/dnd.config";
import { dropAnimation, getIndex } from "../utils/dnd.utils";
import SortableItem from "../sortable-item";
import Trash from "../trash";
import ContainerDragOverlay from "../container-drag-overlay";
import SortableItemDragOverlay from "../sortable-item-drag-overlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import DialogTask from "../dialog-task/dialog-task";
import SoundHoverElement from "../../ui-abc/sound-hover-element";
import { Button } from "../../ui/button";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { useTranslation } from "react-i18next";
import WrapperHoverElement from "../../ui-abc/wrapper-hover-element";
import TaskTimer from "../task-timer";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { CATEGORY_OPTIONS } from "../config/category-options";
import DialogAgree from "../../ui-abc/dialog/dialog-agree";
import { AddTasksWithAIDialog } from "@/components/ai/add-tasks-with-ai-dialog";
import { AnimatedItem } from "@/components/ui/animated-item";
import { AnimatePresence, motion } from "framer-motion";
import { SUGGESTED_TASK_PREFIX } from "../config/dnd.config";
import { TaskItem } from "../task-item";
import { MultipleContainersProps } from "./multiple-containers.types";
import { useMultipleContainersBoard } from "./use-multiple-containers-board";

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
  sidePanel,
  emptyStateCenter,
  isEmptyTemplate = false,
  beforeCategories,
  onSuggestedTaskMovedToTemplate,
  onTaskDone,
  onTaskUndone,
}: MultipleContainersProps) {
  const [t] = useTranslation();
  const sH = useHeaderSizeStore((s) => s.size);

  const {
    items,
    containers,
    playingTask,
    addTaskContainerId,
    setAddTaskContainerId,
    editTask,
    setEditTask,
    isDialogOpen,
    setIsDialogOpen,
    activeId,
    isSortingContainer,
    isOpenAgreeDialog,
    setIsOpenAgreeDialog,
    removeContainerId,
    setRemoveContainerId,
    isAiDialogOpen,
    setIsAiDialogOpen,
    aiDialogContainerId,
    setAiDialogContainerId,
    activeSuggestedTask,
    setActiveSuggestedTask,
    collisionDetectionStrategy,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    handleAddColumn,
    handleRemove,
    sensors,
    handleToggleTask,
    handleAddTask,
    handleAddTasks,
    handleEditTask,
    handleChangeCategory,
  } = useMultipleContainersBoard({
    items: initialItems,
    onChangeTasks,
    onDeletePlannedTask,
    onSuggestedTaskMovedToTemplate,
    onEditPlannedTask,
    onTaskDone,
    onTaskUndone,
    coordinateGetter,
  });

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
      {!templated && playingTask && (
        <div className="h-[60px] shrink-0" aria-hidden />
      )}
      {createPortal(
        <AnimatePresence>
          {!templated && playingTask ? (
            <motion.div
              key="task-timer-fixed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 60 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ top: `${sH}px` }}
              className="pointer-events-auto fixed left-0 right-0 z-40 flex justify-center overflow-hidden border-b border-border/40 bg-background/90 backdrop-blur-md"
            >
              <div className="flex h-[60px] items-center justify-center">
                <TaskTimer />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
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
          const data = active.data?.current as {
            type?: string;
            task?: ItemTask;
          };
          if (data?.type === "suggested" && data?.task) {
            setActiveSuggestedTask(data.task);
          } else {
            setActiveSuggestedTask(null);
          }
        }}
        onDragOver={({ active, over }) => {
          return onDragOver(active, over);
        }}
        onDragEnd={({ active, over }) => {
          onDragEnd(active, over);
          setActiveSuggestedTask(null);
        }}
        cancelDrop={cancelDrop}
        onDragCancel={() => {
          onDragCancel();
          setActiveSuggestedTask(null);
        }}
        modifiers={modifiers}
      >
        <div
          className={
            sidePanel
              ? "grid w-full flex-1 min-w-0 min-h-0 grid-cols-2 gap-4 items-start"
              : `${templated && "mt-5"}`
          }
        >
          <div className="flex min-w-0 flex-col gap-4">
            {beforeCategories && (
              <div className="w-full">{beforeCategories}</div>
            )}
            <div
              className={`flex flex-col w-full min-w-0 items-stretch justify-start ${templated ? "mt-5" : ""}`}
            >
              <SortableContext
                items={[...containers, PLACEHOLDER_ID]}
                strategy={
                  vertical
                    ? verticalListSortingStrategy
                    : horizontalListSortingStrategy
                }
              >
                {items.map((category, catIdx) => (
                  <AnimatedItem key={category.id} index={catIdx}>
                    <DroppableContainer
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
                            className={`rounded-lg border border-dashed border-white/5 flex items-center justify-center text-zinc-600 text-xs transition-all duration-200 bg-white/2
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
                  </AnimatedItem>
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
                    <div className="mb-3 flex items-center justify-center">
                      <WrapperHoverElement className="w-full">
                        <SoundHoverElement
                          animValue={-1}
                          hoverAnimType="translate"
                          hoverTypeElement={SoundTypeElement.LINK}
                          hoverStyleElement={HoverStyleElement.quad}
                          className="w-full"
                        >
                          <Button
                            className="w-full min-h-14 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-indigo-700 whitespace-normal hover:bg-indigo-500/15 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200"
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
            {isEmptyTemplate && emptyStateCenter && (
              <div className="flex min-w-0 justify-center overflow-auto">
                {emptyStateCenter}
              </div>
            )}
          </div>
          {sidePanel && (
            <AnimatedItem index={items.length}>
              <div className="min-w-0 overflow-auto pt-5">{sidePanel}</div>
            </AnimatedItem>
          )}
        </div>
        {createPortal(
          <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
            {activeId ? (
              String(activeId).startsWith(SUGGESTED_TASK_PREFIX) &&
              activeSuggestedTask ? (
                <div className="rounded-lg border border-white/10 bg-white/5 shadow-lg p-2 w-full max-w-[280px]">
                  <TaskItem
                    index=""
                    task={activeSuggestedTask}
                    templated
                    readOnly
                    dragging
                  />
                </div>
              ) : containers.includes(activeId) ? (
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
          document.body,
        )}
        {trashable && activeId && !containers.includes(activeId) ? (
          <Trash id={TRASH_ID} />
        ) : null}
      </DndContext>
    </>
  );
}
