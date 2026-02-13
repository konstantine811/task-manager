import { GoogleGenAI } from "@google/genai";
import {
  AIParseTasksResponse,
  AIParsedTask,
  TaskCategoryKey,
} from "./gemini.types";
import { Priority } from "@/types/drag-and-drop.model";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";

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
