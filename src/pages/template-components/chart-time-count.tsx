import {
  StackedDay,
  TaskAnalytics,
} from "@/types/analytics/task-analytics.model";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import { paresSecondToTime } from "@/utils/time.util";
import ChartTitle from "../chart/chart-title";
import useChartTooltip from "../chart/hooks/use-chart-tooltip";
import { Items } from "@/types/drag-and-drop.model";
import { getTaskAnalyticsData } from "@/services/task-menager/analytics/template-handle-data";
import { isTouchDevice } from "@/utils/touch-inspect";

const ChartTimeCount = ({ templateTasks }: { templateTasks: Items }) => {
  const [analyticsData, setAnalyticsData] = useState<TaskAnalytics>();
  const [t] = useTranslation();
  const { TooltipElement, showTooltip, hideTooltip } = useChartTooltip();
  const ref = useRef<SVGSVGElement>(null);
  const activeNodeRef = useRef<SVGGElement | null>(null);
  useEffect(() => {
    const analyticsData = getTaskAnalyticsData(templateTasks); // 🔄 Виклик функції для обробки шаблонних завдань
    setAnalyticsData(analyticsData);
  }, [templateTasks]);

  const onHideTooltip = useCallback((self: SVGGElement) => {
    d3.select(self).attr("class", "fill-transparent");
  }, []);

  const handleInteraction = useCallback(
    (event: PointerEvent, self: SVGGElement, d: d3.SeriesPoint<StackedDay>) => {
      const activeNode = activeNodeRef.current;

      // Якщо такий же — приховуємо
      if (activeNode && activeNode === self) {
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

      activeNodeRef.current = self; // Зберігаємо активний елемент
      const parentNode = (event.currentTarget as Element)
        .parentNode as Element | null;
      if (!parentNode) return;

      const parentGroup = d3.select(parentNode);
      const taskTitle = (parentGroup.datum() as { key: string }).key;
      const timeInSeconds = d[1] - d[0];
      d3.select(self).attr("class", "fill-white/20");
      showTooltip({
        event,
        title: taskTitle,
        time: timeInSeconds,
      });
    },
    [showTooltip, hideTooltip, onHideTooltip]
  );

  useEffect(() => {
    if (!ref.current) return;
    if (!analyticsData) return;
    const tasks = analyticsData.flattenTasks;
    const margin = { top: 20, right: 20, bottom: 30, left: 70 };
    const width = 800;
    const height = 600;
    const heightViewOffset = 40;
    const widthOffset = width - margin.left - margin.right;
    const heightOffset = height - margin.top - margin.bottom;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // Clean before render

    const group = svg
      .attr("viewBox", `0 0 ${width} ${height + heightViewOffset}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group and pivot
    const grouped = d3.group(tasks, (d) => d.day);

    const stackData: StackedDay[] = Array.from(grouped, ([day, group]) => {
      const entry: StackedDay = { day };
      group.forEach((task) => {
        entry[task.title] =
          typeof task.duration === "number" ? task.duration : 0;
      });
      return entry;
    });

    const keys = Array.from(new Set(tasks.map((d) => d.title)));

    // Сортуємо ключі за середньою тривалістю задач
    const keyDurations = new Map<string, number>();

    keys.forEach((key) => {
      const total = d3.sum(
        tasks.filter((t) => t.title === key).map((t) => t.duration || 0)
      );
      keyDurations.set(key, total);
    });

    const sortedKeys = [...keys].sort(
      (a, b) => (keyDurations.get(a) ?? 0) - (keyDurations.get(b) ?? 0)
    );
    // потім вже стек
    const stack = d3.stack<StackedDay>().keys(sortedKeys)(stackData);

    // Максимальна тривалість (у секундах)
    const maxSeconds =
      d3.max(stackData, (d) => d3.sum(keys, (k) => (d[k] as number) || 0)) || 0;

    const maxHours = Math.ceil(maxSeconds / 3600);
    const tickValues = Array.from({ length: maxHours + 1 }, (_, i) => i * 3600);

    const x = d3
      .scaleBand()
      .domain(stackData.map((d) => d.day.toString()))
      .range([0, widthOffset])
      .padding(0.6);

    const y = d3
      .scaleLinear()
      .domain([0, maxHours * 3600])
      .nice()
      .range([heightOffset, 0]);

    // X Axis
    group
      .append("g")
      .attr("transform", `translate(0, ${heightOffset})`)
      .attr("class", "text-zinc-400 text-[14px]")
      .call(
        d3.axisBottom(x).tickFormat((d) => {
          return t(`task_manager.day_names.${d}`);
        })
      )
      .call((g) => {
        g.select(".domain").remove(); // <– ця лінія внизу
        g.selectAll(".tick line").remove(); // <– видаляє вертикальні лінії (опційно)
      });

    // Add Y Axis label
    group
      .append("g")
      .attr("transform", `translate(${margin.right - 20},0)`)
      .attr("class", "text-zinc-400 text-md")
      .call(
        d3
          .axisLeft(y)
          .tickValues(tickValues)
          .tickFormat((time) => {
            const { hours } = paresSecondToTime(time as number);
            return String(Number(hours));
          })
      )
      .call((g) => {
        g.selectAll(".domain").remove();
        g.selectAll(".tick line").remove();
      });

    // add grid lines
    group
      .append("g")
      .selectAll("line.grid-x")
      .data(x.domain())
      .join("line")
      .attr("class", "grid-x stroke stroke-white/10")
      .attr("x1", (d) => x(d)! + x.bandwidth() / 2)
      .attr("x2", (d) => x(d)! + x.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", heightOffset);

    group
      .append("g")
      .selectAll("line.grid-y")
      .data(tickValues)
      .join("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", widthOffset)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-width", 1);
    // add vertical label
    group
      .append("g")
      .append("text")
      .attr("x", -heightOffset / 2)
      .attr("y", -margin.right - 10)
      .attr("text-anchor", "middle")
      .attr("class", "fill-zinc-400 text-lg -rotate-90")
      .text(t("chart.hours"));

    group
      .append("text") // X-вісь
      .attr("x", widthOffset / 2)
      .attr("y", heightOffset + margin.bottom + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("class", "fill-zinc-400 text-lg")
      .text(t("chart.days"));
    // Bars
    const totalPerDay = stackData.map((d) => ({
      day: d.day,
      total: d3.sum(keys, (k) => (d[k] as number) || 0),
    }));

    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "barGradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0")
      .attr("y1", y(0))
      .attr("x2", "0")
      .attr("y2", y(18 * 3600));

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#34d399");

    gradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#22d3ee");

    gradient
      .append("stop")
      .attr("offset", "85%")
      .attr("stop-color", "#818cf8");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fb7185");

    defs
      .append("filter")
      .attr("id", "bar-drop-shadow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 4)
      .attr("stdDeviation", 6)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.25);

    group
      .append("g")
      .selectAll("rect")
      .data(totalPerDay)
      .join("rect")
      .attr("x", (d) => x(d.day.toString())!)
      .attr("y", (d) => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.total))
      .attr("rx", 8)
      .attr("fill", "url(#barGradient)")
      .attr("filter", "url(#bar-drop-shadow)");
    const path = group
      .selectAll("g.layer-outline")
      .data(stack)
      .join("g")
      .attr("class", "stroke fill-transparent")
      .attr("stroke", "rgba(255,255,255,0.08)")
      .selectAll("rect")
      .data((d) => d)

      .join("rect")
      .attr("x", (d) => x(d.data.day.toString())!)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => {
        const h = y(d[0]) - y(d[1]);
        return isNaN(h) ? 0 : h;
      })
      .attr("width", x.bandwidth())
      .attr("rx", 4)
      .attr("id", (d) => {
        return `rect-${d.data.day}-${d[0]}-${d[1]}`;
      });
    if (isTouchDevice) {
      path.on("pointerdown", function (event, d) {
        handleInteraction(event, this as SVGGElement, d);
      });
    } else {
      path
        .on("pointerenter", function (event, d) {
          handleInteraction(event, this as SVGGElement, d);
        })
        .on("mouseleave", function () {
          if (activeNodeRef.current === this) {
            onHideTooltip(this as SVGGElement);
            hideTooltip();
            activeNodeRef.current = null;
          }
        });
    }
  }, [
    analyticsData,
    ref,
    t,
    showTooltip,
    hideTooltip,
    handleInteraction,
    onHideTooltip,
  ]);

  return (
    <div className="w-full relative">
      <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-2 sm:p-3">
          <div className="mb-2">
            <ChartTitle title="chart.count_chart_title" />
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-3xl bg-indigo-500/10 dark:bg-indigo-500/15 pointer-events-none" />
            <svg
              ref={ref}
              className="relative w-full h-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </div>
      {TooltipElement}
    </div>
  );
};

export default ChartTimeCount;
