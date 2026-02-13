import {
  RangeTaskAnalyticRecord,
  ValueCurveOption,
} from "@/types/analytics/task-analytics.model";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/storage/themeStore";
import { ThemePalette, ThemeType } from "@/config/theme-colors.config";
import ChartTitle from "../chart/chart-title";
import SelectTypeLineChart from "./select-type-line-chart";

const LineChartTask = ({ data }: { data: RangeTaskAnalyticRecord[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [t] = useTranslation();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const themeColors = ThemePalette[selectedTheme ?? ThemeType.DARK] ?? ThemePalette[ThemeType.DARK];
  const [curveType, setCurveType] = useState<ValueCurveOption>(
    ValueCurveOption.curveCardinal
  );
  const yAxisRef = useRef<SVGSVGElement>(null);
  const margin = { top: 20, right: 80, bottom: 50, left: 50 };
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right);
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  const containerRef = useRef<HTMLDivElement>(null);

  const [chartWidth, setChartWidth] = useState(1000);

  const parsedData = useMemo(
    () =>
      data.map((d) => ({
        date: new Date(d.date),
        timeDone: d.data.countTimeDone,
        notTimeDone: d.data.countNotTimeDone,
      })),
    [data]
  );

  useEffect(() => {
    const handleScroll = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none";
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!yAxisRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const desiredWidth = Math.max(width, parsedData.length * 50); // 50px на точку
      setChartWidth(desiredWidth);
      setDimensions({ width: desiredWidth, height: 400 });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [parsedData.length]);

  useEffect(() => {
    if (!yAxisRef.current) return;

    const y = d3
      .scaleLinear()
      .domain([
        0,
        (d3.max(parsedData, (d) => Math.max(d.timeDone, d.notTimeDone)) ?? 0) /
          3600,
      ])
      .nice()
      .range([innerHeight, 0]);

    const yAxisSvg = d3.select(yAxisRef.current);
    yAxisSvg.selectAll("*").remove();

    yAxisSvg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y).tickFormat((d) => `${d}${t("chart.hour")}`));
  }, [parsedData, innerHeight, margin.left, margin.top, t]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const d3Curve = d3[curveType as keyof typeof d3] as d3.CurveFactory;
    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date) as [Date, Date])
      .range([0, chartWidth - margin.left - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        (d3.max(parsedData, (d) => Math.max(d.timeDone, d.notTimeDone)) ?? 0) /
          3600,
      ])
      .nice()
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const lineGreen = d3
      .line<{ date: Date; timeDone: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.timeDone / 3600))
      .curve(d3Curve);

    const lineRed = d3
      .line<{ date: Date; notTimeDone: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.notTimeDone / 3600))
      .curve(d3Curve);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(
            parsedData
              .map((d) => d.date)
              .filter((_, i, arr) => i % Math.ceil(arr.length / 6) === 0)
          )
          .tickFormat((d: Date | d3.NumberValue) =>
            d3.timeFormat("%d-%m-%Y")(d as Date)
          )
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", themeColors.accent)
      .attr("stroke-dasharray", "10,5")
      .attr("stroke-width", 2)
      .attr("d", lineGreen);

    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", themeColors.destructive)
      .attr("stroke-width", 2)
      .attr("d", lineRed);

    // dots
    g.selectAll(".dot-green")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "dot-green")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.timeDone / 3600))
      .attr("r", 2)
      .attr("fill", themeColors.accent)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    g.selectAll(".dot-red")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "dot-red")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.notTimeDone / 3600))
      .attr("r", 2)
      .attr("fill", themeColors.destructive)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // === Legend ===
    const legend = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 20},${margin.top})`);

    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", themeColors.accent)
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", 30)
      .attr("y", 5)
      .attr("fill", themeColors.foreground)
      .text(t("chart.done_tasks")); // наприклад: "Зроблені"

    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", themeColors.destructive)
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", 30)
      .attr("y", 25)
      .attr("fill", themeColors.foreground)
      .text(t("chart.undone_tasks")); // наприклад: "Незроблені"

    // === Hover interactivity ===
    const focus = g.append("g").style("display", "none");

    focus
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-width", 3)
      .attr("y1", 0)
      .attr("y2", innerHeight);

    svg
      .append("rect")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => focus.style("display", null))
      .on("mouseout", () => {
        focus.style("display", "none");
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      })
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event, this);
        const mouseDate = x.invert(mouseX);
        const bisect = d3.bisector((d: (typeof parsedData)[0]) => d.date).left;
        const idx = bisect(parsedData, mouseDate, 1);
        const d0 = parsedData[idx - 1];
        const d1 = parsedData[idx];

        const d = !d1
          ? d0
          : mouseDate.getTime() - d0.date.getTime() >
            d1.date.getTime() - mouseDate.getTime()
          ? d1
          : d0;

        const xPos = x(d?.date);

        // Move the line inside the SVG
        focus.select("line").attr("transform", `translate(${xPos},0)`);

        const tooltip = tooltipRef.current;
        if (tooltip) {
          tooltip.style.display = "block";
          tooltip.innerHTML = `
            <div><strong>${d3.timeFormat("%d-%m-%Y")(d.date)}</strong></div>
            <div>✅ ${Math.round(d.timeDone / 3600)} ${t("chart.hour")}</div>
            <div>❌ ${Math.round(d.notTimeDone / 3600)} ${t("chart.hour")}</div>
          `;

          const svgRect = svgRef.current?.getBoundingClientRect();
          if (!svgRect) return;
          const left = svgRect.left + margin.left + xPos;
          const top = svgRect.top + margin.top;
          const tooltipWidth = tooltip.offsetWidth;

          const showRight = left + tooltipWidth + 20 < window.innerWidth;
          tooltip.style.position = "fixed";
          tooltip.style.top = `${top}px`;
          tooltip.style.left = showRight
            ? `${left + 10}px`
            : `${left - tooltipWidth - 10}px`;
        }
      });
  }, [
    parsedData,
    innerHeight,
    margin.left,
    margin.top,
    margin.right,
    innerWidth,
    t,
    selectedTheme,
    curveType,
    chartWidth,
  ]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%" }}>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          <ChartTitle title="chart.range_count_task_title" />
          <SelectTypeLineChart value={curveType} onChange={setCurveType} />
        </div>
        <div
          ref={containerRef}
          style={{ display: "flex", width: "100%", overflowX: "hidden" }}
        >
          {/* Вісь Y */}
          <svg
            width={margin.left}
            height={dimensions.height - margin.bottom + 3}
            ref={yAxisRef}
            className="pointer-events-none absolute bg-background/50 backdrop-blur-sm"
          />

          {/* Прокручуваний графік */}
          <div
            style={{
              overflowX: "auto",
              width: "100%",
            }}
          >
            <div style={{ width: chartWidth - margin.left }}>
              <svg
                ref={svgRef}
                width={chartWidth - margin.left}
                height={dimensions.height}
              />
            </div>
          </div>

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="fixed hidden bg-zinc-800/95 border border-white/20 rounded-md p-2 pointer-events-none shadow-xl shadow-black/70 z-50 text-sm transition-all backdrop-blur-sm"
          />
        </div>
      </div>
    </>
  );
};

export default LineChartTask;
