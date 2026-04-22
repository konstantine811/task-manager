import { useIsAdoptive } from "@/hooks/useIsAdoptive";

import DailyTaskWrapper from "./daily-components/daily-task-wrapper";
import { useParams } from "react-router";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import DailySidePanelWrapper from "./daily-components/daily-side-panel-wrapper";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadDailyTasksByDate,
  loadDailyJournalByDate,
  saveDailyJournal,
  subscribeToDailyTasksByDate,
  uploadDailyJournalImage,
  updatePlannedTasksOnServer,
} from "@/services/firebase/taskManagerData";
import { FirebaseCollection } from "@/config/firebase.config";
import { Items, ItemTask, ItemTaskCategory } from "@/types/drag-and-drop.model";
import { DailyTaskContext } from "./hooks/useDailyTask";
import { isFutureDate } from "@/utils/date.util";
import { UniqueIdentifier } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import CustomDrawer from "@/components/ui-abc/drawer/custom-drawer";
import DailySidePanelContent from "./daily-components/daily-side-panel-content";
import DailyAnalytics from "./daily-components/daily-analytics";
import { BreakPoints } from "@/config/adaptive.config";
import { DailyTaskAnalytics } from "@/types/analytics/task-analytics.model";
import { DailyJournal } from "@/types/daily-journal.model";
import DailyJournalCard from "./daily-components/daily-journal-card";
import CoinCelebrationOverlay, {
  type CoinCelebrationEvent,
} from "./daily-components/coin-celebration-overlay";
import { getDailyTaskAnalyticsData } from "@/services/task-menager/analytics/daily-handle-data";
import { CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "@/components/dnd/config/category-style.config";
import { type CoinColor } from "@/components/ui-abc/coin";

const getCoinColorByTaskPercent = (taskPercent: number): CoinColor | null => {
  if (taskPercent >= 100) return "gold";
  if (taskPercent >= 65) return "silver";
  if (taskPercent > 30) return "bronze";
  return null;
};

const DailyTask = () => {
  const { isAdoptiveSize: mdSize, screenWidth } = useIsAdoptive("lg");
  const hS = useHeaderSizeStore((s) => s.size);
  const [dailyTask, setDailyTask] = useState<Items>();
  const [dateVal, setDateVal] = useState<string | undefined>();
  const { id: date } = useParams(); // ← id це твоя дата у форматі "dd.MM.yyyy"
  const [plannedTasks, setPlannedTasks] = useState<ItemTaskCategory[] | null>(
    null,
  );
  const [journalContent, setJournalContent] = useState("");
  const [isJournalLoading, setIsJournalLoading] = useState(false);
  const [dailyAnalyticsData, setDailyAnalyticsData] =
    useState<DailyTaskAnalytics | null>(null);
  const [overlayCelebrations, setOverlayCelebrations] = useState<
    CoinCelebrationEvent[]
  >([]);
  const prevCoinStateRef = useRef<Record<string, CoinColor>>({});
  const [t] = useTranslation();

  useEffect(() => {
    setDateVal(date);
  }, [date]);
  const updatePlannedTask = useCallback(
    (updatedTask: ItemTask) => {
      //
      if (!plannedTasks) return;
      const index = plannedTasks.findIndex(
        (task) => task.id === updatedTask.id,
      );
      if (index === -1) return;

      const updated: ItemTaskCategory = {
        ...plannedTasks[index],
        ...updatedTask,
      };

      const newTasks = [...plannedTasks];
      newTasks[index] = updated;
      setPlannedTasks(newTasks);
      if (!date) return;
      updatePlannedTasksOnServer(date, newTasks) // 🔧 реалізуй збереження
        .then(() => {
          // console.info("✅ Task updated on server")
        })
        .catch((err) => console.error("❌ Failed to update task:", err));
    },
    [plannedTasks, date],
  );

  const addPlannedTask = useCallback(
    (newTasks: ItemTaskCategory[]) => {
      if (!plannedTasks || !date) return;
      setPlannedTasks(newTasks);
      updatePlannedTasksOnServer(date, newTasks)
        .then(() => {
          // console.info("✅ Task added/updated on server")
        })
        .catch((err) => console.error("❌ Failed to save planned tasks:", err));
    },
    [plannedTasks, date],
  );

  const deletePlannedTask = useCallback(
    (taskId: UniqueIdentifier) => {
      if (!plannedTasks || !date) return;
      const updated = plannedTasks.filter((task) => task.id !== taskId);
      setPlannedTasks(updated);
      updatePlannedTasksOnServer(date, updated)
        .then(() => {
          // console.info("✅ Task deleted on server")
        })
        .catch((err) => console.error("❌ Failed to delete task:", err));
    },
    [plannedTasks, date],
  );

  const setDailyTasks = useCallback((newDailyTasks: Items) => {
    // 2. Оновлюємо список задач у локальному стані
    setDailyTask(newDailyTasks);
    // if (newDailyTasks.length) {
    //   // 3. Обчислюємо нову аналітику
    //   const analytics = getDailyTaskAnalyticsData(newDailyTasks);
    //   // 4. Оновлюємо стан аналітики
    //   setDailyAnalyticsData(analytics);
    //   saveDailyTasks<DailyTaskAnalytics>(
    //     analytics,
    //     date || "",
    //     FirebaseCollection.dailyAnalytics
    //   );
    // } else {
    //   setDailyAnalyticsData(null);
    //   saveDailyTasks<null>(
    //     null,
    //     date || "",
    //     FirebaseCollection.dailyAnalytics
    //   );
    // }
  }, []);

  useEffect(() => {
    if (!date) return;
    if (isFutureDate(date)) {
      setPlannedTasks([]);
      return;
    }
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      unsubscribe = await subscribeToDailyTasksByDate<ItemTaskCategory[]>(
        date,
        FirebaseCollection.plannedTasks,
        ({ items }) => {
          if (!isMounted) return;
          setPlannedTasks(items ?? []);
        },
      );

      if (unsubscribe) return;

      const data = await loadDailyTasksByDate<ItemTaskCategory[]>(
        date,
        FirebaseCollection.plannedTasks,
      );
      if (!isMounted) return;
      setPlannedTasks(data ?? []);
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [date]);

  useEffect(() => {
    if (!date) return;
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    setIsJournalLoading(true);

    (async () => {
      unsubscribe = await subscribeToDailyTasksByDate<DailyJournal>(
        date,
        FirebaseCollection.dailyJournal,
        ({ items }) => {
          if (!isMounted) return;
          setJournalContent(items?.content ?? "");
          setIsJournalLoading(false);
        },
      );

      if (unsubscribe) return;

      const journal = await loadDailyJournalByDate(date);
      if (!isMounted) return;
      setJournalContent(journal?.content ?? "");
      setIsJournalLoading(false);
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [date]);

  const handleSaveJournal = useCallback(
    async (content: string) => {
      if (!date) return;
      // Optimistic local value so user sees immediate persistence.
      setJournalContent(content);
      await saveDailyJournal(date, { content });
    },
    [date],
  );

  const handleUploadJournalImage = useCallback(
    async (file: File) => {
      if (!date) {
        throw new Error("Date is missing");
      }
      return uploadDailyJournalImage(date, file);
    },
    [date],
  );

  useEffect(() => {
    if (!mdSize) {
      setOverlayCelebrations((prev) => (prev.length > 0 ? [] : prev));
      prevCoinStateRef.current = {};
      return;
    }
    if (!dailyTask || dailyTask.length === 0) {
      prevCoinStateRef.current = {};
      return;
    }

    const { categoryEntity } = getDailyTaskAnalyticsData(dailyTask);
    const nextCoinState: Record<string, CoinColor> = {};
    const triggered: CoinCelebrationEvent[] = [];

    Object.entries(categoryEntity).forEach(([categoryKey, categoryStats]) => {
      const countTotal = categoryStats.taskDone.length + categoryStats.taskNoDone.length;
      if (countTotal <= 0) return;
      const taskPct = Math.round((categoryStats.countDone / countTotal) * 100);
      const coinColor = getCoinColorByTaskPercent(taskPct);
      if (!coinColor) return;

      nextCoinState[categoryKey] = coinColor;
      const prevColor = prevCoinStateRef.current[categoryKey];
      const shouldTrigger =
        !prevColor ||
        (prevColor !== coinColor &&
          (coinColor === "silver" || coinColor === "gold"));

      if (!shouldTrigger) return;

      const labelKey = `task_manager.categories.${categoryKey}`;
      const label = t(labelKey) !== labelKey ? t(labelKey) : categoryKey;
      const style = CATEGORY_STYLE[categoryKey] ?? DEFAULT_CATEGORY_STYLE;
      triggered.push({
        id: `mobile-overlay-${categoryKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        coinColor,
        label,
        Icon: style.icon,
      });
    });

    prevCoinStateRef.current = nextCoinState;
    if (triggered.length > 0) {
      setOverlayCelebrations((prev) => [...prev, ...triggered]);
    }
  }, [dailyTask, mdSize, t]);

  const handleOverlayCelebrationDone = useCallback((id: string) => {
    setOverlayCelebrations((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <DailyTaskContext.Provider
      value={{
        plannedTasks,
        updatePlannedTask,
        deletePlannedTask,
        addPlannedTask,
        setDailyTasks,
        dailyAnalyticsData,
        setDailyAnalyticsData,
        dailyTasks: dailyTask || [],
      }}
    >
      {mdSize && (
        <CoinCelebrationOverlay
          events={overlayCelebrations}
          onDone={handleOverlayCelebrationDone}
        />
      )}
      <div className="flex h-full min-h-0 w-full justify-center overflow-y-auto">
        {/* Ліва колонка */}

        {screenWidth >= BreakPoints["2xl"] && (
          <div className="flex-1">
            <div className="px-4 pt-10 sticky" style={{ top: `${hS}px` }}>
              <DailyAnalytics />
            </div>
          </div>
        )}

        {/* Центральна колонка */}
        <main className="w-full flex-1 px-4 flex flex-col justify-start">
          <h2 className="text-center text-foreground/50 text-sm mb-4 mt-2">
            {`${t("task_manager.daily_task_title")} : ${dateVal || ""}`}
          </h2>

          {date && (
            <DailyJournalCard
              date={date}
              initialContent={journalContent}
              isLoading={isJournalLoading}
              onSave={handleSaveJournal}
              onUploadImage={handleUploadJournalImage}
            />
          )}

          <DailyTaskWrapper />
        </main>

        {/* Права колонка */}
        <div className="max-w-1 lg:max-w-full flex-1 pt-8">
          {mdSize ? (
            <CustomDrawer
              title={"task_manager.calendar.header.title"}
              description={"task_manager.calendar.header.description"}
            >
              <DailySidePanelContent />
            </CustomDrawer>
          ) : (
            <DailySidePanelWrapper />
          )}
        </div>
      </div>
    </DailyTaskContext.Provider>
  );
};

export default DailyTask;
