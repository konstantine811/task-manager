import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import { paresSecondToTime } from "@/utils/time.util";
import useChartTooltip from "../../../chart/hooks/use-chart-tooltip";
import {
  TaskAnalyticsBarOrientation,
  TaskAnalyticsData,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import { useThemeStore } from "@/storage/themeStore";
import { ThemePalette, ThemeStaticPalette, ThemeType } from "@/config/theme-colors.config";
import { isTouchDevice } from "@/utils/touch-inspect";
import { useTranslation } from "react-i18next";

const ChartTimeStackTasks = ({
  data,
  direction = "horizontal",
}: {
  data: TaskAnalyticsIdEntity;
  direction?: TaskAnalyticsBarOrientation;
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const { TooltipElement, showTooltip, hideTooltip } = useChartTooltip();
  const [t] = useTranslation();
  const themeName = useThemeStore((s) => s.selectedTheme);
  const colors = ThemePalette[themeName ?? ThemeType.DARK] ?? ThemePalette[ThemeType.DARK];
  const [svgHeight, setSvgHeight] = useState<number>(0);
  const activeNodeRef = useRef<SVGGElement | null>(null);
  const barSize = 30;
  const timeLength = 600;

  const onHideTooltip = useCallback((self: SVGGElement) => {
    d3.select(self)
      .select("rect")
      .transition()
      .duration(300)
      .attr("transform", "scale(1)")
      .attr("fill", "transparent");
  }, []);

  const handleInteraction = useCallback(
    (self: SVGGElement, event: PointerEvent, d: TaskAnalyticsData) => {
      const activeNode = activeNodeRef.current;

      // Якщо такий же — приховуємо
      if (activeNode === self) {
        onHideTooltip(self);
        hideTooltip();
        activeNodeRef.current = null;
        return;
      }

      // Якщо інший активний — ховаємо
      if (activeNode && activeNode !== self) {
        onHideTooltip(activeNode);
        hideTooltip();
      }

      activeNodeRef.current = self;

      d3.select(self)
        .select("rect")
        .transition()
        .duration(200)
        .attr("fill", colors["foreground"]);

      showTooltip({
        event,
        title: d.title,
        time: d.isDone ? d.timeDone : d.time,
      });
    },
    [showTooltip, hideTooltip, onHideTooltip, colors]
  );

  useEffect(() => {
    if (!ref.current) return;

    const margin =
      direction === "horizontal"
        ? { top: 0, right: 3, bottom: 30, left: 4 }
        : { top: 3, right: 0, bottom: 7, left: 17 };

    const width =
      direction === "horizontal"
        ? timeLength + margin.left + margin.right
        : barSize + margin.left + margin.right;

    const height =
      direction === "horizontal"
        ? barSize + margin.top + margin.bottom + 15
        : timeLength + margin.top + margin.bottom;
    setSvgHeight(height);
    const tasks = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => {
        if (a.isDone && !b.isDone) return -1;
        if (!a.isDone && b.isDone) return 1;
        return 0;
      });

    const totalTime = d3.sum(tasks, (d) => d.time);
    const doneTime = d3.sum(tasks, (d) =>
      d.isDone ? (d.timeDone || d.time) : 0
    );

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const group = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const scale = d3
      .scaleLinear()
      .domain([0, totalTime])
      .range(direction === "horizontal" ? [0, innerW] : [innerH, 0]);

    // create gradient for full bar (base layer)
    const redOffset =
      totalTime > 0 ? `${(16 * 3600 * 100) / totalTime}%` : "0%";
    const yellowOffset =
      totalTime > 0 ? `${(10 * 3600 * 100) / totalTime}%` : "0%";

    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "stackGradient")
      .attr("x1", direction === "horizontal" ? "0%" : "0%")
      .attr("y1", direction === "horizontal" ? "0%" : "100%")
      .attr("x2", direction === "horizontal" ? "100%" : "0%")
      .attr("y2", direction === "horizontal" ? "0%" : "0%");

    gradient
      .append("stop")
      .attr("offset", yellowOffset)
      .attr("stop-color", ThemeStaticPalette.green);
    gradient
      .append("stop")
      .attr("offset", redOffset)
      .attr("stop-color", ThemeStaticPalette.yellow);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colors["destructive"]);

    // 1. Base: full gradient bar
    group
      .append("rect")
      .attr(direction === "horizontal" ? "x" : "y", 0)
      .attr(direction === "horizontal" ? "y" : "x", 0)
      .attr(
        direction === "horizontal" ? "width" : "height",
        direction === "horizontal" ? innerW : innerH
      )
      .attr(direction === "horizontal" ? "height" : "width", barSize)
      .attr("fill", "url(#stackGradient)")
      .attr("rx", 2);

    // 2. Blue overlay at the start for all completed tasks (0 to doneTime)
    if (doneTime > 0) {
      const blueColor = colors["primary"];
      const segSize = Math.abs(scale(doneTime) - scale(0));
      const isHor = direction === "horizontal";
      const rect = group.append("rect").attr("fill", blueColor).attr("rx", 2);
      if (isHor) {
        rect.attr("x", 0).attr("y", 0).attr("width", segSize).attr("height", barSize);
      } else {
        rect
          .attr("x", 0)
          .attr("y", scale(doneTime))
          .attr("width", barSize)
          .attr("height", segSize);
      }
    }

    let offset = 0;

    const taskGroups = group
      .selectAll("g.task")
      .data(tasks)
      .join("g")
      .attr("class", "task");

    if (isTouchDevice) {
      taskGroups.on("pointerdown", function (event, d) {
        handleInteraction(this as SVGGElement, event, d);
      });
    } else {
      taskGroups
        .on("pointerenter", function (event, d) {
          handleInteraction(this as SVGGElement, event, d);
        })
        .on("mouseleave", function () {
          if (activeNodeRef.current === this) {
            onHideTooltip(this as SVGGElement);
            hideTooltip();
            activeNodeRef.current = null;
          }
        });
    }

    taskGroups
      .append("rect")
      .attr("x", (d) =>
        direction === "horizontal"
          ? (() => {
              const current = offset;
              offset += d.time;
              return scale(current);
            })()
          : 0
      )
      .attr("y", (d) =>
        direction === "vertical"
          ? (() => {
              const current = offset;
              offset += d.time;
              return scale(current + d.time);
            })()
          : 0
      )
      .attr("width", (d) =>
        direction === "horizontal" ? scale(d.time) - scale(0) : barSize
      )
      .attr("height", (d) =>
        direction === "vertical"
          ? scale(offset - d.time) - scale(offset)
          : barSize
      )
      .attr("fill", "transparent")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .attr("vector-effect", "non-scaling-stroke");

    const roundedMax = Math.ceil(totalTime / 3600) * 3600;
    const tickStep = 3600;
    const tickValues = d3.range(0, roundedMax, tickStep);

    const tickFormatter = (d: d3.NumberValue): string => {
      const { hours } = paresSecondToTime(d as number);
      return String(Number(hours));
    };

    if (direction === "horizontal") {
      const axisGroup = group
        .append("g")
        .attr("transform", `translate(0, ${barSize + 1})`)
        .call(
          d3.axisBottom(scale).tickValues(tickValues).tickFormat(tickFormatter)
        )
        .attr("class", "text-lg lg:text-xs text-muted-foreground");

      // 👇 додаємо лейбу до осі X
      axisGroup
        .append("text")
        .attr("x", scale(roundedMax))
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .attr("x", scale(totalTime / 2))
        .attr("class", "text-md fill-foreground text-center")
        .text(t("chart.hours"));
    } else {
      const axisGroup = group
        .append("g")
        .call(
          d3.axisLeft(scale).tickValues(tickValues).tickFormat(tickFormatter)
        )
        .attr("class", "text-xs text-muted-foreground");

      axisGroup
        .append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -scale(totalTime / 2))
        .attr("y", -30)
        .attr("text-anchor", "end")
        .attr("class", "text-md fill-foreground text-center")
        .text(t("chart.hours"));
    }
  }, [
    data,
    showTooltip,
    hideTooltip,
    direction,
    barSize,
    timeLength,
    themeName,
    onHideTooltip,
    handleInteraction,
    t,
  ]);

  return (
    <div className="relative w-full">
      {TooltipElement}
      <svg
        ref={ref}
        className="w-full h-auto"
        style={{
          height: svgHeight,
        }}
      />
    </div>
  );
};

export default ChartTimeStackTasks;
