import {
  HeartPulse,
  Wallet,
  Smile,
  Users,
  Briefcase,
  Sparkles,
  TrendingUp,
  Palette,
  Coffee,
  Sofa,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_STYLE: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  health: { icon: HeartPulse, color: "text-emerald-400" },
  finance: { icon: Wallet, color: "text-blue-400" },
  emotions: { icon: Smile, color: "text-amber-400" },
  relationships: { icon: Users, color: "text-rose-400" },
  career: { icon: Briefcase, color: "text-indigo-400" },
  spirituality: { icon: Sparkles, color: "text-violet-400" },
  personal_growth: { icon: TrendingUp, color: "text-cyan-400" },
  hobbies: { icon: Palette, color: "text-orange-400" },
  leisure: { icon: Coffee, color: "text-zinc-400" },
};

/** Default when category not in config */
export const DEFAULT_CATEGORY_STYLE = {
  icon: Sofa,
  color: "text-indigo-400",
};
