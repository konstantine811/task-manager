import { Button } from "@/components/ui/button";
import Dialog from "@/components/ui-abc/dialog/dialog";
import { createTask } from "@/components/dnd/utils/createTask";
import { parseTasksFromText } from "@/services/ai/gemini.service";
import { AIParsedTask } from "@/services/ai/gemini.types";
import { ItemTask } from "@/types/drag-and-drop.model";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UniqueIdentifier } from "@dnd-kit/core";

type AddTasksWithAIDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: ItemTask[], containerId: UniqueIdentifier) => void;
  containerId: UniqueIdentifier;
};

export function AddTasksWithAIDialog({
  isOpen,
  onClose,
  onAddTasks,
  containerId,
}: AddTasksWithAIDialogProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<AIParsedTask[] | null>(null);
  const { t } = useTranslation();

  const handleParse = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setParsed(null);

    try {
      const tasks = await parseTasksFromText(input.trim());
      if (tasks.length === 0) {
        toast.info(t("ai.no_tasks_found"));
        return;
      }
      setParsed(tasks);
    } catch (err) {
      console.error("AI parse error:", err);
      toast.error(t("ai.parse_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsed || parsed.length === 0) return;

    const itemTasks: ItemTask[] = parsed.map((p) =>
      createTask(
        p.title,
        p.priority,
        p.time * 60, // convert minutes to seconds for `time` field
        false,
        0,
        [],
        false
      )
    );

    onAddTasks(itemTasks, containerId);
    toast.success(t("ai.tasks_added", { count: itemTasks.length }));
    reset();
    onClose();
  };

  const reset = () => {
    setInput("");
    setParsed(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} setOpen={(open) => !open && handleClose()} className="p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-semibold">{t("ai.dialog_title")}</h3>
        </div>
        <p className="text-sm text-zinc-400">{t("ai.dialog_description")}</p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ai.placeholder")}
          className="min-h-[120px] w-full rounded-lg bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          disabled={loading}
        />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("ai.parsing")}
          </div>
        )}

        {parsed && parsed.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">
              {t("ai.preview_title")} ({parsed.length})
            </p>
            <ul className="space-y-1 text-sm">
              {parsed.map((task, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-white truncate max-w-[70%]">{task.title}</span>
                  <span className="text-zinc-500 text-xs">
                    {task.time > 0 ? `${task.time} хв` : ""} • {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          {parsed ? (
            <Button onClick={handleConfirm} className="chrono-dialog-submit">
              {t("ai.add_tasks")} ({parsed.length})
            </Button>
          ) : (
            <Button
              onClick={handleParse}
              disabled={!input.trim() || loading}
              className="chrono-dialog-submit"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              {t("ai.parse")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
