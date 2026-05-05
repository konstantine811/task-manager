import { FirebaseCollection } from "@/config/firebase.config";
import { auth, db } from "@/config/firebase.config";
import { ItemTask, Items } from "@/types/drag-and-drop.model";
import { Goal, GoalProgressEvent, GoalStage } from "@/types/progress.model";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from "firebase/firestore";
import { computeGoalProgress, collectGoalIdsAffectedByTaskChange } from "@/services/task-menager/goals/goal-progress.service";
import { loadDailyTasksByRange, loadDailyTasksByDate } from "@/services/firebase/taskManagerData";
import { normalizeItems } from "@/services/task-menager/normalize";
import { parseDate } from "@/utils/date.util";
import { formatISO, startOfMonth, startOfWeek } from "date-fns";

const stripUndefined = <T,>(value: T): T => {
  if (value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const output: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      if (item === undefined) return;
      const cleaned = stripUndefined(item);
      if (cleaned !== undefined) {
        output[key] = cleaned;
      }
    });
    return output as T;
  }
  return value;
};

const waitForUserAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
};

interface TemplateGoalState {
  goals?: Goal[];
  goalProgressEvents?: GoalProgressEvent[];
}

const goalsDocRef = (uid: string) => doc(db, FirebaseCollection.templateTasks, uid);

const normalizeGoal = (goal: Goal): Goal => ({
  ...goal,
  stages: [...(goal.stages ?? [])].sort((a, b) => a.order - b.order),
});

const sortGoals = (goals: Goal[]): Goal[] =>
  goals
    .map(normalizeGoal)
    .sort((a, b) => {
      if (typeof a.sortOrder === "number" && typeof b.sortOrder === "number") {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

const loadGoalState = async (uid: string): Promise<TemplateGoalState> => {
  const snapshot = await getDoc(goalsDocRef(uid));
  if (!snapshot.exists()) return {};
  const data = snapshot.data() as TemplateGoalState;
  return {
    goals: Array.isArray(data.goals) ? sortGoals(data.goals) : [],
    goalProgressEvents: Array.isArray(data.goalProgressEvents)
      ? data.goalProgressEvents
      : [],
  };
};

const saveGoalState = async (
  user: User,
  state: TemplateGoalState,
): Promise<void> => {
  await setDoc(
    goalsDocRef(user.uid),
    stripUndefined({
      ...state,
      updatedAt: new Date().toISOString(),
      email: user.email,
    }),
    { merge: true },
  );
};

export const createGoal = async (
  draft: Omit<Goal, "id" | "createdAt" | "currentValue" | "status"> & {
    id?: string;
    currentValue?: number;
    status?: Goal["status"];
  },
): Promise<Goal | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const id = draft.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const stages =
    draft.stages.length > 0
      ? draft.stages
      : [
          {
            id: `${id}-stage-default`,
            title: draft.title,
            order: 0,
            isActive: true,
            requiredCount: Math.max(1, draft.targetValue),
            links: [],
          },
        ];
  const nextGoal: Goal = normalizeGoal({
    ...draft,
    stages,
    id,
    createdAt: now,
    currentValue: draft.currentValue ?? 0,
    status: draft.status ?? "active",
  });

  const state = await loadGoalState(user.uid);
  await saveGoalState(user, {
    ...state,
    goals: sortGoals([...(state.goals ?? []), nextGoal]),
  });

  return nextGoal;
};

export const updateGoal = async (
  goalId: string,
  patch: Partial<Goal>,
): Promise<Goal | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const state = await loadGoalState(user.uid);
  const current = state.goals?.find((goal) => goal.id === goalId);
  if (!current) return null;

  const merged = normalizeGoal({
    ...current,
    ...patch,
    id: goalId,
  });
  await saveGoalState(user, {
    ...state,
    goals: sortGoals(
      (state.goals ?? []).map((goal) => (goal.id === goalId ? merged : goal)),
    ),
  });
  return merged;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  const user = await waitForUserAuth();
  if (!user) return;
  const state = await loadGoalState(user.uid);
  await saveGoalState(user, {
    ...state,
    goals: (state.goals ?? []).filter((goal) => goal.id !== goalId),
  });
};

export const loadGoals = async (): Promise<Goal[]> => {
  const user = await waitForUserAuth();
  if (!user) return [];

  const state = await loadGoalState(user.uid);
  return sortGoals(state.goals ?? []);
};

export const subscribeGoals = async (
  onUpdate: (goals: Goal[]) => void,
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;
  const unsubscribe = onSnapshot(
    goalsDocRef(user.uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate([]);
        return;
      }
      const data = snapshot.data() as TemplateGoalState;
      onUpdate(Array.isArray(data.goals) ? sortGoals(data.goals) : []);
    },
    (error) => {
      console.error("Error subscribing to goals:", error);
      onUpdate([]);
    },
  );
  return unsubscribe;
};

export const setGoalStagesOrder = async (
  goalId: string,
  orderedStageIds: string[],
): Promise<Goal | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;
  const goal = (await loadGoals()).find((item) => item.id === goalId);
  if (!goal) return null;
  const stageById = new Map(goal.stages.map((stage) => [stage.id, stage]));
  const orderedStages: GoalStage[] = orderedStageIds
    .map((stageId, index) => {
      const stage = stageById.get(stageId);
      if (!stage) return null;
      return { ...stage, order: index };
    })
    .filter((stage): stage is GoalStage => stage !== null);

  const leftovers = goal.stages
    .filter((stage) => !orderedStageIds.includes(stage.id))
    .map((stage, index) => ({ ...stage, order: orderedStages.length + index }));

  return updateGoal(goalId, { stages: [...orderedStages, ...leftovers] });
};

export const toggleStageActive = async (
  goalId: string,
  stageId: string,
  isActive: boolean,
): Promise<Goal | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;
  const goal = (await loadGoals()).find((item) => item.id === goalId);
  if (!goal) return null;
  const stages = goal.stages.map((stage) =>
    stage.id === stageId ? { ...stage, isActive } : stage,
  );
  return updateGoal(goalId, { stages });
};

export const logGoalProgressEvent = async (
  event: Omit<GoalProgressEvent, "id" | "createdAt">,
): Promise<void> => {
  const user = await waitForUserAuth();
  if (!user) return;
  const id = crypto.randomUUID();
  const payload: GoalProgressEvent = {
    ...event,
    id,
    createdAt: new Date().toISOString(),
  };
  const state = await loadGoalState(user.uid);
  await saveGoalState(user, {
    ...state,
    goalProgressEvents: [...(state.goalProgressEvents ?? []), payload].slice(-200),
  });
};

const laterDate = (left: Date, right: Date): Date =>
  left.getTime() >= right.getTime() ? left : right;

const getGoalProgressRange = (goal: Goal, date: string): { from: Date; to: Date } => {
  const anchor = parseDate(date.slice(0, 10));
  const goalStart = parseDate(goal.createdAt.slice(0, 10));
  if (goal.period === "week") {
    return {
      from: laterDate(startOfWeek(anchor, { weekStartsOn: 1 }), goalStart),
      to: anchor,
    };
  }
  if (goal.period === "custom") {
    return {
      from: goalStart,
      to: anchor,
    };
  }
  return {
    from: laterDate(startOfMonth(anchor), goalStart),
    to: anchor,
  };
};

const loadGoalPeriodTasks = async (
  goal: Goal,
  date: string,
  currentDayTasks: ItemTask[],
): Promise<ItemTask[]> => {
  const range = getGoalProgressRange(goal, date);
  const currentDateId = formatISO(parseDate(date.slice(0, 10)), {
    representation: "date",
  });
  const records = await loadDailyTasksByRange(range.from, range.to);
  const normalized = records.flatMap((record) =>
    record.date === currentDateId ? currentDayTasks : normalizeItems(record.items),
  );

  if (!records.some((record) => record.date === currentDateId)) {
    normalized.push(...currentDayTasks);
  }

  return normalized;
};

export interface ReachedGoalInfo {
  goalId: string;
  currentValue: number;
  targetValue: number;
  unitType: Goal["unitType"];
  title: string;
}

export const applyGoalProgressFromTaskChange = async (
  taskBefore: ItemTask | null,
  taskAfter: ItemTask | null,
  allDailyTasks: ItemTask[],
  date: string,
): Promise<{ reachedGoalIds: string[]; reachedGoals: ReachedGoalInfo[] }> => {
  const changedTask = taskAfter ?? taskBefore;
  if (!changedTask) return { reachedGoalIds: [], reachedGoals: [] };

  const goals = await loadGoals();
  const affectedGoalIds = collectGoalIdsAffectedByTaskChange(
    taskBefore,
    taskAfter,
    goals,
  );
  if (affectedGoalIds.length === 0)
    return { reachedGoalIds: [], reachedGoals: [] };

  const idSet = new Set(affectedGoalIds);
  const relevantGoals = goals.filter((goal) => idSet.has(goal.id));
  const reachedGoalIds: string[] = [];
  const reachedGoals: ReachedGoalInfo[] = [];

  await Promise.all(
    relevantGoals.map(async (goal) => {
      const periodTasks = await loadGoalPeriodTasks(goal, date, allDailyTasks);
      const computed = computeGoalProgress(goal, periodTasks);
      const updated = computed.goal;
      await updateGoal(goal.id, {
        currentValue: updated.currentValue,
      });
      if (computed.reachedNow) {
        reachedGoalIds.push(goal.id);
        reachedGoals.push({
          goalId: goal.id,
          currentValue: updated.currentValue,
          targetValue: goal.targetValue,
          unitType: goal.unitType,
          title: goal.title,
        });
      }
      if (
        taskBefore &&
        taskAfter &&
        updated.currentValue !== goal.currentValue
      ) {
        await logGoalProgressEvent({
          goalId: goal.id,
          taskId: String(taskAfter.id),
          date,
          beforeValue: goal.currentValue,
          afterValue: updated.currentValue,
          reachedNow: computed.reachedNow,
        });
      }
    }),
  );

  return { reachedGoalIds, reachedGoals };
};

/** Recompute and persist `currentValue` from saved daily tasks (fixes drift vs analytics when opening Template). */
export const reconcileStoredGoalProgressFromDailyData = async (
  dateIso: string,
): Promise<void> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const items =
    (await loadDailyTasksByDate<Items>(
      dateIso,
      FirebaseCollection.dailyTasks,
    )) ?? [];
  const flat = normalizeItems(items);
  const goals = await loadGoals();

  await Promise.all(
    goals.map(async (goal) => {
      if (goal.status === "completed") return;
      const periodTasks = await loadGoalPeriodTasks(goal, dateIso, flat);
      const computed = computeGoalProgress(goal, periodTasks);
      const nextVal = computed.goal.currentValue;
      if (nextVal !== goal.currentValue) {
        await updateGoal(goal.id, { currentValue: nextVal });
      }
    }),
  );
};

/** After user extends a goal, keep the first stage requirement aligned with the new target. */
export const extendGoalTarget = async (goalId: string): Promise<Goal | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const goals = await loadGoals();
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return null;

  const nextTarget = Math.max(
    goal.targetValue + 1,
    Math.round(goal.targetValue * 1.25),
  );
  const patch: Partial<Goal> = {
    status: "active",
    targetValue: nextTarget,
    completedAt: undefined,
  };

  const stage0 = goal.stages[0];
  if (stage0) {
    const nextStage: GoalStage = { ...stage0 };
    if (goal.unitType === "count") {
      nextStage.requiredCount = nextTarget;
    } else if (goal.unitType === "time") {
      nextStage.requiredTimeSeconds = nextTarget;
    } else if (goal.unitType === "distance") {
      nextStage.requiredDistance = nextTarget;
    }
    patch.stages = [nextStage, ...goal.stages.slice(1)];
  }

  return updateGoal(goalId, patch);
};
