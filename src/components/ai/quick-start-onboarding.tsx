import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Sun,
  Battery,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  QuickStartData,
  FOCUS_OPTIONS,
  TIME_BUDGET_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  FIXED_COMMITMENTS_OPTIONS,
  BARRIER_OPTIONS,
  QUICK_START_STORAGE_KEY,
} from "./quick-start-types";
import { starterPacks } from "./starter-packs.config";
import type { Items } from "@/types/drag-and-drop.model";
import { Priority } from "@/types/drag-and-drop.model";
import { createTask } from "@/components/dnd/utils/createTask";
import type { DayNumber } from "@/types/drag-and-drop.model";

const MAX_FOCUSES = 3;

function loadQuickStart(): Partial<QuickStartData> {
  try {
    const raw = localStorage.getItem(QUICK_START_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<QuickStartData>;
  } catch {
    return {};
  }
}

function saveQuickStart(data: Partial<QuickStartData>) {
  try {
    localStorage.setItem(QUICK_START_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function buildPromptFromQuickStart(data: QuickStartData, t: (k: string) => string): string {
  const parts: string[] = [];
  if (data.weeklyFocuses.length > 0) {
    parts.push(
      `Мій фокус: ${data.weeklyFocuses.map((f) => t(`quick_start.focus.${f}`)).join(", ")}.`
    );
  }
  parts.push(
    `Час на день: ${data.dailyTimeBudget} хв.`,
    `Кращий час: ${t(`quick_start.time_of_day.${data.preferredTimeOfDay}`)}.`,
    `Енергія: ${data.energyLevel}/5.`
  );
  if (data.fixedCommitments.length > 0) {
    parts.push(
      `Обмеження: ${data.fixedCommitments.map((c) => t(`quick_start.commitments.${c}`)).join(", ")}.`
    );
  }
  if (data.barrier) {
    parts.push(`Бар'єр: ${t(`quick_start.barrier.${data.barrier}`)}.`);
  }
  parts.push("Склади шаблон задач на 7 днів з конкретними задачами, тривалістю та днями.");
  return parts.join("\n");
}

type QuickStartOnboardingProps = {
  isEmpty: boolean;
  onPromptFromQuickStart: (prompt: string) => void;
  onReplaceTasks?: (items: Items) => void;
};

export function QuickStartOnboarding({
  isEmpty,
  onPromptFromQuickStart,
  onReplaceTasks,
}: QuickStartOnboardingProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState<Partial<QuickStartData>>(() => loadQuickStart());

  const updateData = (updates: Partial<QuickStartData>) => {
    const next = { ...data, ...updates };
    setData(next);
    saveQuickStart(next);
  };

  const toggleFocus = (key: string) => {
    const list = data.weeklyFocuses ?? [];
    const next = list.includes(key)
      ? list.filter((x) => x !== key)
      : list.length < MAX_FOCUSES
        ? [...list, key]
        : list;
    updateData({ weeklyFocuses: next });
  };

  const toggleCommitment = (key: string) => {
    const list = data.fixedCommitments ?? [];
    const next = list.includes(key)
      ? list.filter((x) => x !== key)
      : [...list, key];
    updateData({ fixedCommitments: next });
  };

  const handleGenerateFromQuickStart = () => {
    const full: QuickStartData = {
      weeklyFocuses: data.weeklyFocuses ?? [],
      dailyTimeBudget: data.dailyTimeBudget ?? 60,
      preferredTimeOfDay: data.preferredTimeOfDay ?? "mixed",
      energyLevel: data.energyLevel ?? 3,
      fixedCommitments: data.fixedCommitments ?? [],
      barrier: data.barrier ?? "",
    };
    const prompt = buildPromptFromQuickStart(full, t);
    onPromptFromQuickStart(prompt);
  };

  const handleAddPack = (packId: string) => {
    const pack = starterPacks.find((p) => p.id === packId);
    if (!pack || !onReplaceTasks) return;
    const byCategory = new Map<string, ReturnType<typeof createTask>[]>();
    for (const taskDef of pack.tasks) {
      const task = createTask(
        t(taskDef.titleKey),
        Priority.MEDIUM,
        taskDef.timeMinutes * 60,
        false,
        0,
        taskDef.days as DayNumber[],
        false
      );
      if (!byCategory.has(taskDef.category)) byCategory.set(taskDef.category, []);
      byCategory.get(taskDef.category)!.push(task);
    }
    const items: Items = Array.from(byCategory.entries()).map(([catId, tasks]) => ({
      id: catId,
      title: t(`task_manager.categories.${catId}`),
      tasks,
    }));
    onReplaceTasks(items);
  };

  if (!isEmpty) return null;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-medium text-zinc-100">
            {t("quick_start.title")}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {expanded && (
          <div className="space-y-4 text-sm">
            {/* 1. Фокуси */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <Zap className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium">{t("quick_start.focus_label")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFocus(key)}
                    className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      (data.weeklyFocuses ?? []).includes(key)
                        ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                        : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                    }`}
                >
                  {t(`quick_start.focus.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Час на день */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-medium">{t("quick_start.time_budget_label")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_BUDGET_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => updateData({ dailyTimeBudget: min })}
                  className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    data.dailyTimeBudget === min
                      ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {min} хв
                </button>
              ))}
            </div>
          </div>

          {/* 3. Найкращий час */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <Sun className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-medium">{t("quick_start.preferred_time_label")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_OF_DAY_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateData({ preferredTimeOfDay: key })}
                  className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    data.preferredTimeOfDay === key
                      ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {t(`quick_start.time_of_day.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Енергія */}
          <div>
            <div className="flex flex-col gap-0.5 mb-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Battery className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium">{t("quick_start.energy_label")}</span>
              </div>
              <p className="text-[10px] text-zinc-500 pl-6">{t("quick_start.energy_label_hint")}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateData({ energyLevel: n })}
                  className={`w-9 h-9 rounded-lg border text-xs font-medium transition-colors ${
                    (data.energyLevel ?? 0) === n
                      ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Зайнято */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-medium">{t("quick_start.commitments_label")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FIXED_COMMITMENTS_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCommitment(key)}
                  className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    (data.fixedCommitments ?? []).includes(key)
                      ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {t(`quick_start.commitments.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Бар'єр */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <AlertCircle className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-medium">{t("quick_start.barrier_label")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BARRIER_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    updateData({ barrier: data.barrier === key ? "" : key })
                  }
                  className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    data.barrier === key
                      ? "border-indigo-400/50 bg-indigo-500/30 text-indigo-50"
                      : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {t(`quick_start.barrier.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопка генерації */}
          <button
            type="button"
            onClick={handleGenerateFromQuickStart}
            className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
          >
            {t("quick_start.generate")}
          </button>

          {/* Стартові пакети */}
          <div>
            <div className="text-xs font-medium text-zinc-400 mb-2">
              {t("quick_start.starter_packs_label")}
            </div>
            <div className="flex flex-col gap-2">
              {starterPacks.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleAddPack(pack.id)}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs transition-colors hover:bg-white/5"
                >
                  <span className="font-medium text-zinc-200">
                    {t(pack.nameKey)}
                  </span>
                  <p className="mt-0.5 text-zinc-500">{t(pack.descriptionKey)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
