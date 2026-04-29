import { RangeTaskAnalyticRecord } from "@/types/analytics/task-analytics.model";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/storage/themeStore";
import { ThemePalette, ThemeType } from "@/config/theme-colors.config";
import ChartTitle from "../chart/chart-title";

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

const LineChartTask = ({
  data,
  rangeFrom,
  rangeTo,
}: {
  data: RangeTaskAnalyticRecord[];
  rangeFrom?: Date;
  rangeTo?: Date;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [t] = useTranslation();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const themeColors = ThemePalette[selectedTheme ?? ThemeType.DARK] ?? ThemePalette[ThemeType.DARK];
  const margin = { top: 20, right: 80, bottom: 50, left: 50 };
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(400);

  const parsedData = useMemo(() => {
    const dataByDate = new Map(
      data.map((d) => [
        d.date,
        {
          timeDone: d.data.countTimeDone,
          notTimeDone: d.data.countNotTimeDone,
          activeTaskCount: d.data.countActiveTask,
        },
      ])
    );
    if (rangeFrom && rangeTo) {
      const allDates = getAllDatesInRange(rangeFrom, rangeTo);
      const toKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return allDates.map((date) => {
        const key = toKey(date);
        const existing = dataByDate.get(key);
        return {
          date,
          timeDone: existing?.timeDone ?? 0,
          notTimeDone: existing?.notTimeDone ?? 0,
          activeTaskCount: existing?.activeTaskCount ?? 0,
        };
      });
    }
    return data.map((d) => ({
      date: new Date(d.date),
      timeDone: d.data.countTimeDone,
      notTimeDone: d.data.countNotTimeDone,
      activeTaskCount: d.data.countActiveTask,
    }));
  }, [data, rangeFrom, rangeTo]);

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
    const wrapper = chartWrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const el = chartWrapperRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      if (w > 0) {
        setChartWidth(w);
        setDimensions({ width: w, height: 400 });
      }
    };

    const rafId = requestAnimationFrame(updateSize);
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect.width > 0) {
        setChartWidth(entry.contentRect.width);
        setDimensions({ width: entry.contentRect.width, height: 400 });
      }
    });
    resizeObserver.observe(wrapper);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [parsedData.length]);

  /** Діапазон дат, де є реальна активність: виконання задачі або timeDone > 0. */
  const xDomainTrimmed = useMemo(() => {
    const hasValue = (d: { activeTaskCount: number }) => d.activeTaskCount > 0;
    const firstIdx = parsedData.findIndex(hasValue);
    if (firstIdx < 0) {
      return d3.extent(parsedData, (d) => d.date) as [Date, Date];
    }
    const revIdx = [...parsedData].reverse().findIndex(hasValue);
    const lastIdx = revIdx < 0 ? firstIdx : parsedData.length - 1 - revIdx;
    return [parsedData[firstIdx].date, parsedData[Math.min(lastIdx, parsedData.length - 1)].date] as [Date, Date];
  }, [parsedData]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;
    svg.selectAll("*").remove();

    const innerW = chartWidth - margin.left - margin.right;
    const x = d3
      .scaleTime()
      .domain(xDomainTrimmed)
      .range([0, innerW]);

    /** Тільки точки в обрізаному діапазоні — лінії не виходять за межі */
    const chartData = parsedData.filter(
      (d) => d.date >= xDomainTrimmed[0] && d.date <= xDomainTrimmed[1]
    );

    const maxHoursChart =
      (d3.max(chartData, (d) => Math.max(d.timeDone, d.notTimeDone)) ?? 0) /
      3600;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(1, maxHoursChart)])
      .nice()
      .range([innerHeight, 0]);

    // Монотонна плавна лінія
    const lineCurve = d3.curveMonotoneX;

    const lineGreen = d3
      .line<{ date: Date; timeDone: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.timeDone / 3600))
      .curve(lineCurve);

    const lineRed = d3
      .line<{ date: Date; notTimeDone: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.notTimeDone / 3600))
      .curve(lineCurve);

    // Вісь Y
    svg
      .append("g")
      .attr("class", "line-chart-y-axis")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y).tickFormat((d) => `${d}${t("chart.hour")}`));

    // Група графіка (без zoom)
    const chartGroup = svg
      .append("g")
      .attr("class", "line-chart-main")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chartGroup
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .attr("class", "line-chart-x-axis-line");

    chartGroup
      .append("path")
      .attr("class", "line-path-green")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", themeColors.accent)
      .attr("stroke-dasharray", "10,5")
      .attr("stroke-width", 2)
      .attr("d", lineGreen);

    chartGroup
      .append("path")
      .attr("class", "line-path-red")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7)
      .attr("d", lineRed);

    chartGroup
      .selectAll(".dot-green")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "dot-green")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.timeDone / 3600))
      .attr("r", 2)
      .attr("fill", themeColors.accent)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    chartGroup
      .selectAll(".dot-red")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "dot-red")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.notTimeDone / 3600))
      .attr("r", 2)
      .attr("fill", themeColors["muted-foreground"])
      .attr("stroke", themeColors.background)
      .attr("stroke-width", 1)
      .attr("opacity", 0.7);

    const focus = chartGroup.append("g").style("display", "none");
    focus
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-width", 3)
      .attr("y1", 0)
      .attr("y2", innerHeight);

    // Легенда
    const legend = chartGroup.append("g").attr("transform", "translate(20, 0)");
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
      .text(t("chart.done_tasks"));
    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", themeColors["muted-foreground"])
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7);
    legend
      .append("text")
      .attr("x", 30)
      .attr("y", 25)
      .attr("fill", themeColors.foreground)
      .text(t("chart.undone_tasks"));

    // Прозорий rect для hover
    chartGroup
      .append("rect")
      .attr("class", "line-chart-hover-layer")
      .attr("width", Math.max(innerW, 1))
      .attr("height", Math.max(innerHeight, 1))
      .style("fill", "rgba(0,0,0,0.001)")
      .style("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("mouseover", () => focus.style("display", null))
      .on("mouseout", () => {
        focus.style("display", "none");
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      })
      .on("mousemove", function (event) {
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const svgRect = svgEl.getBoundingClientRect();
        const localX = event.clientX - svgRect.left - margin.left;
        const dataX = Math.max(0, Math.min(innerW, localX));
        const mouseDate = x.invert(dataX);

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

        focus.select("line").attr("transform", `translate(${x(d.date)}, 0)`);

        const tooltip = tooltipRef.current;
        if (tooltip) {
          tooltip.style.display = "block";
          tooltip.innerHTML = `
            <div><strong>${d3.timeFormat("%d-%m-%Y")(d.date)}</strong></div>
            <div>✅ ${Math.round(d.timeDone / 3600)} ${t("chart.hour")}</div>
            <div>❌ ${Math.round(d.notTimeDone / 3600)} ${t("chart.hour")}</div>
          `;

          const left = event.clientX;
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

    // Вісь X (статична)
    svg
      .append("g")
      .attr("class", "line-chart-x-axis")
      .attr("transform", `translate(${margin.left},${margin.top + innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(x.ticks(6))
          .tickFormat((d: Date | d3.NumberValue) =>
            d3.timeFormat("%d-%m-%Y")(d as Date)
          )
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  }, [
    parsedData,
    xDomainTrimmed,
    innerHeight,
    margin.left,
    margin.top,
    margin.right,
    t,
    selectedTheme,
    chartWidth,
  ]);

  return (
    <div ref={chartWrapperRef} className="w-full" style={{ minWidth: 0 }}>
      <div className="flex flex-wrap gap-2 justify-center items-center mb-2 relative z-10 pointer-events-auto">
        <ChartTitle title="chart.range_count_task_title" />
      </div>
      <div className="w-full overflow-auto">
        <svg
          ref={svgRef}
          width={Math.max(chartWidth, 1)}
          height={dimensions.height}
          style={{ display: "block", overflow: "visible" }}
        />
      </div>

      <div
        ref={tooltipRef}
        className="chart-tooltip fixed hidden rounded-md p-2 pointer-events-none shadow-xl z-50 text-sm transition-all backdrop-blur-sm"
      />
    </div>
  );
};

export default LineChartTask;
