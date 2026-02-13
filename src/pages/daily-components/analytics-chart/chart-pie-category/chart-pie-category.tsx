import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { paresSecondToTime } from "@/utils/time.util";
import { getChartColor } from "@/config/chart-colors.config";
import {
  CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
} from "@/components/dnd/config/category-style.config";

interface ChartPieCategoryProps {
  data: CategoryAnalyticsNameEntity;
  width?: number;
  height?: number;
  fillType?: "angle" | "radius";
}

interface PieEntity {
  name: string;
  time: number;
  doneTime: number;
}

const ChartPieCategory = ({
  data,
  width = 320,
  height = 320,
  fillType = "radius",
}: ChartPieCategoryProps) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [t] = useTranslation();

  const entries = Object.entries(data).map(([id, value]) => ({
    name: id,
    time: value.time,
    doneTime: value.countDoneTime,
  }));

  const totalSec = entries.reduce((s, e) => s + e.time, 0);
  const { hours: totalH, minutes: totalM } = paresSecondToTime(totalSec);
  const totalLabel = `${totalH}:${totalM}`;

  useEffect(() => {
    if (!ref.current || entries.length === 0) return;

    const radius = Math.min(width, height) / 2 - 4;
    const innerRadius = radius * 0.5;
    const outerRadius = radius - 4;

    const pie = d3.pie<PieEntity>().value((d) => d.time);
    const timeArcs = pie(entries);

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

    g.selectAll("path.base")
      .data(timeArcs)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => getChartColor(entries[i].name, i))
      .attr("stroke", "none")
      .attr("filter", "url(#chart-3d-shadow-category)");

    if (fillType === "angle") {
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
        .attr("stroke", "none");
    } else if (fillType === "radius") {
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
        .attr("stroke", "none");
    }
  }, [data, width, height, fillType, i18n.language]);

  const legendItems = entries
    .map((e, i) => {
      const pct = totalSec > 0 ? Math.round((e.time / totalSec) * 100) : 0;
      const { hours, minutes } = paresSecondToTime(e.time);
      const label =
        t(`task_manager.categories.${e.name}`) !==
        `task_manager.categories.${e.name}`
          ? t(`task_manager.categories.${e.name}`)
          : e.name;
      const style = CATEGORY_STYLE[e.name] ?? DEFAULT_CATEGORY_STYLE;
      return {
        name: e.name,
        label,
        time: `${hours}:${minutes}`,
        pct,
        color: getChartColor(e.name, i),
        Icon: style.icon,
        colorClass: style.color,
      };
    })
    .sort((a, b) => (data[b.name]?.time ?? 0) - (data[a.name]?.time ?? 0));

  const LEGEND_COLLAPSE_THRESHOLD = 10;
  const canCollapse = legendItems.length > LEGEND_COLLAPSE_THRESHOLD;
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="p-4 sm:p-5">
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
                    className="rounded-md border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-1.5 shadow-sm"
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
  );
};

export default ChartPieCategory;
