import ChartTitle from "@/pages/chart/chart-title";
import { DailyAnalyticsData } from "@/types/analytics/task-analytics.model";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const CENTER_X = 80;
const CENTER_Y = 80;
const RADIUS = 58;
const NEEDLE_LENGTH = 46;

const DailyProgressSpeedometer = ({ data }: { data: DailyAnalyticsData }) => {
  const { t, i18n } = useTranslation();
  const totalTime = Math.max(0, data.countTime);
  const doneTime = Math.max(0, data.countDoneTime);
  const totalHours = totalTime / 3600;
  const gaugeMaxHours = Math.max(1, Math.ceil(totalHours));
  const ratio = totalTime > 0 ? doneTime / totalTime : 0;
  const clampedRatio = Math.min(Math.max(ratio, 0), 1);

  const { needleX, needleY } = useMemo(() => {
    const angle = Math.PI * (1 - clampedRatio);
    return {
      needleX: CENTER_X + Math.cos(angle) * NEEDLE_LENGTH,
      needleY: CENTER_Y - Math.sin(angle) * NEEDLE_LENGTH,
    };
  }, [clampedRatio]);

  const formatHours = (seconds: number) =>
    new Intl.NumberFormat(i18n.language, {
      maximumFractionDigits: 1,
      minimumFractionDigits: seconds % 3600 === 0 ? 0 : 1,
    }).format(seconds / 3600);

  const tickCount = Math.min(6, gaugeMaxHours + 1);
  const tickValues = Array.from({ length: tickCount }, (_, idx) =>
    (gaugeMaxHours * idx) / (tickCount - 1),
  );
  const formatTickHour = (hours: number) =>
    Number.isInteger(hours)
      ? String(hours)
      : new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        }).format(hours);

  return (
    <div className="rounded-xl border border-white/10 bg-linear-to-b from-white to-zinc-50 p-3 shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:from-zinc-900/80 dark:to-zinc-950">
      <ChartTitle
        title="chart.speedometer_title"
        subtitle="chart.speedometer_subtitle"
      />
      <div className="mt-1 flex flex-col items-center">
        <svg viewBox="0 0 160 96" className="h-24 w-44">
          <path
            d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
            fill="none"
            stroke="rgba(52,211,153,0.95)"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${clampedRatio * 100} 100`}
          />
          {tickValues.map((tick) => {
            const tickRatio = tick / gaugeMaxHours;
            const angle = Math.PI * (1 - tickRatio);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x1 = CENTER_X + cos * (RADIUS - 11);
            const y1 = CENTER_Y - sin * (RADIUS - 11);
            const x2 = CENTER_X + cos * (RADIUS - 2);
            const y2 = CENTER_Y - sin * (RADIUS - 2);
            const tx = CENTER_X + cos * (RADIUS - 18);
            const ty = CENTER_Y - sin * (RADIUS - 18);
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(244,244,245,0.65)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(212,212,216,0.9)"
                  fontSize="6"
                  fontWeight="500"
                >
                  {formatTickHour(tick)}
                </text>
              </g>
            );
          })}
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={needleX}
            y2={needleY}
            stroke="rgba(239,68,68,0.95)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r="5"
            fill="rgba(244,244,245,0.95)"
            stroke="rgba(39,39,42,0.8)"
            strokeWidth="2"
          />
        </svg>
        <div className="mt-1 text-center">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {formatHours(totalTime)} {t("chart.hour")}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("chart.speedometer_total_hours")}
          </div>
          <div className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">
            {t("chart.speedometer_done_hours", { hours: formatHours(doneTime) })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressSpeedometer;
