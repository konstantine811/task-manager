import {
  AdvisorResponse,
  AdvisorTask,
  AIParseTasksResponse,
  AIParsedTask,
  TaskCategoryKey,
} from "./gemini.types";
import { Priority } from "@/types/drag-and-drop.model";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import type { DayNumber } from "@/types/task-template.model";
import { auth } from "@/config/firebase.config";

const getProxyUrl = () => {
  const url = import.meta.env.VITE_AI_PROXY_URL?.trim();
  if (!url) {
    throw new Error("VITE_AI_PROXY_URL is not configured.");
  }
  return url.replace(/\/$/, "");
};

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Sign in to use AI features.");
  }
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function postProxyJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(`${getProxyUrl()}${path}`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | TResponse
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? data.error
        : "AI proxy request failed.";
    throw new Error(message);
  }

  return data as TResponse;
}

export async function parseTasksFromText(
  text: string,
): Promise<AIParsedTask[]> {
  if (!text.trim()) return [];

  const parsed = await postProxyJson<AIParseTasksResponse>(
    "/api/ai/parse-tasks",
    { text },
  );

  if (!Array.isArray(parsed.tasks)) return [];

  return parsed.tasks
    .filter((t): t is AIParsedTask => t && typeof t.title === "string")
    .map((t) => ({
      title: String(t.title).trim(),
      priority: validatePriority(t.priority),
      time: Math.max(0, Number(t.time) || 0),
      category: validateCategory(t.category),
    }))
    .filter((t) => t.title.length > 0);
}

function validatePriority(p: unknown): Priority {
  if (p === Priority.LOW || p === Priority.MEDIUM || p === Priority.HIGH)
    return p;
  return Priority.MEDIUM;
}

function validateCategory(c: unknown): TaskCategoryKey | null {
  if (typeof c === "string" && CATEGORY_OPTIONS.includes(c))
    return c as TaskCategoryKey;
  return null;
}

/** Крок 1: тільки порада */
export async function askAiAdvisorAdviceOnly(
  prompt: string,
  tasksContext?: string,
): Promise<{ advice: string }> {
  if (!prompt.trim()) return { advice: "" };
  const parsed = await postProxyJson<{ advice?: string }>(
    "/api/ai/advisor/advice",
    { prompt: prompt.trim(), tasksContext },
  );
  return {
    advice: typeof parsed.advice === "string" ? parsed.advice.trim() : "",
  };
}

/** Крок 2: тільки задачі на основі поради */
export async function askAiAdvisorTasksOnly(
  previousAdvice: string,
  templateTasksContext?: string,
): Promise<{ tasks: AdvisorTask[] }> {
  if (!previousAdvice.trim()) return { tasks: [] };
  const parsed = await postProxyJson<{ tasks?: unknown[] }>(
    "/api/ai/advisor/tasks",
    { previousAdvice: previousAdvice.trim(), templateTasksContext },
  );
  return { tasks: normalizeAdvisorTasks(parsed.tasks) };
}

export async function askAiAdvisor(
  prompt: string,
  tasksContext?: string,
): Promise<AdvisorResponse> {
  if (!prompt.trim()) return { advice: "" };

  const { advice } = await askAiAdvisorAdviceOnly(prompt, tasksContext);
  if (!advice) return { advice: "" };
  const { tasks } = await askAiAdvisorTasksOnly(advice, tasksContext);
  return { advice, tasks };
}

function normalizeWhenDo(val: unknown): DayNumber[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((n) => Number(n))
    .filter((n) => n >= 1 && n <= 7) as DayNumber[];
}

function normalizeAdvisorTasks(tasks: unknown): AdvisorTask[] {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter(
      (task): task is AdvisorTask =>
        !!task && typeof (task as AdvisorTask).title === "string",
    )
    .map((task) => ({
      title: String(task.title).trim(),
      priority: validatePriority(task.priority),
      time: Math.max(0, Number(task.time) || 0),
      category: validateCategory(task.category),
      whenDo: normalizeWhenDo(task.whenDo),
    }))
    .filter((task) => task.title.length > 0);
}
