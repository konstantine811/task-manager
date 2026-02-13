import {
  askAiAdvisorAdviceOnly,
  askAiAdvisorTasksOnly,
} from "@/services/ai/gemini.service";
import type { AdvisorTask } from "@/services/ai/gemini.types";
import { createTask } from "@/components/dnd/utils/createTask";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import type { TaskCategoryKey } from "@/services/ai/gemini.types";
import { Items, TaskCategory, ItemTask } from "@/types/drag-and-drop.model";
import {
  ChevronDown,
  ChevronUp,
  History,
  MessageCircle,
  Replace,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  ListTodo,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { paresSecondToTime } from "@/utils/time.util";
import { toast } from "sonner";
import { SuggestedTasksPreview } from "./suggested-tasks-preview";
import { QuickStartOnboarding } from "./quick-start-onboarding";

const AI_HISTORY_KEY = "chrono-ai-assistant-history";
const MAX_HISTORY_ITEMS = 50;
const DEFAULT_CATEGORY: TaskCategoryKey = "leisure";

export type AiHistoryItem = {
  id: string;
  prompt: string;
  answer: string;
  suggestedTasks?: AdvisorTask[];
  createdAt: number;
};

function loadHistory(): AiHistoryItem[] {
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AiHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: AiHistoryItem[]) {
  try {
    localStorage.setItem(
      AI_HISTORY_KEY,
      JSON.stringify(items.slice(-MAX_HISTORY_ITEMS))
    );
  } catch {
    // ignore
  }
}

function advisorTasksToItems(
  tasks: AdvisorTask[],
  t: (key: string) => string
): Items {
  const byCategory = new Map<string, (ItemTask & { __advisorTask?: AdvisorTask })[]>();

  for (const tsk of tasks) {
    const cat =
      tsk.category && CATEGORY_OPTIONS.includes(tsk.category)
        ? tsk.category
        : DEFAULT_CATEGORY;
    const itemTask = createTask(
      tsk.title,
      tsk.priority,
      tsk.time * 60, // minutes -> seconds
      false,
      0,
      (tsk.whenDo ?? []) as import("@/types/drag-and-drop.model").DayNumber[],
      false
    ) as ItemTask & { __advisorTask?: AdvisorTask };
    itemTask.__advisorTask = tsk;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(itemTask);
  }

  const order = CATEGORY_OPTIONS.filter((c) => byCategory.has(c));
  const rest = [...byCategory.keys()].filter(
    (c) => !CATEGORY_OPTIONS.includes(c)
  );

  return [...order, ...rest].map((catId) => {
    const tasksList = byCategory.get(catId) ?? [];
    const category: TaskCategory = {
      id: catId,
      title: t(`task_manager.categories.${catId}`),
      tasks: tasksList,
    };
    return category;
  });
}

type AiAssistantPanelProps = {
  templateTasks: Items;
  onReplaceTasks?: (items: Items) => void;
  /** When true, Quick Start is rendered elsewhere (e.g. center); only show chat */
  hideQuickStart?: boolean;
  /** Ref to register remove-from-suggestions handler (called when task is dropped to template) */
  onRemoveSuggestedTaskRef?: React.MutableRefObject<
    ((advisorTask: AdvisorTask) => void) | null
  >;
  /** Ref for Quick Start to trigger prompt+ask from outside */
  onPromptFromQuickStartRef?: React.MutableRefObject<
    ((prompt: string) => void) | null
  >;
};

function formatTasksForContext(items: Items, t: (key: string) => string): string {
  return items
    .map((cat) => {
      const catName =
        cat.title || t(`task_manager.categories.${cat.id}`) || String(cat.id);
      const tasksStr = cat.tasks
        .map((task) => {
          const { hours, minutes } = paresSecondToTime(task.time);
          const duration = `${hours}:${minutes}`;
          const days =
            task.whenDo && task.whenDo.length > 0
              ? task.whenDo
                  .map((d) => t(`task_manager.day_names.${d}`))
                  .join(", ")
              : "";
          return `${task.title} — ${duration}${days ? ` (${days})` : ""}`;
        })
        .join("; ");
      return `${catName}: ${tasksStr}`;
    })
    .join("\n");
}

function matchAdvisorTask(a: AdvisorTask, b: AdvisorTask): boolean {
  return (
    a.title === b.title &&
    a.time === b.time &&
    (a.category ?? "") === (b.category ?? "")
  );
}

export function AiAssistantPanel({
  templateTasks,
  onReplaceTasks,
  hideQuickStart = false,
  onRemoveSuggestedTaskRef,
  onPromptFromQuickStartRef,
}: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [suggestedTasks, setSuggestedTasks] = useState<AdvisorTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AiHistoryItem[]>(() => loadHistory());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    if (!onRemoveSuggestedTaskRef) return;
    onRemoveSuggestedTaskRef.current = (advisorTask: AdvisorTask) => {
      setSuggestedTasks((prev) =>
        prev.filter((task) => !matchAdvisorTask(task, advisorTask))
      );
      if (selectedHistoryId) {
        setHistory((prev) =>
          prev.map((h) =>
            h.id === selectedHistoryId && h.suggestedTasks
              ? {
                  ...h,
                  suggestedTasks: h.suggestedTasks.filter(
                    (task) => !matchAdvisorTask(task, advisorTask)
                  ),
                }
              : h
          )
        );
      }
    };
    return () => {
      onRemoveSuggestedTaskRef.current = null;
    };
  }, [
    onRemoveSuggestedTaskRef,
    selectedHistoryId,
  ]);

  const isEmpty = templateTasks.length === 0;
  const presetPrompts = isEmpty
    ? [
        "quick_start.quick_chips.week_plan",
        "quick_start.quick_chips.time_30",
        "quick_start.quick_chips.low_energy",
        "quick_start.quick_chips.no_burnout",
        "quick_start.quick_chips.train_3",
        "quick_start.quick_chips.balance",
      ]
    : [
        "ai_assistant.preset_evaluate",
        "ai_assistant.preset_from_problems",
        "ai_assistant.preset_optimize",
      ];

  const setPreset = (key: string) => {
    setPrompt(t(key));
  };

  const addToHistory = useCallback(
    (promptText: string, answerText: string, tasks?: AdvisorTask[]) => {
      const item: AiHistoryItem = {
        id: crypto.randomUUID(),
        prompt: promptText,
        answer: answerText,
        suggestedTasks: tasks?.length ? tasks : undefined,
        createdAt: Date.now(),
      };
      setHistory((prev) => [...prev, item]);
      return item.id;
    },
    []
  );

  const updateHistoryWithTasks = useCallback(
    (itemId: string, tasks: AdvisorTask[]) => {
      setHistory((prev) =>
        prev.map((h) =>
          h.id === itemId ? { ...h, suggestedTasks: tasks } : h
        )
      );
    },
    []
  );

  const handleAsk = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? prompt).trim();
    if (!text) {
      setAnswer(null);
      setSuggestedTasks([]);
      return;
    }

    setPrompt(text);
    setLoading(true);
    setAnswer(null);
    setSuggestedTasks([]);
    setSelectedHistoryId(null);

    try {
      const tasksContext =
        templateTasks.length > 0
          ? formatTasksForContext(templateTasks, t)
          : undefined;

      const result = await askAiAdvisorAdviceOnly(text, tasksContext);
      const answerText = result.advice || t("ai_assistant.no_answer");
      setAnswer(answerText);
      addToHistory(text, answerText);
    } catch (err) {
      console.error("AI advisor error:", err);
      const errorMsg = t("ai_assistant.error");
      setAnswer(errorMsg);
      addToHistory(text, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormTasks = async () => {
    const adviceToUse = displayedAnswer ?? selectedItem?.answer ?? "";
    if (!adviceToUse.trim()) return;

    setLoading(true);
    setSuggestedTasks([]);

    try {
      const tasksContext =
        templateTasks.length > 0
          ? formatTasksForContext(templateTasks, t)
          : undefined;

      const result = await askAiAdvisorTasksOnly(adviceToUse, tasksContext);
      const tasks = result.tasks ?? [];
      setSuggestedTasks(tasks);

      if (selectedHistoryId) {
        updateHistoryWithTasks(selectedHistoryId, tasks);
      } else {
        const lastItem = history[history.length - 1];
        if (lastItem) updateHistoryWithTasks(lastItem.id, tasks);
      }
    } catch (err) {
      console.error("AI tasks error:", err);
      toast.error(t("ai_assistant.error"));
    } finally {
      setLoading(false);
    }
  };

  const clearAnswer = () => {
    setAnswer(null);
    setSuggestedTasks([]);
    setSelectedHistoryId(null);
  };

  const selectHistoryItem = (item: AiHistoryItem) => {
    setSelectedHistoryId(item.id);
    setPrompt(item.prompt);
    setAnswer(item.answer);
    setSuggestedTasks(item.suggestedTasks ?? []);
    setHistoryOpen(false);
  };

  const handleReplace = () => {
    const tasksToUse = selectedItem?.suggestedTasks ?? suggestedTasks;
    if (tasksToUse.length === 0 || !onReplaceTasks) return;
    const items = advisorTasksToItems(tasksToUse, t);
    onReplaceTasks(items);
    toast.success(t("ai_assistant.tasks_replaced", { count: tasksToUse.length }));
  };

  const displayedAnswer = answer ?? null;
  const selectedItem = selectedHistoryId
    ? history.find((h) => h.id === selectedHistoryId)
    : null;
  const currentSuggestedTasks = selectedItem
    ? (selectedItem.suggestedTasks ?? [])
    : suggestedTasks;

  const handlePromptFromQuickStart = (builtPrompt: string) => {
    setPrompt(builtPrompt);
    handleAsk(builtPrompt);
  };

  useEffect(() => {
    if (!onPromptFromQuickStartRef) return;
    onPromptFromQuickStartRef.current = handlePromptFromQuickStart;
    return () => {
      onPromptFromQuickStartRef.current = null;
    };
  }, [onPromptFromQuickStartRef, handlePromptFromQuickStart]);

  return (
    <div className={`flex w-full flex-col gap-4 ${isEmpty && !hideQuickStart ? "max-w-2xl" : ""}`}>
      {!hideQuickStart && (
        <QuickStartOnboarding
          isEmpty={isEmpty}
          onPromptFromQuickStart={handlePromptFromQuickStart}
          onReplaceTasks={onReplaceTasks}
        />
      )}

      {/* Чат — тільки ввід, історія та текстова відповідь */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20">
                <MessageCircle className="h-5 w-5 text-zinc-200" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-100">
                  {t("ai_assistant.title")}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {t("ai_assistant.description")}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {presetPrompts.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPreset(key)}
                    className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <label
                  htmlFor="aiPrompt"
                  className="block text-xs font-medium text-zinc-400"
                >
                  {t("ai_assistant.prompt_label")}
                </label>
                <textarea
                  id="aiPrompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                  placeholder={t("ai_assistant.prompt_placeholder")}
                  className="mt-2 w-full resize-none bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                  disabled={loading}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <ShieldCheck className="h-4 w-4 text-zinc-500" />
                    {t("ai_assistant.disclaimer")}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAsk()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="animate-pulse">
                        {t("ai_assistant.thinking")}
                      </span>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 text-zinc-200" />
                        {t("ai_assistant.ask")}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Історія */}
              {history.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-black/20">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    <span className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      {t("ai_assistant.history")} ({history.length})
                    </span>
                    {historyOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {historyOpen && (
                    <div className="max-h-48 overflow-y-auto border-t border-white/5 px-3 py-2">
                      {[...history].reverse().map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectHistoryItem(item)}
                          className={`mt-1 block w-full rounded px-2 py-1.5 text-left text-xs transition-colors first:mt-0 hover:bg-white/5 ${
                            selectedHistoryId === item.id
                              ? "bg-white/10 text-zinc-100"
                              : "text-zinc-400"
                          }`}
                        >
                          <span className="line-clamp-1">{item.prompt}</span>
                          <span className="mt-0.5 block text-[10px] text-zinc-500">
                            {new Date(item.createdAt).toLocaleString()}
                            {item.suggestedTasks?.length
                              ? ` • ${item.suggestedTasks.length} ${t("ai_assistant.tasks_short")}`
                              : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Відповідь — тільки текст поради */}
              <div className="rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-zinc-400">
                    {t("ai_assistant.answer_label")}
                  </div>
                  {(displayedAnswer || selectedItem) && (
                    <button
                      type="button"
                      onClick={clearAnswer}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      <Trash2 className="h-4 w-4 text-zinc-400" />
                      {t("ai_assistant.clear")}
                    </button>
                  )}
                </div>
                <div className="ai-answer-scroll mt-2 text-sm leading-relaxed text-zinc-300">
                  {displayedAnswer !== null || selectedItem ? (
                    <div className="whitespace-pre-wrap pr-2">
                      {displayedAnswer ?? selectedItem?.answer ?? ""}
                    </div>
                  ) : (
                    <span className="text-zinc-500">
                      {t("ai_assistant.no_answer_yet")}
                    </span>
                  )}
                </div>
                {/* Кнопка для формування задач на основі поради */}
                {(displayedAnswer !== null || selectedItem) &&
                  currentSuggestedTasks.length === 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleFormTasks}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-md border border-indigo-500/40 bg-indigo-500/20 px-3 py-2 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/30 disabled:opacity-60"
                      >
                        {loading ? (
                          <span className="animate-pulse">
                            {t("ai_assistant.thinking")}
                          </span>
                        ) : (
                          <>
                            <ListTodo className="h-3.5 w-3.5" />
                            {t("ai_assistant.form_tasks")}
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 sm:flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20">
            <Sparkles className="h-5 w-5 text-zinc-200" />
          </div>
        </div>
      </div>

      {/* Окреме вікно — сформовані задачі (як у шаблоні) */}
      {currentSuggestedTasks.length > 0 && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-medium text-indigo-200">
              {t("ai_assistant.suggested_tasks")} ({currentSuggestedTasks.length})
            </span>
            {onReplaceTasks && (
              <button
                type="button"
                onClick={handleReplace}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/50 bg-indigo-500/30 px-3 py-2 text-sm font-medium text-indigo-100 transition-colors hover:bg-indigo-500/40"
              >
                <Replace className="h-4 w-4" />
                {t("ai_assistant.replace_all")}
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <SuggestedTasksPreview
              items={advisorTasksToItems(currentSuggestedTasks, t)}
              draggable={!!onReplaceTasks}
            />
          </div>
        </div>
      )}
    </div>
  );
}
