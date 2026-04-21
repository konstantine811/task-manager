import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import * as d3 from "d3";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
import Coin, { type CoinColor } from "@/components/ui-abc/coin";
import { motion } from "framer-motion";
import { useSoundEnabledStore } from "@/storage/soundEnabled";

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

type CoinIcon = typeof DEFAULT_CATEGORY_STYLE.icon;

interface CoinAwardItem {
  name: string;
  label: string;
  taskPct: number;
  Icon: CoinIcon;
  colorClass: string;
  coinColor: CoinColor;
  coinKey: string;
  coinTitle: string;
}

interface FlyingCoin {
  id: string;
  coinKey: string;
  Icon: CoinIcon;
  coinColor: CoinColor;
  size: number;
  startLeft: number;
  startTop: number;
  translateX: number;
  translateY: number;
  title: string;
}

const getCoinColorByTaskPercent = (taskPercent: number): CoinColor | null => {
  if (taskPercent >= 100) return "gold";
  if (taskPercent >= 65) return "silver";
  if (taskPercent > 30) return "bronze";
  return null;
};

const getCoinSoundVolume = (coinColor: CoinColor): number => {
  if (coinColor === "gold") return 1;
  if (coinColor === "silver") return 0.7;
  return 0.5;
};

const COIN_SOUND_START_OFFSET_SECONDS = 0;

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
  const coinTargetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevCoinStateRef = useRef<Record<string, CoinColor>>({});
  const flightRafRef = useRef<number | null>(null);
  const soundTimersRef = useRef<number[]>([]);
  const coinSpawnAudioRef = useRef<HTMLAudioElement | null>(null);
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([]);
  const [activeFlyingKeys, setActiveFlyingKeys] = useState<Set<string>>(
    new Set(),
  );
  const isSoundEnabled = useSoundEnabledStore((state) => state.isSoundEnabled);
  const [t] = useTranslation();

  const entries = Object.entries(data).map(([id, value]) => {
    const countTotal = value.taskDone.length + value.taskNoDone.length;
    const taskPct =
      countTotal > 0 ? Math.round((value.countDone / countTotal) * 100) : 0;
    /** Відсоток виконаного часу від запланованого (може бути > 100) */
    const timePct =
      value.time > 0 ? Math.round((value.countDoneTime / value.time) * 100) : 0;
    return {
      name: id,
      time: value.time,
      doneTime: value.countDoneTime,
      countDone: value.countDone,
      countTotal,
      taskPct,
      timePct,
      /** Segment size: completed time in completed-only mode, else planned total. Min 1 for pie. */
      segmentValue: Math.max(
        showCompletedOnly ? value.countDoneTime : value.time,
        1,
      ),
      categoryId: value.categoryId,
    };
  });

  const totalSec = entries.reduce((s, e) => s + e.doneTime, 0);
  const { hours: totalH, minutes: totalM } = paresSecondToTime(totalSec);
  const totalLabel = `${totalH}:${totalM}`;

  /** When showCompletedOnly: use ONLY completed time (doneTime) for segment size and share.
   * When includeAllCategories: show all entries (including 0). */
  const chartEntries =
    showCompletedOnly && !includeAllCategories
      ? entries.filter((e) => e.doneTime > 0)
      : entries;

  useEffect(() => {
    if (!ref.current) return;
    const svgNode = ref.current;

    const hidePieTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none";
      }
    };

    const handleGlobalHideTooltip = () => {
      hidePieTooltip();
    };

    const handleSvgPointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.('[data-pie-interactive="true"]')) {
        hidePieTooltip();
      }
    };

    const handleSvgPointerLeave = () => {
      hidePieTooltip();
    };

    window.addEventListener("scroll", handleGlobalHideTooltip, true);
    window.addEventListener("wheel", handleGlobalHideTooltip, { passive: true });
    window.addEventListener("touchmove", handleGlobalHideTooltip, {
      passive: true,
    });
    svgNode.addEventListener("pointermove", handleSvgPointerMove);
    svgNode.addEventListener("pointerleave", handleSvgPointerLeave);

    const radius = Math.min(width, height) / 2 - 4;
    const innerRadius = radius * 0.5;
    const outerRadius = radius - 4;

    if (chartEntries.length === 0) {
      hidePieTooltip();
      const svg = d3.select(svgNode);
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
          }),
        )
        .attr("fill", "rgba(161,161,170,0.2)")
        .attr("stroke", "rgba(161,161,170,0.3)")
        .attr("stroke-width", 1);

      return () => {
        window.removeEventListener("scroll", handleGlobalHideTooltip, true);
        window.removeEventListener("wheel", handleGlobalHideTooltip);
        window.removeEventListener("touchmove", handleGlobalHideTooltip);
        svgNode.removeEventListener("pointermove", handleSvgPointerMove);
        svgNode.removeEventListener("pointerleave", handleSvgPointerLeave);
      };
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

    const svg = d3.select(svgNode);
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
      const pct = showCompletedOnly
        ? totalSec > 0
          ? Math.round((entry.doneTime / totalSec) * 100)
          : 0
        : entry.time > 0
          ? Math.round((entry.doneTime / entry.time) * 100)
          : 0;
      const { hours: doneH, minutes: doneM } = paresSecondToTime(
        entry.doneTime,
      );
      const { hours: plannedH, minutes: plannedM } = paresSecondToTime(
        entry.time,
      );
      const timeStr = showCompletedOnly
        ? `${doneH}:${doneM}`
        : entry.time > 0
          ? `${doneH}:${doneM} / ${plannedH}:${plannedM}`
          : `0:00 / 0:00`;
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
        if (left + rect.width > window.innerWidth - 8)
          left = e.clientX - rect.width - 12;
        if (top + rect.height > window.innerHeight - 8)
          top = e.clientY - rect.height - 12;
        if (top < 8) top = 8;
        if (left < 8) left = 8;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });
    };

    if (showCompletedOnly) {
      g.selectAll("path.done-only")
        .data(timeArcs)
        .enter()
        .append("path")
        .attr("d", arcDoneAngle)
        .attr("data-pie-interactive", "true")
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
        .attr("data-pie-interactive", "true")
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
        .attr("data-pie-interactive", "true")
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
            Math.min(entry.time > 0 ? entry.doneTime / entry.time : 0, 1),
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
        .attr("data-pie-interactive", "true")
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

    return () => {
      hidePieTooltip();
      window.removeEventListener("scroll", handleGlobalHideTooltip, true);
      window.removeEventListener("wheel", handleGlobalHideTooltip);
      window.removeEventListener("touchmove", handleGlobalHideTooltip);
      svgNode.removeEventListener("pointermove", handleSvgPointerMove);
      svgNode.removeEventListener("pointerleave", handleSvgPointerLeave);
    };
  }, [
    chartEntries,
    width,
    height,
    fillType,
    showCompletedOnly,
    useTimeCompletion,
    includeAllCategories,
    i18n.language,
    t,
  ]);

  const legendItems = (
    includeAllCategories
      ? chartEntries
      : showCompletedOnly
        ? entries
        : chartEntries
  )
    .filter((e) => includeAllCategories || !showCompletedOnly || e.doneTime > 0)
    .map((e, i) => {
      /** In completed-only mode, % is share of completed time in total completed time. */
      const pct = showCompletedOnly
        ? totalSec > 0
          ? Math.round((e.doneTime / totalSec) * 100)
          : 0
        : e.time > 0
          ? Math.round(Math.min(100, (e.doneTime / e.time) * 100))
          : 0;
      const { hours: doneH, minutes: doneM } = paresSecondToTime(e.doneTime);
      const { hours: plannedH, minutes: plannedM } = paresSecondToTime(e.time);
      const timeLabel = showCompletedOnly
        ? `${doneH}:${doneM}`
        : e.time > 0
          ? `${doneH}:${doneM} / ${plannedH}:${plannedM}`
          : `0:00 / 0:00`;
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
        taskPct: e.taskPct,
        color: chartHex,
        Icon: style.icon,
        colorClass: style.color,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const coinItems: CoinAwardItem[] = legendItems.flatMap((item) => {
    const coinColor = getCoinColorByTaskPercent(item.taskPct);
    if (!coinColor) return [];
    return [
      {
        ...item,
        coinColor,
        coinKey: `coin-${item.name}`,
        coinTitle:
          t(`chart.coin_tier.${coinColor}`) !== `chart.coin_tier.${coinColor}`
            ? t(`chart.coin_tier.${coinColor}`)
            : coinColor,
      },
    ];
  });

  useEffect(() => {
    coinSpawnAudioRef.current = new Audio("/sfx/coins.wav");
    coinSpawnAudioRef.current.preload = "auto";
    return () => {
      if (coinSpawnAudioRef.current) {
        coinSpawnAudioRef.current.pause();
      }
      coinSpawnAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const currentCoinState = Object.fromEntries(
      coinItems.map((item) => [item.coinKey, item.coinColor] as const),
    );
    const prevCoinState = prevCoinStateRef.current;
    const currentKeys = new Set(Object.keys(currentCoinState));
    const triggeredItems = coinItems.filter((item) => {
      const prevColor = prevCoinState[item.coinKey];
      if (!prevColor) return true;
      if (prevColor === item.coinColor) return false;
      return item.coinColor === "silver" || item.coinColor === "gold";
    });
    prevCoinStateRef.current = currentCoinState;
    setActiveFlyingKeys(
      (prev) => new Set(Array.from(prev).filter((key) => currentKeys.has(key))),
    );

    if (flightRafRef.current !== null) {
      window.cancelAnimationFrame(flightRafRef.current);
      flightRafRef.current = null;
    }
    if (triggeredItems.length === 0) return;

    if (isSoundEnabled) {
      triggeredItems.forEach((item, index) => {
        const timerId = window.setTimeout(() => {
          const baseAudio = coinSpawnAudioRef.current;
          const audio =
            baseAudio && index === 0
              ? baseAudio
              : baseAudio
                ? (baseAudio.cloneNode(true) as HTMLAudioElement)
                : new Audio("/sfx/coins.wav");
          audio.volume = getCoinSoundVolume(item.coinColor);
          audio.currentTime = COIN_SOUND_START_OFFSET_SECONDS;
          void audio.play().catch(() => undefined);
        }, index * 120);
        soundTimersRef.current.push(timerId);
      });
    }

    flightRafRef.current = window.requestAnimationFrame(() => {
      const generatedFlights: FlyingCoin[] = [];
      const generatedKeys: string[] = [];

      triggeredItems.forEach((item) => {
        const target = coinTargetRefs.current[item.coinKey];
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const size = Math.max(34, Math.round(rect.width) || 34);
        const startLeft = window.innerWidth / 2 - size / 2;
        const startTop = window.innerHeight / 2 - size / 2;
        const endLeft = rect.left + rect.width / 2 - size / 2;
        const endTop = rect.top + rect.height / 2 - size / 2;

        generatedFlights.push({
          id: `${item.coinKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          coinKey: item.coinKey,
          Icon: item.Icon,
          coinColor: item.coinColor,
          size,
          startLeft,
          startTop,
          translateX: endLeft - startLeft,
          translateY: endTop - startTop,
          title: `${item.label} · ${item.taskPct}%`,
        });
        generatedKeys.push(item.coinKey);
      });

      if (generatedFlights.length > 0) {
        setFlyingCoins((prev) => [...prev, ...generatedFlights]);
        setActiveFlyingKeys((prev) => {
          const next = new Set(prev);
          generatedKeys.forEach((key) => next.add(key));
          return next;
        });
      }
      flightRafRef.current = null;
    });
  }, [coinItems, isSoundEnabled]);

  const handleFlightComplete = (flight: FlyingCoin) => {
    setFlyingCoins((prev) => prev.filter((item) => item.id !== flight.id));

    setActiveFlyingKeys((prev) => {
      if (!prev.has(flight.coinKey)) return prev;
      const next = new Set(prev);
      next.delete(flight.coinKey);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (flightRafRef.current !== null) {
        window.cancelAnimationFrame(flightRafRef.current);
        flightRafRef.current = null;
      }
      soundTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      soundTimersRef.current = [];
    };
  }, []);

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
      {flyingCoins.map((flight) => {
        const holdDuration = 2.4;
        const flyDuration = 0.9;
        const totalDuration = holdDuration + flyDuration;
        const holdPhase = holdDuration / totalDuration;
        const confettiCount = 24;
        const confettiColors =
          flight.coinColor === "gold"
            ? ["#fcd34d", "#f59e0b", "#fde68a"]
            : flight.coinColor === "silver"
              ? ["#e2e8f0", "#cbd5e1", "#94a3b8"]
              : ["#f59e0b", "#d97706", "#fdba74"];
        const Icon = flight.Icon;
        return (
          <div
            key={flight.id}
            className="pointer-events-none fixed z-[140]"
            style={{
              left: flight.startLeft,
              top: flight.startTop,
              width: flight.size,
              height: flight.size,
            }}
            title={flight.title}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, scale: 0.55, rotateY: -900 }}
              animate={{
                opacity: [0, 1, 1, 1],
                scale: [0.55, 1.16, 1.16, 1],
                rotateY: [-900, -220, 760, 0],
                x: [0, 0, 0, flight.translateX],
                y: [0, 0, 0, flight.translateY],
              }}
              transition={{
                duration: totalDuration,
                times: [0, 0.14, holdPhase, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
              onAnimationComplete={() => handleFlightComplete(flight)}
            >
              <Coin
                icon={Icon}
                color={flight.coinColor}
                size={flight.size}
                title={flight.title}
              />
            </motion.div>
            <span className="coin-confetti-flash" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {Array.from({ length: confettiCount }).map((_, confettiIndex) => {
                const pieceSize = 6 + (confettiIndex % 4) * 2;
                const pieceDistance = 44 + (confettiIndex % 6) * 10;
                const pieceDuration = 0.92 + (confettiIndex % 5) * 0.08;
                const pieceSpin = 160 + (confettiIndex % 7) * 60;
                const confettiStyle = {
                  "--coin-confetti-angle": `${(360 / confettiCount) * confettiIndex}deg`,
                  "--coin-confetti-delay": `${0.06 + confettiIndex * 0.02}s`,
                  "--coin-confetti-color":
                    confettiColors[confettiIndex % confettiColors.length],
                  "--coin-confetti-size": `${pieceSize}px`,
                  "--coin-confetti-distance": `${pieceDistance}px`,
                  "--coin-confetti-duration": `${pieceDuration}s`,
                  "--coin-confetti-spin": `${pieceSpin}deg`,
                } as CSSProperties;
                return (
                  <span
                    key={`${flight.id}-confetti-${confettiIndex}`}
                    className="coin-confetti"
                    style={confettiStyle}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="relative z-10 p-4 sm:p-5">
        {coinItems.length > 0 && (
          <div className="mb-4 rounded-lg border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5">
            <p className="mb-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-300/80">
              {t("chart.category_completion_rewards_title")}
            </p>
            <div className="flex flex-wrap items-stretch gap-2">
              {coinItems.map((item) => {
                const isFlying = activeFlyingKeys.has(item.coinKey);
                const Icon = item.Icon;
                return (
                  <div
                    key={item.coinKey}
                    className="coin-award-cell relative min-w-[86px] rounded-md border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-2 py-1.5 flex flex-col items-center justify-between"
                    title={`${item.label} · ${item.taskPct}%`}
                  >
                    <span
                      className={`text-[10px] leading-none font-semibold tracking-wide uppercase text-center max-w-[82px] truncate ${item.colorClass}`}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                    <div
                      ref={(node) => {
                        coinTargetRefs.current[item.coinKey] = node;
                      }}
                      className={`relative mt-1.5 transition-opacity duration-150 ${isFlying ? "opacity-0" : "opacity-100"}`}
                    >
                      <Coin
                        icon={Icon}
                        color={item.coinColor}
                        size={34}
                        title={`${item.label} · ${item.taskPct}%`}
                      />
                    </div>
                    <span className="mt-1 text-[10px] leading-none font-semibold tracking-wide text-zinc-600 dark:text-zinc-300/90 uppercase">
                      {item.coinTitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
