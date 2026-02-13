import { GoogleGenAI } from "@google/genai";
import {
  AdvisorResponse,
  AdvisorTask,
  AIParseTasksResponse,
  AIParsedTask,
  TaskCategoryKey,
} from "./gemini.types";
import { Priority } from "@/types/drag-and-drop.model";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

function getClient() {
  if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set in .env");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const CATEGORY_LIST = CATEGORY_OPTIONS.join(", ");
const PRIORITY_LIST = `${Priority.LOW}, ${Priority.MEDIUM}, ${Priority.HIGH}`;

const PARSE_TASKS_SYSTEM = `You are a task extraction assistant. Extract tasks from the user's natural language input.
Return a JSON object with a "tasks" array. Each task has:
- title: string (short, clear task name)
- priority: one of ${PRIORITY_LIST} (default: medium)
- time: number (duration in minutes, 0 if not specified)
- category: one of ${CATEGORY_LIST} or null if unclear

Handle Ukrainian and English. Examples:
"купити молоко о 18:00" -> priority medium, time 0, category null
"важливо: зустріч з клієнтом, 1 година, кар'єра" -> priority high, time 60, category career
"тренування 45 хв здоров'я" -> priority medium, time 45, category health

Return ONLY valid JSON, no markdown or extra text.`;

export async function parseTasksFromText(
  text: string
): Promise<AIParsedTask[]> {
  if (!text.trim()) return [];

  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${PARSE_TASKS_SYSTEM}\n\nUser input:\n${text}`,
    config: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const output = response.text;
  if (!output) throw new Error("Empty response from Gemini");

  let parsed: AIParseTasksResponse;
  try {
    parsed = JSON.parse(output) as AIParseTasksResponse;
  } catch {
    throw new Error("Invalid JSON from AI");
  }

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

const ADVISOR_SYSTEM = `Ти — помічник з планування часу та продуктивності. Відповідай українською, коротко та зрозуміло.
Ти можеш:
- Оцінювати реалістичність плану на день/тиждень
- Формувати нові задачі з опису проблем та обмежень
- Оптимізувати список задач (що прибрати, об’єднати, перенести)
- Давати поради щодо балансу між категоріями (кар'єра, здоров'я тощо)

Поверни JSON об'єкт з двома полями:
1. "advice" — текст поради (без markdown). Завжди заповнюй.
2. "tasks" — масив задач (опційно). Додай, коли користувач просить створити/оптимізувати план, сформувати задачі з проблем, тощо.

Кожна задача в "tasks":
- title: string (коротка назва)
- priority: "low" | "medium" | "high"
- time: number (тривалість у хвилинах)
- category: один з [${CATEGORY_LIST}] або null
- whenDo: масив чисел 1-7 (Пн=1..Нд=7), опційно. Наприклад [1,3,5] для Пн,Ср,Пт.

Категорії: ${CATEGORY_LIST}.`;

const ADVISOR_ADVICE_ONLY_SYSTEM = `Ти — помічник з планування часу та продуктивності. Відповідай українською, коротко та зрозуміло. Ти можеш оцінювати реалістичність плану, давати поради щодо оптимізації. Поверни JSON лише з полем "advice" — текст поради (без markdown).`;

const ADVISOR_TASKS_ONLY_SYSTEM = `Ти формуєш список задач на основі поради. Поверни JSON лише з полем "tasks" — масив задач. Кожна: title, priority ("low"|"medium"|"high"), time (хв), category з [${CATEGORY_LIST}], whenDo — масив 1-7 опційно.`;

/** Крок 1: тільки порада */
export async function askAiAdvisorAdviceOnly(
  prompt: string,
  tasksContext?: string
): Promise<{ advice: string }> {
  if (!prompt.trim()) return { advice: "" };
  const ai = getClient();
  const contextPart = tasksContext
    ? `\n\nКонтекст — задачі з шаблону:\n${tasksContext}\n`
    : "";
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${ADVISOR_ADVICE_ONLY_SYSTEM}\n\n${contextPart}\n\nЗапит:\n${prompt.trim()}`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
  const text = response.text?.trim();
  if (!text) return { advice: "" };
  try {
    const parsed = JSON.parse(text) as { advice?: string };
    return { advice: typeof parsed.advice === "string" ? parsed.advice.trim() : "" };
  } catch {
    const advice = extractAdviceFromPartialJson(text);
    return { advice: advice || "" };
  }
}

/** Крок 2: тільки задачі на основі поради */
export async function askAiAdvisorTasksOnly(
  previousAdvice: string,
  templateTasksContext?: string
): Promise<{ tasks: AdvisorTask[] }> {
  const ai = getClient();
  const contextPart = templateTasksContext
    ? `\n\nПоточні задачі в шаблоні:\n${templateTasksContext}\n`
    : "";
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${ADVISOR_TASKS_ONLY_SYSTEM}\n\n${contextPart}\n\nПорада (на її основі сформуй задачі):\n${previousAdvice.trim()}`,
    config: {
      temperature: 0.5,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
  const text = response.text?.trim();
  if (!text) return { tasks: [] };
  try {
    const parsed = JSON.parse(text) as { tasks?: unknown[] };
    if (!Array.isArray(parsed.tasks)) return { tasks: [] };
    const tasks = parsed.tasks
      .filter((t): t is AdvisorTask => !!t && typeof (t as AdvisorTask).title === "string")
      .map((t) => ({
        title: String((t as AdvisorTask).title).trim(),
        priority: validatePriority((t as AdvisorTask).priority),
        time: Math.max(0, Number((t as AdvisorTask).time) || 0),
        category: validateCategory((t as AdvisorTask).category),
        whenDo: normalizeWhenDo((t as AdvisorTask).whenDo),
      }))
      .filter((t) => t.title.length > 0);
    return { tasks };
  } catch {
    return { tasks: [] };
  }
}

export async function askAiAdvisor(
  prompt: string,
  tasksContext?: string
): Promise<AdvisorResponse> {
  if (!prompt.trim()) return { advice: "" };

  const ai = getClient();
  const contextPart = tasksContext
    ? `\n\nКонтекст — задачі користувача з шаблону:\n${tasksContext}\n`
    : "";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${ADVISOR_SYSTEM}\n\n${contextPart}\n\nЗапит користувача:\n${prompt.trim()}`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim();
  if (!text) return { advice: "" };

  return parseAdvisorResponse(text);
}

/** Парсить відповідь Gemini. Ніколи не повертає raw JSON — лише advice та tasks. */
function parseAdvisorResponse(text: string): AdvisorResponse {
  const normalizeParsed = (parsed: AdvisorResponse): AdvisorResponse => {
    const advice = typeof parsed.advice === "string" ? parsed.advice.trim() : "";
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .filter((t): t is AdvisorTask => t && typeof t.title === "string")
          .map((t) => ({
            title: String(t.title).trim(),
            priority: validatePriority(t.priority),
            time: Math.max(0, Number(t.time) || 0),
            category: validateCategory(t.category),
            whenDo: normalizeWhenDo(t.whenDo),
          }))
          .filter((t) => t.title.length > 0)
      : [];
    return { advice, tasks };
  };

  // 1. Прямий JSON parse
  try {
    const parsed = JSON.parse(text) as AdvisorResponse;
    return normalizeParsed(parsed);
  } catch {}

  // 2. Markdown code block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim()) as AdvisorResponse;
      return normalizeParsed(parsed);
    } catch {}
  }

  // 3. Обрізаний JSON — витягуємо лише advice (ніколи не показуємо raw JSON)
  const advice = extractAdviceFromPartialJson(text);
  if (advice) return { advice };
  // Якщо не вдалось парсити — не показуємо сирий JSON
  return { advice: "" };
}

function extractAdviceFromPartialJson(text: string): string {
  const idx = text.indexOf('"advice"');
  if (idx === -1) return "";
  const after = text.slice(idx + 8);
  const colonIdx = after.indexOf(":");
  if (colonIdx === -1) return "";
  const afterColon = after.slice(colonIdx + 1);
  const openQuote = afterColon.indexOf('"');
  if (openQuote === -1) return "";
  let result = "";
  for (let i = openQuote + 1; i < afterColon.length; i++) {
    if (afterColon[i] === "\\" && afterColon[i + 1]) {
      result += afterColon[i + 1] === "n" ? "\n" : afterColon[i + 1];
      i++;
    } else if (afterColon[i] === '"') break;
    else result += afterColon[i];
  }
  return result.replace(/\\n/g, "\n").trim();
}

function normalizeWhenDo(
  val: unknown
): import("@/types/drag-and-drop.model").DayNumber[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((n) => Number(n))
    .filter((n) => n >= 1 && n <= 7) as import("@/types/drag-and-drop.model").DayNumber[];
}
