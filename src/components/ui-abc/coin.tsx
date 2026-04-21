import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type CoinColor = "bronze" | "silver" | "gold";

type CoinPalette = {
  base: string;
  shine: string;
  edge: string;
  innerFrom: string;
  innerTo: string;
  icon: string;
};

const COIN_PALETTE: Record<CoinColor, CoinPalette> = {
  bronze: {
    base: "#8f4d20",
    shine: "#ffd59f",
    edge: "#e7a85f",
    innerFrom: "#f4c98b",
    innerTo: "#c0712e",
    icon: "#fff9f1",
  },
  silver: {
    base: "#6f7782",
    shine: "#ffffff",
    edge: "#d8e0eb",
    innerFrom: "#e9edf3",
    innerTo: "#9ea8b6",
    icon: "#f8fbff",
  },
  gold: {
    base: "#9a6c10",
    shine: "#fff2b3",
    edge: "#f8d14a",
    innerFrom: "#ffe58e",
    innerTo: "#c7901d",
    icon: "#fffbed",
  },
};

interface CoinProps {
  icon: LucideIcon;
  color: CoinColor;
  className?: string;
  iconClassName?: string;
  size?: number;
  title?: string;
}

const Coin = ({
  icon: Icon,
  color,
  className,
  iconClassName,
  size = 28,
  title,
}: CoinProps) => {
  const palette = COIN_PALETTE[color];
  const coinShadow =
    color === "gold"
      ? "inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.25), 0 0 18px rgba(250, 204, 21, 0.75), 0 0 34px rgba(245, 158, 11, 0.45)"
      : "inset 0 1px 2px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.25)";

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        width: size,
        height: size,
        border: `1px solid ${palette.base}`,
        background: `radial-gradient(circle at 30% 20%, ${palette.shine} 0%, ${palette.edge} 42%, ${palette.base} 100%)`,
        boxShadow: coinShadow,
      }}
      title={title}
      aria-label={title}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: Math.max(2, Math.round(size * 0.12)),
          border: `1px solid ${palette.edge}`,
          background: `radial-gradient(circle at 32% 20%, ${palette.shine} 0%, ${palette.innerFrom} 38%, ${palette.innerTo} 100%)`,
        }}
      />
      <Icon
        className={cn("relative z-[1] h-3.5 w-3.5", iconClassName)}
        style={{ color: palette.icon }}
        aria-hidden
      />
    </div>
  );
};

export default Coin;
