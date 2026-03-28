import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SaveState = "idle" | "saving" | "saved" | "error";

const saveStateTone: Record<SaveState, string> = {
  idle: "text-zinc-500 dark:text-zinc-400",
  saving: "text-amber-600 dark:text-amber-300",
  saved: "text-emerald-600 dark:text-emerald-300",
  error: "text-red-600 dark:text-red-300",
};

function splitContentToLines(content: string): string[] {
  return content.length > 0 ? content.split("\n") : [""];
}

function normalizeLines(lines: string[]): string[] {
  return lines.length > 0 ? lines : [""];
}

function autosizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${Math.max(el.scrollHeight, 28)}px`;
}

interface DailyJournalCardProps {
  date: string;
  initialContent: string;
  isLoading?: boolean;
  onSave: (content: string) => Promise<void>;
}

const DailyJournalCard = ({
  date,
  initialContent,
  isLoading = false,
  onSave,
}: DailyJournalCardProps) => {
  const [t] = useTranslation();
  const [lines, setLines] = useState<string[]>(() => splitContentToLines(initialContent));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedRef = useRef(initialContent);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(
    initialContent.trim() ? null : 0
  );
  const textareasRef = useRef<Array<HTMLTextAreaElement | null>>([]);
  const content = useMemo(() => lines.join("\n"), [lines]);

  useEffect(() => {
    const nextLines = splitContentToLines(initialContent);
    setLines(nextLines);
    lastSavedRef.current = initialContent;
    setSaveState("idle");
    setActiveLineIndex(initialContent.trim() ? null : 0);
  }, [date, initialContent]);

  useEffect(() => {
    if (activeLineIndex === null) return;
    const textarea = textareasRef.current[activeLineIndex];
    if (!textarea) return;

    textarea.focus();
    const length = textarea.value.length;
    textarea.setSelectionRange(length, length);
    autosizeTextarea(textarea);
  }, [activeLineIndex, lines]);

  useEffect(() => {
    if (saveState !== "saved") return;

    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  const saveCurrentContent = async () => {
    if (isLoading) return;
    if (content === lastSavedRef.current) return;

    setSaveState("saving");
    try {
      await onSave(content);
      lastSavedRef.current = content;
      setSaveState("saved");
    } catch (error) {
      console.error("Failed to save daily journal:", error);
      setSaveState("error");
    }
  };

  const updateLine = (index: number, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = value;
      return normalizeLines(next);
    });
  };

  const removeLineAt = (index: number) => {
    setLines((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return normalizeLines(next);
    });
    setActiveLineIndex((prev) => {
      if (prev === null) return 0;
      return Math.max(0, index - 1);
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const target = event.currentTarget;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const lineValue = lines[index] ?? "";

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const before = lineValue.slice(0, selectionStart);
      const after = lineValue.slice(selectionEnd);

      setLines((prev) => {
        const next = [...prev];
        next[index] = before;
        next.splice(index + 1, 0, after);
        return normalizeLines(next);
      });
      setActiveLineIndex(index + 1);
      return;
    }

    if (
      event.key === "Backspace" &&
      lineValue.length === 0 &&
      lines.length > 1
    ) {
      event.preventDefault();
      removeLineAt(index);
      return;
    }

    if (event.key === "ArrowUp" && selectionStart === 0 && selectionEnd === 0) {
      if (index > 0) {
        event.preventDefault();
        setActiveLineIndex(index - 1);
      }
      return;
    }

    if (
      event.key === "ArrowDown" &&
      selectionStart === lineValue.length &&
      selectionEnd === lineValue.length
    ) {
      if (index < lines.length - 1) {
        event.preventDefault();
        setActiveLineIndex(index + 1);
      }
    }
  };

  const handleLineBlur = async () => {
    setActiveLineIndex(null);
    await saveCurrentContent();
  };

  return (
    <section className="mb-5 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("task_manager.journal.title")}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                aria-label={t("task_manager.journal.info_label")}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={10}
              className="max-w-xs text-xs leading-5 border border-zinc-300/80 bg-white text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <p>{t("task_manager.journal.description")}</p>
              <p className="mt-1">
                Markdown: `#`, `##`, `-`, `1.`, `**bold**`, `- [ ]`
              </p>
            </TooltipContent>
          </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", saveStateTone[saveState])}>
            {t(`task_manager.journal.status.${saveState}`)}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-white/10 dark:bg-white/5" />
      ) : (
        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="space-y-1">
            {lines.map((line, index) => {
              const isActive = activeLineIndex === index;

              return (
                <div
                  key={`${date}-${index}`}
                  className={cn(
                    "rounded-md px-2 py-1 transition-colors",
                    isActive
                      ? "bg-indigo-500/6 dark:bg-indigo-500/8"
                      : "hover:bg-zinc-100/80 dark:hover:bg-white/5"
                  )}
                  onClick={() => setActiveLineIndex(index)}
                >
                  {isActive ? (
                    <textarea
                      ref={(el) => {
                        textareasRef.current[index] = el;
                        autosizeTextarea(el);
                      }}
                      value={line}
                      onChange={(event) => updateLine(index, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                      onBlur={handleLineBlur}
                      rows={1}
                      spellCheck={false}
                      className="w-full resize-none overflow-hidden border-none bg-transparent p-0 font-mono text-[14px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                      placeholder={
                        index === 0 ? t("task_manager.journal.placeholder") : ""
                      }
                    />
                  ) : line.trim() ? (
                    <div className="max-w-none text-zinc-800 dark:text-zinc-200 [&_h1]:my-1 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:my-1 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:my-1 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h4]:my-1 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:leading-tight [&_p]:my-0 [&_p]:text-[14px] [&_p]:leading-7 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_blockquote]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400/60 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-zinc-200/80 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-zinc-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {line}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="min-h-7 font-mono text-[14px] leading-7 text-zinc-400 dark:text-zinc-600">
                      &nbsp;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default DailyJournalCard;
