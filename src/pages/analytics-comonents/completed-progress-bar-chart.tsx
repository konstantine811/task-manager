import { RangeTaskAnalyticRecord } from "@/types/analytics/task-analytics.model";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { paresSecondToTime } from "@/utils/time.util";
import ChartTitle from "../chart/chart-title";
import { Slider } from "@/components/ui/slider";
import { useThemeStore } from "@/storage/themeStore";
import { ThemePalette, ThemeType } from "@/config/theme-colors.config";

function getAllDatesInRange(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const curr = new Date(from);
  curr.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (curr <= end) {
    out.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  return out;
}

const CompletedProgressBarChart = ({
  data,
  rangeFrom,
  rangeTo,
}: {
  data: RangeTaskAnalyticRecord[];
  rangeFrom?: Date;
  rangeTo?: Date;
}) => {
  const [t] = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(400);
  const [blendValue, setBlendValue] = useState([50]);
  const gradientId = useId().replace(/:/g, "-");
  const shadowId = useId().replace(/:/g, "-");
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const themeColors =
    ThemePalette[selectedTheme ?? ThemeType.DARK] ??
    ThemePalette[ThemeType.DARK];

  const parsedData = useMemo(() => {
    const dataByDate = new Map(
      data.map((d) => [
        d.date,
        {
          timeDone: d.data.countTimeDone,
          notTimeDone: d.data.countNotTimeDone,
        },
      ]),
    );

    if (rangeFrom && rangeTo) {
      const allDates = getAllDatesInRange(rangeFrom, rangeTo);
      const toKey = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate(),
        ).padStart(2, "0")}`;

      return allDates.map((date) => ({
        date,
        doneTime: dataByDate.get(toKey(date))?.timeDone ?? 0,
        notTimeDone: dataByDate.get(toKey(date))?.notTimeDone ?? 0,
      }));
    }

    return data.map((d) => ({
      date: new Date(d.date),
      doneTime: d.data.countTimeDone,
      notTimeDone: d.data.countNotTimeDone,
    }));
  }, [data, rangeFrom, rangeTo]);

  const trimmedData = useMemo(() => {
    const firstIdx = parsedData.findIndex(
      (d) => d.doneTime > 0 || d.notTimeDone > 0,
    );
    if (firstIdx < 0) {
      return parsedData;
    }

    const lastIdx =
      parsedData.length -
      1 -
      [...parsedData]
        .reverse()
        .findIndex((d) => d.doneTime > 0 || d.notTimeDone > 0);

    return parsedData.slice(firstIdx, lastIdx + 1);
  }, [parsedData]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const width = wrapper.getBoundingClientRect().width;
      if (width > 0) setChartWidth(width);
    };

    const rafId = requestAnimationFrame(updateSize);
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 56, left: 56 };
    const width = Math.max(chartWidth, 320);
    const height = 420;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chartData = trimmedData.length > 0 ? trimmedData : parsedData;
    const maxSeconds =
      d3.max(chartData, (d) => Math.max(d.doneTime, d.notTimeDone)) ?? 0;
    const maxHours = Math.max(1, Math.ceil(maxSeconds / 3600));
    const tickValues = Array.from({ length: maxHours + 1 }, (_, i) => i * 3600);
    const xDomain = chartData.map((d) => format(d.date, "yyyy-MM-dd"));
    const tickStep =
      chartData.length > 60
        ? 7
        : chartData.length > 30
          ? 4
          : chartData.length > 14
            ? 2
            : 1;
    const xTickValues = xDomain.filter((_, index) => index % tickStep === 0);
    const blend = blendValue[0] ?? 50;
    const barOpacity = blend <= 50 ? 1 : Math.max(0, 1 - (blend - 50) / 50);
    const lineOpacity = blend >= 50 ? 1 : Math.max(0, blend / 50);

    const x = d3
      .scaleBand()
      .domain(xDomain)
      .range([0, innerWidth])
      .padding(chartData.length > 14 ? 0.28 : 0.4);

    const y = d3
      .scaleLinear()
      .domain([0, maxHours * 3600])
      .nice()
      .range([innerHeight, 0]);

    const lineDone = d3
      .line<(typeof chartData)[number]>()
      .defined((d) => d.doneTime > 0)
      .x((d) => (x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.doneTime))
      .curve(d3.curveMonotoneX);

    const lineUndone = d3
      .line<(typeof chartData)[number]>()
      .defined((d) => d.notTimeDone > 0)
      .x((d) => (x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.notTimeDone))
      .curve(d3.curveMonotoneX);

    const root = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const defs = root.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0")
      .attr("y1", y(0))
      .attr("x2", "0")
      .attr("y2", y(maxHours * 3600));

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#34d399");
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#22d3ee");
    gradient.append("stop").attr("offset", "85%").attr("stop-color", "#818cf8");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fb7185");

    defs
      .append("filter")
      .attr("id", shadowId)
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

    const group = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    group
      .append("g")
      .selectAll("line.grid-y")
      .data(tickValues)
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-width", 1);

    group
      .append("g")
      .selectAll("line.grid-x")
      .data(xDomain)
      .join("line")
      .attr("x1", (d) => (x(d) ?? 0) + x.bandwidth() / 2)
      .attr("x2", (d) => (x(d) ?? 0) + x.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-width", 1);

    group
      .append("g")
      .attr("class", "text-zinc-400 text-[14px]")
      .call(
        d3
          .axisLeft(y)
          .tickValues(tickValues)
          .tickFormat((time) =>
            String(paresSecondToTime(time as number).hours),
          ),
      )
      .call((g) => {
        g.selectAll(".domain").remove();
        g.selectAll(".tick line").remove();
      });

    group
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "text-zinc-400 text-[14px]")
      .call(
        d3
          .axisBottom(x)
          .tickValues(xTickValues)
          .tickFormat((value) => {
            const date = new Date(`${value}T00:00:00`);
            return format(date, chartData.length > 14 ? "dd.MM" : "EEE");
          }),
      )
      .call((g) => {
        g.selectAll(".domain").remove();
        g.selectAll(".tick line").remove();
      })
      .selectAll("text")
      .attr("transform", chartData.length > 14 ? "rotate(-45)" : null)
      .style("text-anchor", chartData.length > 14 ? "end" : "middle");

    group
      .append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "fill-zinc-400 text-lg -rotate-90")
      .text(t("chart.hours"));

    group
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 54)
      .attr("text-anchor", "middle")
      .attr("class", "fill-zinc-400 text-lg")
      .text(t("chart.days"));

    const showTooltip = (
      event: MouseEvent,
      item: (typeof parsedData)[number],
    ) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const { hours, minutes } = paresSecondToTime(item.doneTime);
      const { hours: undoneHours, minutes: undoneMinutes } = paresSecondToTime(
        item.notTimeDone,
      );
      tooltip.innerHTML = `
        <div><strong>${format(item.date, "dd.MM.yyyy")}</strong></div>
        <div>✅ ${hours}:${minutes} ${t("chart.hour")}</div>
        <div>❌ ${undoneHours}:${undoneMinutes} ${t("chart.hour")}</div>
      `;
      tooltip.style.display = "block";
      tooltip.style.position = "fixed";
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
    };

    const hideTooltip = () => {
      if (tooltipRef.current) tooltipRef.current.style.display = "none";
    };

    group
      .append("g")
      .selectAll("rect")
      .data(chartData)
      .join("rect")
      .attr("x", (d) => x(format(d.date, "yyyy-MM-dd")) ?? 0)
      .attr("y", (d) => y(d.doneTime))
      .attr("width", x.bandwidth())
      .attr("height", (d) => Math.max(0, y(0) - y(d.doneTime)))
      .attr("fill", `url(#${gradientId})`)
      .attr("filter", `url(#${shadowId})`)
      .attr("opacity", barOpacity)
      .attr("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        showTooltip(event, d);
        d3.select(this).attr("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        showTooltip(event, d);
      })
      .on("mouseleave", function () {
        hideTooltip();
        d3.select(this).attr("opacity", barOpacity);
      });

    const lineGroup = group.append("g").attr("opacity", lineOpacity);

    lineGroup
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", themeColors.accent)
      .attr("stroke-dasharray", "10,5")
      .attr("stroke-width", 2)
      .attr("d", lineDone);

    lineGroup
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .attr("d", lineUndone);

    lineGroup
      .selectAll(".dot-done")
      .data(chartData.filter((d) => d.doneTime > 0))
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) => (x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2,
      )
      .attr("cy", (d) => y(d.doneTime))
      .attr("r", 2)
      .attr("fill", themeColors.accent)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    lineGroup
      .selectAll(".dot-undone")
      .data(chartData.filter((d) => d.notTimeDone > 0))
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) => (x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2,
      )
      .attr("cy", (d) => y(d.notTimeDone))
      .attr("r", 2)
      .attr("fill", themeColors["muted-foreground"])
      .attr("stroke", themeColors.background)
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    const focus = group.append("g").style("display", "none");
    focus
      .append("line")
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-width", 2)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("opacity", 0.6);

    const legend = group
      .append("g")
      .attr("transform", `translate(${Math.max(0, innerWidth - 180)}, 0)`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", -6)
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 4)
      .attr("fill", `url(#${gradientId})`)
      .attr("opacity", barOpacity);
    legend
      .append("text")
      .attr("x", 22)
      .attr("y", 5)
      .attr("fill", themeColors.foreground)
      .attr("font-size", 12)
      .text(t("chart.done_bar_legend"));

    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 22)
      .attr("x2", 14)
      .attr("y2", 22)
      .attr("stroke", themeColors.accent)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "10,5")
      .attr("opacity", lineOpacity);
    legend
      .append("text")
      .attr("x", 22)
      .attr("y", 26)
      .attr("fill", themeColors.foreground)
      .attr("font-size", 12)
      .text(t("chart.done_tasks"));

    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 42)
      .attr("x2", 14)
      .attr("y2", 42)
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", lineOpacity * 0.8);
    legend
      .append("text")
      .attr("x", 22)
      .attr("y", 46)
      .attr("fill", themeColors.foreground)
      .attr("font-size", 12)
      .text(t("chart.undone_tasks"));

    group
      .append("g")
      .selectAll("rect.hover-band")
      .data(chartData)
      .join("rect")
      .attr("x", (d) => x(format(d.date, "yyyy-MM-dd")) ?? 0)
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mouseenter", function (event, d) {
        focus.style("display", null);
        focus
          .select("line")
          .attr(
            "transform",
            `translate(${(x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2}, 0)`,
          );
        showTooltip(event, d);
      })
      .on("mousemove", function (event, d) {
        focus
          .select("line")
          .attr(
            "transform",
            `translate(${(x(format(d.date, "yyyy-MM-dd")) ?? 0) + x.bandwidth() / 2}, 0)`,
          );
        showTooltip(event, d);
      })
      .on("mouseleave", function () {
        focus.style("display", "none");
        hideTooltip();
      });
  }, [
    chartWidth,
    parsedData,
    trimmedData,
    t,
    gradientId,
    shadowId,
    themeColors,
    blendValue,
  ]);

  return (
    <div ref={wrapperRef} className="w-full min-w-0">
      <div className="rounded-xl border border-white/10 bg-linear-to-b from-white to-zinc-50 dark:from-zinc-900/80 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden chrono-chart-plot-bg">
        <div className="relative z-10 p-2 sm:p-3">
          <div className="mb-3">
            <ChartTitle
              title="chart.range_done_bar_title"
              subtitle="chart.range_done_bar_subtitle"
            />
          </div>
          <div className="mb-4 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span>{t("chart.done_bar_legend")}</span>
              <span>{t("chart.line_overlay_label")}</span>
            </div>
            <Slider
              value={blendValue}
              onValueChange={setBlendValue}
              min={0}
              max={100}
              step={1}
              className="**:data-[slot=slider-range]:bg-indigo-500 **:data-[slot=slider-thumb]:border-indigo-500 **:data-[slot=slider-thumb]:bg-white dark:**:data-[slot=slider-thumb]:bg-zinc-950"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-3xl bg-indigo-500/10 dark:bg-indigo-500/15 pointer-events-none" />
            <svg
              ref={svgRef}
              className="relative w-full h-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </div>
      <div
        ref={tooltipRef}
        className="chart-tooltip fixed hidden rounded-md p-2 pointer-events-none shadow-xl z-50 text-sm transition-all backdrop-blur-sm"
      />
    </div>
  );
};

export default CompletedProgressBarChart;
