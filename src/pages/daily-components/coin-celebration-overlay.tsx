import Coin, { type CoinColor } from "@/components/ui-abc/coin";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { type CSSProperties } from "react";

export interface CoinCelebrationEvent {
  id: string;
  coinColor: CoinColor;
  label: string;
  Icon: LucideIcon;
}

const CoinCelebrationOverlay = ({
  events,
  onDone,
}: {
  events: CoinCelebrationEvent[];
  onDone: (id: string) => void;
}) => {
  return (
    <>
      {events.map((event) => {
        const confettiCount = 24;
        const confettiColors =
          event.coinColor === "gold"
            ? ["#fcd34d", "#f59e0b", "#fde68a"]
            : event.coinColor === "silver"
              ? ["#e2e8f0", "#cbd5e1", "#94a3b8"]
              : ["#f59e0b", "#d97706", "#fdba74"];
        const Icon = event.Icon;

        return (
          <motion.div
            key={event.id}
            className="pointer-events-none fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.45, rotateY: -900 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.45, 1.22, 1.1, 0.92],
              rotateY: [-900, -180, 640, 640],
            }}
            transition={{
              duration: 2.6,
              times: [0, 0.2, 0.82, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={() => onDone(event.id)}
            title={event.label}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center">
                <Coin
                  icon={Icon}
                  color={event.coinColor}
                  size={68}
                  title={event.label}
                />
                <span className="coin-confetti-flash" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {Array.from({ length: confettiCount }).map((_, confettiIndex) => {
                    const pieceSize = 7 + (confettiIndex % 4) * 2;
                    const pieceDistance = 58 + (confettiIndex % 6) * 10;
                    const pieceDuration = 1.02 + (confettiIndex % 5) * 0.08;
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
                        key={`${event.id}-overlay-confetti-${confettiIndex}`}
                        className="coin-confetti"
                        style={confettiStyle}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                {event.label}
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
};

export default CoinCelebrationOverlay;
