import React, { forwardRef, useState } from "react";

import InputCombobox from "@/components/ui-abc/inputs/input-combobox";
import { Button } from "@/components/ui/button";
import { GripVertical, Pen, PenOff, X } from "lucide-react";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { SoundTypeElement } from "@/types/sound";
import { useTranslation } from "react-i18next";
import {
  CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
} from "./config/category-style.config";

export interface Props {
  children: React.ReactNode;
  columns?: number;
  label?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
  horizontal?: boolean;
  handleProps?: React.HTMLAttributes<HTMLButtonElement | HTMLDivElement>;
  scrollable?: boolean;
  shadow?: boolean;
  placeholder?: boolean;
  onClick?(): void;
  onRemove?(): void;
  onValueChange?: (value: string) => void;
  options: string[];
}

export const Container = forwardRef<HTMLDivElement, Props>(
  (
    {
      children,
      columns = 1,
      handleProps,
      onRemove,
      label,
      placeholder,
      readOnly = false,
      style,
      options,
      onValueChange,
      ...props
    }: Props,
    ref
  ) => {
    const Component = "div";
    const [isEdit, setIsEdit] = useState(false);
    const [value, setValue] = useState<string>("");
    const [t] = useTranslation();
    return (
      <Component
        {...props}
        ref={ref}
        style={
          {
            ...style,
            "--columns": columns,
          } as React.CSSProperties
        }
        className="relative"
      >
        {label ? (
          <div className="flex items-center justify-between mb-3 px-2 group relative z-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!readOnly && (
                <Button
                  {...handleProps}
                  variant="ghost"
                  size="icon"
                  className="cursor-move hover:bg-white/5 hover:text-white flex-shrink-0 md:hidden h-7 w-7 text-zinc-400"
                >
                  <GripVertical className="w-3 h-3" />
                </Button>
              )}
              {isEdit ? (
                <InputCombobox
                  options={options}
                  onValueChange={setValue}
                  outerValue={label}
                />
              ) : (
                <>
                  {(() => {
                    const style =
                      CATEGORY_STYLE[label] || DEFAULT_CATEGORY_STYLE;
                    const Icon = style.icon;
                    return (
                      <label
                        onDoubleClick={readOnly ? undefined : () => setIsEdit(true)}
                        className={`text-sm font-medium flex items-center gap-2 ${style.color} ${readOnly ? "" : "cursor-pointer"}`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {options.includes(label)
                          ? t(`task_manager.categories.${label}`)
                          : label}
                      </label>
                    );
                  })()}
                </>
              )}
              {!readOnly && (
              <SoundHoverElement
                animValue={0.9}
                hoverTypeElement={SoundTypeElement.SELECT}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => setIsEdit(!isEdit)}
                >
                  {isEdit ? <PenOff className="w-3 h-3" /> : <Pen className="w-3 h-3" />}
                </Button>
              </SoundHoverElement>
              )}
            </div>
            {!readOnly && !isEdit && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                {onRemove && (
                  <SoundHoverElement
                    animValue={0.9}
                    hoverTypeElement={SoundTypeElement.SELECT_2}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-1 text-zinc-600 hover:text-white hover:bg-white/5"
                      onClick={onRemove}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </SoundHoverElement>
                )}
                <SoundHoverElement
                  animValue={0.9}
                  hoverTypeElement={SoundTypeElement.SHIFT}
                  className="hidden md:block"
                >
                  <Button
                    {...handleProps}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-1 cursor-move hover:bg-white/5 hover:text-white text-zinc-400"
                  >
                    <GripVertical className="w-3 h-3" />
                  </Button>
                </SoundHoverElement>
              </div>
            )}
          </div>
        ) : null}
        {placeholder ? children : <ul className="space-y-[1px]">{children}</ul>}
        {isEdit && (
          <div
            onClick={() => {
              setIsEdit(false);
              if (onValueChange && value !== "") {
                onValueChange(value);
              }
            }}
            className="fixed top-0 left-0 w-full h-full z-[1] bg-card/30"
          ></div>
        )}
      </Component>
    );
  }
);
