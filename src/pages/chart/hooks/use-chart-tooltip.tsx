import { useCallback, useRef } from "react";
import * as d3 from "d3";
import { paresSecondToTime } from "@/utils/time.util";
import { useTranslation } from "react-i18next";

type ShowTooltipParams = {
  event: PointerEvent;
  title: string;
  time: number;
};

const useChartTooltip = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t] = useTranslation();
  const showTooltip = useCallback(
    ({ event, title, time }: ShowTooltipParams) => {
      if (!ref.current) return;
      const tooltip = ref.current;
      const { hours, minutes } = paresSecondToTime(time);
      const parsedHours = String(Number(hours));
      const offset = 16;

      d3.select(ref.current)
        .style("position", "fixed")
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`)
        .style("transform", `translate(${offset}px, ${offset}px)`)
        .style("display", "flex")
        .style("opacity", "1")
        .html(`
        <h3 class="text-zinc-300 text-center text-sm"><strong>${t(
          title
        )}</strong></h3>
        <div class="bg-accent/40 rounded-md text-center text-sm border border-white/15 inline-block px-2">
          ${parsedHours !== "0" ? parsedHours + t("chart.hour") : ""} ${
        minutes !== "00" ? minutes + t("chart.minute") : ""
      }
        </div>
      `);

      requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let tx = offset;
        let ty = offset;
        if (event.clientX + rect.width + offset > vw - 8) tx = -rect.width - offset;
        else if (event.clientX + tx < 8) tx = offset;
        if (event.clientY + rect.height + offset > vh - 8) ty = -rect.height - offset;
        else if (event.clientY + ty < 8) ty = offset;
        d3.select(ref.current).style("transform", `translate(${tx}px, ${ty}px)`);
      });
    },
    [t]
  );

  const hideTooltip = useCallback(() => {
    if (!ref.current) return;
    d3.select(ref.current).style("display", "none").style("opacity", 0);
  }, []);

  const TooltipElement = (
    <div
      ref={ref}
      className="fixed z-[100] max-w-sm p-2 text-sm bg-zinc-800/95 border border-white/20 rounded-lg shadow-xl shadow-black/70 will-change-transform pointer-events-none opacity-0 items-center flex-col gap-2 backdrop-blur-sm"
    />
  );

  return { TooltipElement, showTooltip, hideTooltip };
};

export default useChartTooltip;
