import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import type { DailyTaskRecord, ItemTask } from "@/types/drag-and-drop.model";
import type {
  Achievement,
  AchievementSourcePeriod,
  AreaId,
  AreaProgress,
  AreaProgressMap,
  ProgressSnapshot,
} from "@/types/progress.model";
import { FIRST_RELEASE_PROGRESS_METRICS } from "@/types/progress.constants";
import { differenceInCalendarDays, formatISO, parseISO } from "date-fns";
import { resolveCategoryKey } from "@/utils/category.util";

function toAreaKey(value: string): AreaId | null {
  const key = resolveCategoryKey(value);
  return CATEGORY_OPTIONS.includes(key as AreaId) ? (key as AreaId) : null;
}

function isoDateOnly(value: string): string {
  return value.slice(0, 10);
}

const SECONDS_PER_MINUTE = 60;

function getTaskPlannedMinutes(task: ItemTask): number {
  // For determined/planned tasks, `time` may represent time-of-day,
  // so planned workload must come from tracked duration field (`timeDone`).
  if (task.isDetermined || task.isPlanned) {
    return (task.timeDone > 0 ? task.timeDone : 0) / SECONDS_PER_MINUTE;
  }
  return (task.time > 0 ? task.time : 0) / SECONDS_PER_MINUTE;
}

function getTaskSpentMinutes(task: ItemTask): number {
  if (task.isDetermined || task.isPlanned) {
    return (task.timeDone > 0 ? task.timeDone : 0) / SECONDS_PER_MINUTE;
  }

  if (task.timeDone > 0) return task.timeDone / SECONDS_PER_MINUTE;
  if (task.isDone && task.time > 0) return task.time / SECONDS_PER_MINUTE;
  return 0;
}

/**
 * Хвилини саме виконаної роботи (`time` / `timeDone` у задачі зберігаються в секундах).
 * `timeDone` для невиконаних задач не враховуємо.
 */
function getTaskCompletedMinutes(task: ItemTask): number {
  if (!task.isDone) return 0;
  return getTaskSpentMinutes(task);
}

function taskHadMovement(task: ItemTask): boolean {
  return task.isDone || getTaskSpentMinutes(task) > 0;
}

function createEmptyAreaProgress(areaId: AreaId): AreaProgress {
  return {
    areaId,
    activeDays: 0,
    completedTasks: 0,
    skippedTasks: 0,
    spentTime: 0,
    completedTime: 0,
    plannedTime: 0,
    consistencyScore: 0,
    completionRate: 0,
    trend: "flat",
    currentStreak: 0,
    bestStreak: 0,
    lastActivityAt: undefined,
  };
}

function calcStreaks(activeDates: string[]): { current: number; best: number } {
  if (activeDates.length === 0) return { current: 0, best: 0 };

  const sorted = [...activeDates].sort();
  let best = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const next = new Date(`${sorted[i]}T00:00:00`);
    const diffInDays = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 1) {
      currentRun += 1;
      best = Math.max(best, currentRun);
    } else {
      currentRun = 1;
    }
  }

  let current = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const next = new Date(`${sorted[i]}T00:00:00`);
    const diffInDays = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffInDays === 1) current += 1;
    else break;
  }

  return { current, best };
}

function calcTrend(
  areaId: AreaId,
  rangeTasks: DailyTaskRecord[],
  getTimeForArea: (tasks: DailyTaskRecord, area: AreaId) => number
): AreaProgress["trend"] {
  if (rangeTasks.length < 4) return "flat";

  const midpoint = Math.ceil(rangeTasks.length / 2);
  const firstHalf = rangeTasks
    .slice(0, midpoint)
    .reduce((sum, record) => sum + getTimeForArea(record, areaId), 0);
  const secondHalf = rangeTasks
    .slice(midpoint)
    .reduce((sum, record) => sum + getTimeForArea(record, areaId), 0);

  if (firstHalf === 0 && secondHalf === 0) return "flat";
  if (secondHalf > firstHalf * 1.1) return "up";
  if (secondHalf < firstHalf * 0.9) return "down";
  return "flat";
}

export function buildAreaProgress(
  rangeTasks: DailyTaskRecord[],
  sourcePeriod?: AchievementSourcePeriod
): AreaProgressMap {
  const map = Object.fromEntries(
    CATEGORY_OPTIONS.map((areaId) => [areaId, createEmptyAreaProgress(areaId)])
  ) as AreaProgressMap;

  const activeDateMap = new Map<AreaId, Set<string>>(
    CATEGORY_OPTIONS.map((areaId) => [areaId, new Set<string>()])
  );
  const todayIso = formatISO(new Date(), { representation: "date" });

  const getTimeForArea = (record: DailyTaskRecord, areaId: AreaId) => {
    let total = 0;
    record.items.forEach((category) => {
      const key = toAreaKey(category.title);
      if (key !== areaId) return;

      category.tasks.forEach((task) => {
        total += getTaskSpentMinutes(task);
      });
    });
    return total;
  };

  rangeTasks.forEach((record) => {
    const dateKey = isoDateOnly(record.date);

    record.items.forEach((category) => {
      const areaId = toAreaKey(category.title);
      if (!areaId) return;

      const area = map[areaId];
      let hadMovementToday = false;

      category.tasks.forEach((task) => {
        const completedMinutes = getTaskCompletedMinutes(task);
        const plannedMinutes = getTaskPlannedMinutes(task);
        const spentMinutes = getTaskSpentMinutes(task);

        area.plannedTime += plannedMinutes;
        area.spentTime += spentMinutes;
        area.completedTime += completedMinutes;

        if (task.isDone) {
          area.completedTasks += 1;
        } else {
          // Do not count current day as skip yet — task may still be completed today.
          if (dateKey !== todayIso) {
            area.skippedTasks += 1;
          }
        }

        if (taskHadMovement(task)) {
          hadMovementToday = true;
          area.lastActivityAt = dateKey;
        }
      });

      if (hadMovementToday) {
        activeDateMap.get(areaId)?.add(dateKey);
      }
    });
  });

  CATEGORY_OPTIONS.forEach((areaId) => {
    const area = map[areaId];
    const activeDates = Array.from(activeDateMap.get(areaId) ?? []);
    const totalDaysInPeriod = sourcePeriod
      ? Math.max(
          1,
          differenceInCalendarDays(
            parseISO(sourcePeriod.to),
            parseISO(sourcePeriod.from)
          ) + 1
        )
      : rangeTasks.length;

    area.activeDays = activeDates.length;
    // Без жодної виконаної задачі за період «стабільність» = 0% (не дні з таймером без галочки).
    area.consistencyScore =
      area.completedTasks === 0
        ? 0
        : totalDaysInPeriod > 0
          ? Math.round((area.activeDays / totalDaysInPeriod) * 100)
          : 0;
    area.completionRate =
      area.spentTime > 0 || area.plannedTime > 0
        ? area.plannedTime > 0
          ? Math.round((area.spentTime / area.plannedTime) * 100)
          : 0
        : 0;

    const streaks = calcStreaks(activeDates);
    area.currentStreak = streaks.current;
    area.bestStreak = streaks.best;
    area.trend = calcTrend(areaId, rangeTasks, getTimeForArea);
  });

  return map;
}

export function buildDerivedAchievements(
  areaProgress: AreaProgressMap,
  sourcePeriod: AchievementSourcePeriod
): Achievement[] {
  const achievements: Achievement[] = [];

  CATEGORY_OPTIONS.forEach((areaId) => {
    const progress = areaProgress[areaId];
    if (!progress) return;

    if (progress.bestStreak >= 5) {
      achievements.push({
        id: `streak-${areaId}-${sourcePeriod.to}`,
        type: "streak",
        title: `Streak in ${areaId}`,
        description: `${progress.bestStreak} active days in a row.`,
        areaId,
        earnedAt: sourcePeriod.to,
        sourcePeriod,
        meta: { streak: progress.bestStreak },
      });
    }

    // completedTime у хвилинах; 10 год = 600 хв
    if (progress.completedTime >= 600) {
      achievements.push({
        id: `volume-${areaId}-${sourcePeriod.to}`,
        type: "volume",
        title: `10h invested in ${areaId}`,
        description: `User invested at least 10 hours in this area.`,
        areaId,
        earnedAt: sourcePeriod.to,
        sourcePeriod,
        meta: { completedTime: progress.completedTime },
      });
    }

    if (progress.completedTasks >= 10) {
      achievements.push({
        id: `milestone-${areaId}-${sourcePeriod.to}`,
        type: "milestone",
        title: `10 completed tasks in ${areaId}`,
        description: `A first milestone of completed tasks for this area.`,
        areaId,
        earnedAt: sourcePeriod.to,
        sourcePeriod,
        meta: { completedTasks: progress.completedTasks },
      });
    }

    if (progress.consistencyScore >= 70 && progress.activeDays >= 5) {
      achievements.push({
        id: `consistency-${areaId}-${sourcePeriod.to}`,
        type: "category_consistency",
        title: `Consistent progress in ${areaId}`,
        description: `Stable activity across the selected period.`,
        areaId,
        earnedAt: sourcePeriod.to,
        sourcePeriod,
        meta: {
          activeDays: progress.activeDays,
          consistencyScore: progress.consistencyScore,
        },
      });
    }
  });

  return achievements;
}

export function buildProgressSnapshot(
  rangeTasks: DailyTaskRecord[],
  sourcePeriod: AchievementSourcePeriod
): ProgressSnapshot {
  const areas = buildAreaProgress(rangeTasks, sourcePeriod);
  const achievements = buildDerivedAchievements(areas, sourcePeriod);

  return {
    areas,
    achievements,
    metrics: FIRST_RELEASE_PROGRESS_METRICS,
    period: sourcePeriod,
  };
}
