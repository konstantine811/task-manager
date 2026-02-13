import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { NormalizedTask } from "@/types/drag-and-drop.model";
import { paresSecondToTime } from "@/utils/time.util";
import useChartTooltip from "../../chart/hooks/use-chart-tooltip";

const ChartTimePerTask = ({ data }: { data: NormalizedTask[] }) => {
  const ref = useRef<SVGSVGElement>(null);
  const { TooltipElement, showTooltip, hideTooltip } = useChartTooltip();

  useEffect(() => {
    if (!ref.current) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 10 };
    const width = 800;
    const height = 500;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // 🔽 Створюємо масив задач з часом
    const dataset = data
      .filter((d) => d.time > 0)
      .sort((a, b) => a.time - b.time);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(dataset, (d) => d.time)!])
      .range([0, width - margin.left - margin.right]);

    const y = d3
      .scaleBand()
      .domain(dataset.map((d) => d.title))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.2);

    const svgGroup = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    let activeNode: d3.BaseType | SVGGElement;
    // 🔽 Малюємо бари
    svgGroup
      .selectAll("rect")
      .data(dataset)
      .join("rect")
      .attr("y", (d) => y(d.title)!)
      .attr("width", (d) => x(d.time))
      .attr("height", y.bandwidth())
      .attr("class", "fill-accent")
      .attr("rx", 6)
      .on("pointerenter", function (event, d) {
        if (activeNode && activeNode !== this) {
          hideTooltip();
        }
        // 🟢 активуємо новий
        activeNode = this as SVGGElement;
        showTooltip({
          event,
          title: d.title,
          time: d.time,
        });
      })
      .on("mouseleave", function () {
        hideTooltip();
        activeNode = null;
      });

    // 🔽 X-вісь — час у годинах
    svgGroup
      .append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      //  .call(
      //       d3
      //         .axisBottom(x)
      //         .tickValues(tickValues)
      //         .tickFormat((time) => {
      //           const { hours } = paresSecondToTime(time as number);
      //           return String(Number(hours));
      //         })
      //     )
      .call(
        d3.axisBottom(x).tickFormat((d) => {
          const { hours } = paresSecondToTime(+d);
          return hours;
        })
      )
      .attr("class", "text-foreground text-sm");
  }, [data, showTooltip, hideTooltip]);

  return (
    <div className="relative w-full">
      {TooltipElement}
      <svg ref={ref} className="w-full h-auto" />
    </div>
  );
};

export default ChartTimePerTask;
