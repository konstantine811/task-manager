import {
  ItemTimeMap,
  ItemTimeMapKeys,
} from "@/types/analytics/task-analytics.model";
import { paresSecondToTime } from "@/utils/time.util";
import * as d3 from "d3";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import useChartTooltip from "../chart/hooks/use-chart-tooltip";
import { isTouchDevice } from "@/utils/touch-inspect";
import { getChartColor } from "@/config/chart-colors.config";
import {
  CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
} from "@/components/dnd/config/category-style.config";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

interface PieChartProps {
  data: ItemTimeMap;
  width?: number;
  height?: number;
  type: ItemTimeMapKeys;
  /** Chart title (shown inside the card) */
  title?: string;
  /** Map task title → category id (for consistent colors when type === task) */
  taskToCategoryMap?: Record<string, string>;
  /** Map category id → display title (for custom categories when type === category) */
  categoryIdToTitle?: Record<string, string>;
}

const ChartPieItem = ({
  data,
  width = 320,
  height = 320,
  type,
  title: titleKey,
  taskToCategoryMap,
  categoryIdToTitle,
}: PieChartProps) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [t] = useTranslation();
  const { TooltipElement, showTooltip, hideTooltip } = useChartTooltip();
  const activeNodeRef = useRef<SVGGElement | null>(null);
  const onHideTooltip = useCallback((self: SVGGElement) => {
    d3.select(self).transition().duration(200).attr("transform", "scale(1)");
  }, []);

  const handleInteraction = useCallback(
    (
      self: SVGGElement,
      d: d3.PieArcDatum<{ name: string; value: number }>,
      event: PointerEvent,
      arc: d3.Arc<null, d3.PieArcDatum<{ name: string; value: number }>>,
      showTooltipFn: (data: {
        event: PointerEvent;
        title: string;
        time: number;
      }) => void,
      hideTooltipFn: () => void,
      onHideTooltipFn: (el: SVGGElement) => void,
      activeRef: RefObject<SVGGElement | null>
    ) => {
      const activeNode = activeRef.current;
      if (activeNode === self) {
        onHideTooltipFn(self);
        hideTooltipFn();
        activeRef.current = null;
        return;
      }
      if (activeNode && activeNode !== self) {
        onHideTooltipFn(activeNode);
        hideTooltipFn();
      }
      activeRef.current = self;
      d3.select(self)
        .transition()
        .duration(100)
        .attr(
          "transform",
          `translate(${arc.centroid(d)}) scale(1.08) translate(${-arc.centroid(d)[0]}, ${-arc.centroid(d)[1]})`
        );
      const title =
        type === ItemTimeMapKeys.task
          ? d.data.name
          : t(`task_manager.categories.${d.data.name}`) !==
              `task_manager.categories.${d.data.name}`
            ? t(`task_manager.categories.${d.data.name}`)
            : d.data.name;
      showTooltipFn({ event, title, time: d.data.value });
    },
    [type, t]
  );

  const names = Object.keys(data);
  const values = Object.values(data);
  const dataset = names.map((name, i) => ({ name, value: values[i] }));
  const totalSec = dataset.reduce((s, d) => s + d.value, 0);
  const { hours: totalH, minutes: totalM } = paresSecondToTime(totalSec);
  const totalLabel = `${totalH}:${totalM}`;

  useEffect(() => {
    if (!ref.current || dataset.length === 0) return;

    const radius = Math.min(width, height) / 2 - 4;
    const innerRadius = radius * 0.5;
    const outerRadius = radius - 4;

    const pie = d3.pie<{ name: string; value: number }>().value((d) => d.value);
    const arc = d3
      .arc<d3.PieArcDatum<{ name: string; value: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .padAngle(0.028)
      .cornerRadius(4);

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const arcs = pie(dataset);

    const g = svg
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .append("g");

    const defs = svg.append("defs");
    defs
      .append("filter")
      .attr("id", "chart-3d-shadow-item")
      .attr("x", "-60%")
      .attr("y", "-60%")
      .attr("width", "220%")
      .attr("height", "220%")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 6)
      .attr("stdDeviation", 10)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.35);

    const getStyleKey = (name: string) => {
      if (type === ItemTimeMapKeys.task && taskToCategoryMap?.[name]) {
        const catId = taskToCategoryMap[name];
        if (
          categoryIdToTitle?.[catId] &&
          CATEGORY_OPTIONS.includes(categoryIdToTitle[catId])
        )
          return categoryIdToTitle[catId];
        return catId;
      }
      if (
        type === ItemTimeMapKeys.category &&
        categoryIdToTitle?.[name] &&
        CATEGORY_OPTIONS.includes(categoryIdToTitle[name])
      )
        return categoryIdToTitle[name];
      return name;
    };

    const getColor = (name: string, i: number) =>
      getChartColor(getStyleKey(name), i);

    const paths = g
      .selectAll("path")
      .data(arcs)
      .join("path")
      .attr("d", arc)
      .attr("id", (d) => `arc-${d.data.name}`)
      .attr("fill", (d, i) => getColor(d.data.name, i))
      .attr("stroke", "none")
      .attr("transform", "scale(1)")
      .attr("filter", "url(#chart-3d-shadow-item)");

    if (type === ItemTimeMapKeys.task) {
      if (isTouchDevice) {
        paths.on("pointerdown", function (event, d) {
          handleInteraction(
            this as SVGGElement,
            d,
            event,
            arc,
            showTooltip,
            hideTooltip,
            onHideTooltip,
            activeNodeRef
          );
        });
      } else {
        paths.on("pointerenter", function (event, d) {
          handleInteraction(
            this as SVGGElement,
            d,
            event,
            arc,
            showTooltip,
            hideTooltip,
            onHideTooltip,
            activeNodeRef
          );
        });
        paths.on("mouseleave", function () {
          if (activeNodeRef.current === this) {
            onHideTooltip(this as SVGGElement);
            hideTooltip();
            activeNodeRef.current = null;
          }
        });
      }
    }
  }, [
    data,
    width,
    height,
    type,
    taskToCategoryMap,
    categoryIdToTitle,
    handleInteraction,
    showTooltip,
    hideTooltip,
    onHideTooltip,
    i18n.language,
  ]);

  const legendItems = dataset
    .map((d, i) => {
      const pct = totalSec > 0 ? Math.round((d.value / totalSec) * 100) : 0;
      const { hours, minutes } = paresSecondToTime(d.value);
      const label =
        type === ItemTimeMapKeys.task
          ? d.name
          : (() => {
              const raw =
                CATEGORY_OPTIONS.includes(d.name)
                  ? d.name
                  : categoryIdToTitle?.[d.name] ?? d.name;
              return CATEGORY_OPTIONS.includes(raw)
                ? t(`task_manager.categories.${raw}`)
                : raw;
            })();
      const styleKey =
        type === ItemTimeMapKeys.task && taskToCategoryMap?.[d.name]
          ? (() => {
              const catId = taskToCategoryMap[d.name];
              return categoryIdToTitle?.[catId] &&
                CATEGORY_OPTIONS.includes(categoryIdToTitle[catId])
                ? categoryIdToTitle[catId]
                : catId;
            })()
          : type === ItemTimeMapKeys.category &&
              categoryIdToTitle?.[d.name] &&
              CATEGORY_OPTIONS.includes(categoryIdToTitle[d.name])
            ? categoryIdToTitle[d.name]
            : d.name;
      const style = CATEGORY_STYLE[styleKey] ?? DEFAULT_CATEGORY_STYLE;
      const Icon = style.icon;
      return {
        name: d.name,
        label,
        time: `${hours}:${minutes}`,
        pct,
        color: getChartColor(styleKey, i),
        Icon,
        colorClass: style.color,
      };
    })
    .sort((a, b) => {
      const va = data[a.name] ?? 0;
      const vb = data[b.name] ?? 0;
      return vb - va;
    });

  const LEGEND_COLLAPSE_THRESHOLD = 10;
  const canCollapse = legendItems.length > LEGEND_COLLAPSE_THRESHOLD;
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="relative">
      {type === ItemTimeMapKeys.task && TooltipElement}
      <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-2 sm:p-3">
          {titleKey && (
            <div className="mb-3">
              <h4 className="text-sm font-normal text-zinc-500 dark:text-zinc-400 text-left py-1 px-0">
                {t(titleKey)}
              </h4>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-stretch">
            <div className="md:col-span-3 flex items-center justify-center">
              <div className="relative w-64 aspect-square md:w-72">
                <div className="absolute inset-0 rounded-full blur-3xl bg-rose-500/10 dark:bg-rose-500/15" />
                <svg
                  ref={ref}
                  className="relative w-full h-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t("chart.chart_total")}
                    </div>
                    <div className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                      {totalLabel}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t("chart.chart_hours_mins")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col min-h-0">
              <div
                className={`flex-1 min-h-0 space-y-2 pr-1 ${
                  canCollapse && isCollapsed
                    ? "max-h-[min(320px,40vh)] overflow-y-auto"
                    : "overflow-visible"
                }`}
              >
                {legendItems.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <div
                      key={item.name}
                      className=" rounded-md border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${item.colorClass}`}
                          />
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
                          {item.time} · {item.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-200/60 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 min-w-[2px]"
                          style={{
                            width: `${item.pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {canCollapse && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed((c) => !c)}
                  className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  {isCollapsed
                    ? t("chart.expand_more", {
                        count: legendItems.length - LEGEND_COLLAPSE_THRESHOLD,
                      })
                    : t("chart.collapse")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPieItem;
