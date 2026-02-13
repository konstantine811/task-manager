import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

interface ChartPieCategoryProps {
  data: CategoryAnalyticsNameEntity;
  width?: number;
  height?: number;
  fillType?: "angle" | "radius"; // 👈 новий проп
}

interface PieEntity {
  name: string;
  time: number;
}

const ChartPieCategory = ({
  data,
  width = 400,
  height = 400,
  fillType = "radius", // 👈 новий проп з дефолтним значенням
}: ChartPieCategoryProps) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [t] = useTranslation();
  useEffect(() => {
    if (!ref.current) return;

    const radius = Math.min(width, height) / 2;
    const outerRadius = radius;
    const innerRadius = radius * 0.1;

    const entries = Object.entries(data).map(([id, value]) => ({
      name: id,
      time: value.time,
      doneTime: value.countDoneTime,
    }));

    const pie = d3.pie<PieEntity>().value((d) => d.time);

    const timeArcs = pie(entries);

    const arc = d3
      .arc<d3.PieArcDatum<PieEntity>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(6)
      .padAngle(0.02);

    const arcDoneAngle = d3
      .arc<d3.PieArcDatum<PieEntity>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(6)
      .padAngle(0.02);

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .append("g");

    // Main time arcs
    g.selectAll("path.base")
      .data(timeArcs)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("class", "fill-card stroke")
      .attr("stroke", "rgba(255,255,255,0.1)");

    if (fillType === "angle") {
      // done як сектор
      g.selectAll("path.done")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", (d, i) => {
          const entry = entries[i];
          const progress = entry.doneTime / entry.time;
          const angleRange = d.endAngle - d.startAngle;
          const newEndAngle = d.startAngle + angleRange * Math.min(progress, 1);
          const arcProgress = {
            ...d,
            endAngle: newEndAngle,
          };
          return arcDoneAngle(arcProgress);
        })
        .attr("class", "fill-accent stroke-0 stroke-accent/10");
    } else if (fillType === "radius") {
      // done як товщина кільця
      g.selectAll("path.done")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", (d, i) => {
          const entry = entries[i];
          const progress = Math.max(
            0,
            Math.min(entry.doneTime / entry.time, 1)
          );
          const currentOuter =
            innerRadius + (outerRadius - innerRadius) * progress;

          // arc із зовнішнім радіусом по прогресу
          const dynamicArc = d3
            .arc<d3.PieArcDatum<PieEntity>>()
            .innerRadius(innerRadius)
            .outerRadius(currentOuter)
            .cornerRadius(6)
            .padAngle(0.02);

          return dynamicArc(d);
        })
        .attr("class", "fill-accent stroke-0 stroke-accent/10");
    }

    // Optional: labels
    const labelArc = d3
      .arc<d3.PieArcDatum<PieEntity>>()
      .innerRadius((outerRadius + innerRadius) / 1.14)
      .outerRadius((outerRadius + innerRadius) / 1.14);

    g.selectAll("text")
      .data(timeArcs)
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const [x, y] = labelArc.centroid(d);
        const angle = ((d.startAngle + d.endAngle) / 2) * (180 / Math.PI);
        return `translate(${x}, ${y}) rotate(${
          angle < 180 ? angle - 90 : angle + 90
        })`;
      })
      .attr("text-anchor", (d) =>
        (d.endAngle + d.startAngle) / 2 > Math.PI ? "start" : "end"
      )
      .attr("alignment-baseline", "middle")
      .text((d) => {
        const key = `task_manager.categories.${d.data.name}`;
        const tr = t(key);
        return tr !== key ? tr : d.data.name;
      })
      .attr("class", "text-sm fill-zinc-400");
  }, [data, width, height, t, fillType, i18n.language]);

  return <svg ref={ref} className="w-full h-auto" />;
};

export default ChartPieCategory;
