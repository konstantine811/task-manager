import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { paresSecondToTime } from "@/utils/time.util";
import {
  getChartColorForAnalyticsCategory,
  resolveAnalyticsCategoryId,
} from "@/config/chart-colors.config";
import {
  CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
} from "@/components/dnd/config/category-style.config";

interface ChartPieCategoryProps {
  data: CategoryAnalyticsNameEntity;
  width?: number;
  height?: number;
  fillType?: "angle" | "radius";
  /** Show only completed tasks time (countDoneTime). When false, shows total time with completion overlay. */
  showCompletedOnly?: boolean;
  /** When true, fill & pct use planned vs completed TIME (doneTime/time). When false, use task count (countDone/countTotal). */
  useTimeCompletion?: boolean;
  /** When true, include all categories even with 0 tasks (like line chart shows all days) */
  includeAllCategories?: boolean;
}

interface PieEntity {
  name: string;
  time: number;
  doneTime: number;
  countDone: number;
  countTotal: number;
  taskPct: number;
  timePct: number;
  segmentValue: number;
  categoryId?: string;
}

const ChartPieCategory = ({
  data,
  width = 320,
  height = 320,
  fillType = "radius",
  showCompletedOnly = false,
  useTimeCompletion = false,
  includeAllCategories = false,
}: ChartPieCategoryProps) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [t] = useTranslation();

  const entries = Object.entries(data).map(([id, value]) => {
    const countTotal = value.taskDone.length + value.taskNoDone.length;
    const taskPct =
      countTotal > 0
        ? Math.round((value.countDone / countTotal) * 100)
        : 0;
    /** Відсоток виконаного часу від запланованого (може бути > 100) */
    const timePct = value.time > 0
      ? Math.round((value.countDoneTime / value.time) * 100)
      : 0;
    return {
      name: id,
      time: value.time,
      doneTime: value.countDoneTime,
      countDone: value.countDone,
      countTotal,
      taskPct,
      timePct,
      /** Segment size: planned time for showCompletedOnly; else same. Min 1 for pie. */
      segmentValue: Math.max(value.time, 1),
      categoryId: value.categoryId,
    };
  });

  const totalSec = entries.reduce((s, e) => s + e.doneTime, 0);
  const { hours: totalH, minutes: totalM } = paresSecondToTime(totalSec);
  const totalLabel = `${totalH}:${totalM}`;

  /** When showCompletedOnly: categories with tasks or with time data; segment = planned time, fill by %.
   * When includeAllCategories: show all entries (including 0). */
  const chartEntries =
    showCompletedOnly && !includeAllCategories
      ? entries.filter(
          (e) => e.countTotal > 0 || e.time > 0 || e.doneTime > 0
        )
      : entries;

  useEffect(() => {
    if (!ref.current) return;

    const radius = Math.min(width, height) / 2 - 4;
    const innerRadius = radius * 0.5;
    const outerRadius = radius - 4;

    if (chartEntries.length === 0) {
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
      const g = svg
        .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
        .attr("overflow", "visible")
        .append("g");
      const arcEmpty = d3
        .arc<d3.PieArcDatum<PieEntity>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .padAngle(0)
        .cornerRadius(4);
      g.append("path")
        .attr(
          "d",
          arcEmpty({
            startAngle: 0,
            endAngle: Math.PI * 2,
            padAngle: 0,
            data: {} as PieEntity,
            index: 0,
            value: 0,
          })
        )
        .attr("fill", "rgba(161,161,170,0.2)")
        .attr("stroke", "rgba(161,161,170,0.3)")
        .attr("stroke-width", 1);
      return;
    }

    const pie = d3.pie<PieEntity>().value((d) => d.segmentValue);
    const timeArcs = pie(chartEntries);

    const arc = d3
      .arc<d3.PieArcDatum<PieEntity>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .padAngle(0.028)
      .cornerRadius(4);

    const arcDoneAngle = d3
      .arc<d3.PieArcDatum<PieEntity>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .padAngle(0.028)
      .cornerRadius(4);

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("overflow", "visible")
      .append("g");

    const defs = svg.append("defs");
    defs
      .append("filter")
      .attr("id", "chart-3d-shadow-category")
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

    const showPieTooltip = (e: MouseEvent, entry: PieEntity) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const label =
        t(`task_manager.categories.${entry.name}`) !==
        `task_manager.categories.${entry.name}`
          ? t(`task_manager.categories.${entry.name}`)
          : entry.name;
      const pct =
        showCompletedOnly
          ? useTimeCompletion ? entry.timePct : entry.taskPct
          : entry.time > 0
            ? Math.round((entry.doneTime / entry.time) * 100)
            : 0;
      const { hours: doneH, minutes: doneM } = paresSecondToTime(entry.doneTime);
      const { hours: plannedH, minutes: plannedM } = paresSecondToTime(entry.time);
      const timeStr =
        entry.time > 0 ? `${doneH}:${doneM} / ${plannedH}:${plannedM}` : `0:00 / 0:00`;
      tooltip.innerHTML = `
        <div class="chart-tooltip-title font-semibold">${label}</div>
        <div class="chart-tooltip-time mt-1">${timeStr} · ${pct}%</div>
      `;
      tooltip.style.display = "block";
      tooltip.style.position = "fixed";
      tooltip.style.left = `${e.clientX + 12}px`;
      tooltip.style.top = `${e.clientY + 12}px`;
      tooltip.style.opacity = "1";
      requestAnimationFrame(() => {
        if (!tooltipRef.current) return;
        const rect = tooltip.getBoundingClientRect();
        let left = e.clientX + 12;
        let top = e.clientY + 12;
        if (left + rect.width > window.innerWidth - 8) left = e.clientX - rect.width - 12;
        if (top + rect.height > window.innerHeight - 8) top = e.clientY - rect.height - 12;
        if (top < 8) top = 8;
        if (left < 8) left = 8;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });
    };
    const hidePieTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none";
      }
    };

    if (showCompletedOnly) {
      /** Base: empty/grey outline per segment (100%) */
      g.selectAll("path.base")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", "rgba(161,161,170,0.15)")
        .attr("stroke", "rgba(161,161,170,0.35)")
        .attr("stroke-width", 1)
        .attr("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mousemove", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mouseleave", hidePieTooltip);
      /** Fill: category color to taskPct or timePct within each segment */
      g.selectAll("path.done")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", (d, i) => {
          const entry = chartEntries[i];
          const progress = useTimeCompletion
            ? Math.min(entry.timePct / 100, 1)
            : Math.min(entry.taskPct / 100, 1);
          const angleRange = d.endAngle - d.startAngle;
          const newEndAngle = d.startAngle + angleRange * progress;
          return arcDoneAngle({ ...d, endAngle: newEndAngle });
        })
        .attr("fill", (_, i) =>
          getChartColorForAnalyticsCategory(
            chartEntries[i].categoryId ?? chartEntries[i].name,
            i,
            t,
          ),
        )
        .attr("stroke", "none")
        .attr("filter", "url(#chart-3d-shadow-category)")
        .attr("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mousemove", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mouseleave", hidePieTooltip);
    } else {
      g.selectAll("path.base")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (_, i) =>
          getChartColorForAnalyticsCategory(
            chartEntries[i].categoryId ?? chartEntries[i].name,
            i,
            t,
          ),
        )
        .attr("stroke", "none")
        .attr("filter", "url(#chart-3d-shadow-category)")
        .attr("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mousemove", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mouseleave", hidePieTooltip);
    }

    if (!showCompletedOnly && fillType === "angle") {
      g.selectAll("path.done")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", (d, i) => {
          const entry = entries[i];
          const progress = entry.time > 0 ? entry.doneTime / entry.time : 0;
          const angleRange = d.endAngle - d.startAngle;
          const newEndAngle = d.startAngle + angleRange * Math.min(progress, 1);
          return arcDoneAngle({ ...d, endAngle: newEndAngle });
        })
        .attr("fill", "rgba(59,130,246,0.6)")
        .attr("stroke", "none")
        .attr("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mousemove", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mouseleave", hidePieTooltip);
    } else if (!showCompletedOnly && fillType === "radius") {
      g.selectAll("path.done")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", (d, i) => {
          const entry = entries[i];
          const progress = Math.max(
            0,
            Math.min(entry.time > 0 ? entry.doneTime / entry.time : 0, 1)
          );
          const currentOuter =
            innerRadius + (outerRadius - innerRadius) * progress;
          const dynamicArc = d3
            .arc<d3.PieArcDatum<PieEntity>>()
            .innerRadius(innerRadius)
            .outerRadius(currentOuter)
            .padAngle(0.028)
            .cornerRadius(4);
          return dynamicArc(d);
        })
        .attr("fill", "rgba(59,130,246,0.7)")
        .attr("stroke", "none")
        .attr("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mousemove", function (event, d) {
          showPieTooltip(event, d.data);
        })
        .on("mouseleave", hidePieTooltip);
    }
  }, [chartEntries, width, height, fillType, showCompletedOnly, useTimeCompletion, includeAllCategories, i18n.language, t]);

  const legendItems = (
    includeAllCategories ? chartEntries : showCompletedOnly ? entries : chartEntries
  ).filter((e) =>
    includeAllCategories ||
    !showCompletedOnly ||
    e.countTotal > 0 ||
    (useTimeCompletion && (e.time > 0 || e.doneTime > 0))
  )
    .map((e, i) => {
      /** Task completion %: useTimeCompletion ? timePct : count-based when showCompletedOnly else time-based */
      const pct = showCompletedOnly
        ? (useTimeCompletion ? e.timePct : e.taskPct)
        : e.time > 0
          ? Math.round(Math.min(100, (e.doneTime / e.time) * 100))
          : 0;
      const { hours: doneH, minutes: doneM } = paresSecondToTime(e.doneTime);
      const { hours: plannedH, minutes: plannedM } = paresSecondToTime(e.time);
      const timeLabel =
        e.time > 0 ? `${doneH}:${doneM} / ${plannedH}:${plannedM}` : `0:00 / 0:00`;
      const label =
        t(`task_manager.categories.${e.name}`) !==
        `task_manager.categories.${e.name}`
          ? t(`task_manager.categories.${e.name}`)
          : e.name;
      /** Канонічний id (leisure тощо) — той самий резолвер, що й заливка сегмента */
      const rawKey = e.categoryId ?? e.name;
      const canonicalId = resolveAnalyticsCategoryId(rawKey, t);
      const style = CATEGORY_STYLE[canonicalId] ?? DEFAULT_CATEGORY_STYLE;
      const chartHex = getChartColorForAnalyticsCategory(rawKey, i, t);
      return {
        name: e.name,
        label,
        time: timeLabel,
        pct,
        color: chartHex,
        Icon: style.icon,
        colorClass: style.color,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const LEGEND_COLLAPSE_THRESHOLD = 10;
  const canCollapse = legendItems.length > LEGEND_COLLAPSE_THRESHOLD;
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-visible chrono-chart-plot-bg"
    >
      <div
        ref={tooltipRef}
        className="chart-tooltip fixed z-[100] max-w-xs p-2 text-sm rounded-lg shadow-xl pointer-events-none hidden"
        aria-hidden
      />
      <div className="relative z-10 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-stretch">
          <div className="md:col-span-3 flex items-center justify-center p-6 sm:p-8">
            <div className="relative w-64 aspect-square md:w-72 shrink-0">
              <div className="absolute inset-0 rounded-full blur-3xl bg-rose-500/10 dark:bg-rose-500/15" />
              <svg
                ref={ref}
                className="relative w-full h-full overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
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
                    className="rounded-md border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${item.colorClass}`}
                        />
                        <span
                          className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate"
                          title={item.label}
                        >
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
                          width: `${Math.min(100, item.pct)}%`,
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
  );
};

export default ChartPieCategory;
