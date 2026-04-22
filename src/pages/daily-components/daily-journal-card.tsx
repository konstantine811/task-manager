import { cn } from "@/lib/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImagePlus,
  Info,
} from "lucide-react";
import {
  BlockTypeSelect,
  ButtonWithTooltip,
  BoldItalicUnderlineToggles,
  CreateLink,
  imagePlugin,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  activeEditor$,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  useCellValue,
} from "@mdxeditor/editor";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { FORMAT_ELEMENT_COMMAND } from "lexical";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isTouchDevice } from "@/utils/touch-inspect";
import { journalAlignmentPersistencePlugin } from "./journal-alignment-persistence-plugin";
import "@mdxeditor/editor/style.css";

type SaveState = "idle" | "saving" | "saved" | "error";

const normalizeMarkdown = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\s+$/g, "");

const saveStateTone: Record<SaveState, string> = {
  idle: "text-zinc-500 dark:text-zinc-400",
  saving: "text-amber-600 dark:text-amber-300",
  saved: "text-emerald-600 dark:text-emerald-300",
  error: "text-red-600 dark:text-red-300",
};

interface DailyJournalCardProps {
  date: string;
  initialContent: string;
  isLoading?: boolean;
  onSave: (content: string) => Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
}

interface PendingSave {
  content: string;
  date: string;
}

interface AlignmentToolbarButtonProps {
  mode: "left" | "center" | "right";
  title: string;
  children: ReactNode;
}

const AlignmentToolbarButton = ({
  mode,
  title,
  children,
}: AlignmentToolbarButtonProps) => {
  const editor = useCellValue(activeEditor$);

  return (
    <ButtonWithTooltip
      title={title}
      onClick={() => {
        if (!editor) return;
        editor.focus();
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, mode);
      }}
    >
      {children}
    </ButtonWithTooltip>
  );
};

const DailyJournalCard = ({
  date,
  initialContent,
  isLoading = false,
  onSave,
  onUploadImage,
}: DailyJournalCardProps) => {
  const [t] = useTranslation();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isTouch = isTouchDevice;

  const lastSavedRef = useRef(initialContent);
  const latestContentRef = useRef(initialContent);
  const latestContentDateRef = useRef(date);
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const scopeRef = useRef(0);
  const activeDateRef = useRef(date);
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const isEditorFocusedRef = useRef(false);
  const lastAppliedInitialRef = useRef(initialContent);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const enqueueSave = useCallback(
    async (nextContent: string, sourceDate: string) => {
      if (isLoading) return;
      if (sourceDate !== activeDateRef.current) return;
      if (nextContent === lastSavedRef.current) return;

      pendingSaveRef.current = { content: nextContent, date: sourceDate };
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      while (pendingSaveRef.current !== null) {
        const { content: contentToSave, date: saveDate } =
          pendingSaveRef.current;
        pendingSaveRef.current = null;

        if (saveDate !== activeDateRef.current) continue;
        if (contentToSave === lastSavedRef.current) continue;

        const saveScope = scopeRef.current;
        setSaveState("saving");

        try {
          await onSave(contentToSave);
          if (saveScope !== scopeRef.current) continue;

          lastSavedRef.current = contentToSave;
          setSaveState("saved");
        } catch (error) {
          if (saveScope === scopeRef.current) {
            console.error("Failed to save daily journal:", error);
            setSaveState("error");
          }
        }
      }

      isSavingRef.current = false;
    },
    [isLoading, onSave],
  );

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (latestContentDateRef.current !== activeDateRef.current) return;
    void enqueueSave(latestContentRef.current, latestContentDateRef.current);
  }, [enqueueSave]);

  const scheduleSave = useCallback(
    (nextContent: string, sourceDate: string) => {
      if (isLoading) return;
      if (sourceDate !== activeDateRef.current) return;
      if (nextContent === lastSavedRef.current) return;

      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        saveTimeoutRef.current = null;
        void enqueueSave(nextContent, sourceDate);
      }, 900);
    },
    [enqueueSave, isLoading],
  );

  useEffect(() => {
    activeDateRef.current = date;
    scopeRef.current += 1;

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    pendingSaveRef.current = null;
    isSavingRef.current = false;
    lastSavedRef.current = initialContent;
    latestContentRef.current = initialContent;
    latestContentDateRef.current = date;
    lastAppliedInitialRef.current = initialContent;

    setSaveState("idle");

    const editorMarkdown = editorRef.current?.getMarkdown() ?? "";
    if (normalizeMarkdown(editorMarkdown) !== normalizeMarkdown(initialContent)) {
      editorRef.current?.setMarkdown(initialContent);
    }
  }, [date]);

  useEffect(() => {
    if (initialContent === lastAppliedInitialRef.current) return;
    lastAppliedInitialRef.current = initialContent;

    // Parent echoes local autosave back via props.
    // If content is already the same in editor, do not re-apply markdown
    // because that resets selection/caret to the end.
    if (
      normalizeMarkdown(initialContent) ===
      normalizeMarkdown(latestContentRef.current)
    ) {
      lastSavedRef.current = initialContent;
      return;
    }

    // Do not overwrite active local typing with remote updates.
    if (isEditorFocusedRef.current) return;
    const hasUnsavedLocal =
      normalizeMarkdown(latestContentRef.current) !==
      normalizeMarkdown(lastSavedRef.current);
    if (hasUnsavedLocal) return;

    lastSavedRef.current = initialContent;
    latestContentRef.current = initialContent;
    latestContentDateRef.current = activeDateRef.current;
    setSaveState("idle");

    const editorMarkdown = editorRef.current?.getMarkdown() ?? "";
    if (normalizeMarkdown(editorMarkdown) !== normalizeMarkdown(initialContent)) {
      editorRef.current?.setMarkdown(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (saveState !== "saved") return;

    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      if (latestContentDateRef.current !== activeDateRef.current) return;
      void enqueueSave(latestContentRef.current, latestContentDateRef.current);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [enqueueSave]);

  const uploadImageAndInsert = useCallback(
    async (file: File): Promise<string> => {
      if (!onUploadImage) {
        throw new Error("Image upload is not available");
      }

      setIsUploadingImage(true);
      setSaveState("saving");

      try {
        const imageUrl = await onUploadImage(file);
        return imageUrl;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [onUploadImage],
  );

  const handlePickImageClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.currentTarget.value = "";
      if (!file || !onUploadImage) return;

      try {
        const imageUrl = await uploadImageAndInsert(file);
        const alt = file.name.replace(/\.[^.]+$/, "") || "image";
        editorRef.current?.insertMarkdown(`\n![${alt}](${imageUrl})\n`);
      } catch (error) {
        console.error("Failed to upload journal image:", error);
        setSaveState("error");
      }
    },
    [onUploadImage, uploadImageAndInsert],
  );

  const toolbarContents = useCallback(
    () => (
      <>
        <UndoRedo />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <AlignmentToolbarButton
          title={t("task_manager.journal.align_left")}
          mode="left"
        >
          <AlignLeft className="h-4 w-4" />
        </AlignmentToolbarButton>
        <AlignmentToolbarButton
          title={t("task_manager.journal.align_center")}
          mode="center"
        >
          <AlignCenter className="h-4 w-4" />
        </AlignmentToolbarButton>
        <AlignmentToolbarButton
          title={t("task_manager.journal.align_right")}
          mode="right"
        >
          <AlignRight className="h-4 w-4" />
        </AlignmentToolbarButton>
        {onUploadImage && !isTouch && (
          <ButtonWithTooltip
            title={t("task_manager.journal.add_image")}
            onClick={handlePickImageClick}
            disabled={isUploadingImage}
          >
            <ImagePlus className="h-4 w-4" />
          </ButtonWithTooltip>
        )}
        <ListsToggle />
        <CreateLink />
        <InsertThematicBreak />
      </>
    ),
    [handlePickImageClick, isTouch, isUploadingImage, onUploadImage, t],
  );

  const editorPlugins = useMemo(
    () => [
      headingsPlugin(),
      quotePlugin(),
      listsPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      imagePlugin({
        imageUploadHandler: onUploadImage ? uploadImageAndInsert : undefined,
      }),
      journalAlignmentPersistencePlugin(),
      thematicBreakPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarClassName: "journal-mdx-toolbar",
        toolbarContents,
      }),
    ],
    [onUploadImage, toolbarContents, uploadImageAndInsert],
  );

  return (
    <section className="mb-5 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("task_manager.journal.title")}
            </h3>
            {!isTouch && (
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
                    Markdown shortcuts: `#`, `-`, `**`, `[link]`
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {onUploadImage && (
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInputChange}
          />
        )}

        <div className="flex items-center gap-2">
          {isTouch && onUploadImage && (
            <button
              type="button"
              onClick={handlePickImageClick}
              disabled={isUploadingImage}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300/80 bg-zinc-100/80 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
            >
              <ImagePlus className="h-4 w-4" />
              <span>{t("task_manager.journal.add_image")}</span>
            </button>
          )}
          <span className={cn("text-xs font-medium", saveStateTone[saveState])}>
            {t(`task_manager.journal.status.${saveState}`)}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-white/10 dark:bg-white/5" />
      ) : (
        <div
          className="overflow-hidden rounded-t-xl border border-zinc-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5"
          onFocusCapture={() => {
            isEditorFocusedRef.current = true;
          }}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget as Node | null;
            if (nextTarget && event.currentTarget.contains(nextTarget)) return;
            isEditorFocusedRef.current = false;
            flushSave();
          }}
        >
          <MDXEditor
            ref={editorRef}
            markdown={initialContent}
            onChange={(markdown, initialMarkdownNormalize) => {
              latestContentRef.current = markdown;
              latestContentDateRef.current = activeDateRef.current;
              if (initialMarkdownNormalize) {
                lastSavedRef.current = markdown;
                return;
              }
              if (saveState === "error") {
                setSaveState("idle");
              }
              scheduleSave(markdown, activeDateRef.current);
            }}
            placeholder={t("task_manager.journal.placeholder")}
            spellCheck={false}
            className="journal-mdx-editor"
            contentEditableClassName="journal-mdx-content"
            plugins={editorPlugins}
          />
        </div>
      )}
    </section>
  );
};

export default memo(DailyJournalCard);
